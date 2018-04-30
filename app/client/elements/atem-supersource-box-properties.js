(function () {
	'use strict';

	const {ipcRenderer} = require('electron');
	const Decimal = require('decimal.js');

	const DEFAULT_ANCHOR = 0.5;
	const DEFAULT_SIZE = 0.5;
	const VIDEO_MODE_1080P5994 = 13;
	const PIXEL_HEIGHT = 1080;
	const PIXEL_WIDTH = 1920;
	const ATEM_WIDTH = 48;
	const ATEM_HEIGHT = 27;

	const awaitingBlur = new Map();

	/**
	 * @customElement
	 * @polymer
	 */
	class AtemSupersourceBoxProperties extends Polymer.Element {
		static get is() {
			return 'atem-supersource-box-properties';
		}

		static get properties() {
			return {
				atemState: Object,
				boxId: Number,
				boxState: Object,
				videoMode: {
					type: Number,
					value: VIDEO_MODE_1080P5994
				},
				xAnchor: Number,
				yAnchor: Number,
				usePixelValues: {
					type: Boolean,
					value: true
				}
			};
		}

		static get observers() {
			return [
				'_boxStateChanged(boxState.*, usePixelValues, xAnchor, yAnchor)'
			];
		}

		ready() {
			super.ready();
			this.take = this.take.bind(this);
			this._take = this._take.bind(this);

			this.addEventListener('change', this.take);
			this.addEventListener('selected-item-changed', this.take);

			/* The "Input" event is needed to react to the number spinners being hit.
			 * However, this event doesn't bubble up through the shadow boundary of paper-input.
			 * Therefore, we need to pierce the shadow boundary and attach the listener directly to the input. */
			this.shadowRoot.querySelectorAll('paper-input').forEach(paperInput => {
				paperInput.shadowRoot.querySelector('input').addEventListener('input', () => {
					this.take();
				});
			});
		}

		take() {
			this._takeDebouncer = Polymer.Debouncer.debounce(
				this._takeDebouncer,
				Polymer.Async.timeOut.after(0),
				this._take
			);
		}

		resetPosition() {
			ipcRenderer.send('atem:takeSuperSourceBoxProperties', {
				boxId: this.boxId,
				properties: {
					x: 0,
					y: 0
				}
			});
		}

		resetSize() {
			ipcRenderer.send('atem:takeSuperSourceBoxProperties', {
				boxId: this.boxId,
				properties: {
					size: this._multiplyBy1000(DEFAULT_SIZE)
				}
			});
		}

		resetCrop() {
			ipcRenderer.send('atem:takeSuperSourceBoxProperties', {
				boxId: this.boxId,
				properties: {
					cropTop: 0,
					cropBottom: 0,
					cropLeft: 0,
					cropRight: 0
				}
			});
		}

		resetAll() {
			this.resetPosition();
			this.resetSize();
			this.resetCrop();
		}

		_take() {
			if (this.xAnchor === 'undefined' || this.yAnchor === 'undefined') {
				return;
			}

			if (this.$.x.value === '-' || this.$.x.value === '' ||
				this.$.y.value === '-' || this.$.y.value === '') {
				return;
			}

			let x = this.$.x.value;
			let y = this.$.y.value;

			if (this.usePixelValues) {
				x = convertRange(x, [-PIXEL_WIDTH, PIXEL_WIDTH * 2], [-ATEM_WIDTH, ATEM_WIDTH]);
				y = convertRange(y, [-PIXEL_HEIGHT, PIXEL_HEIGHT * 2], [ATEM_HEIGHT, -ATEM_HEIGHT]);
			}

			x = this.anchorDecode(x, 16, this.xAnchor, this.$.size.value);
			y = this.anchorDecode(y, 9, this.yAnchor, this.$.size.value);

			ipcRenderer.send('atem:takeSuperSourceBoxProperties', {
				boxId: this.boxId,
				properties: {
					source: this.$.source.selected,
					enabled: this.$.enabled.checked,
					x,
					y,
					size: this._multiplyBy1000(this.$.size.value),
					cropped: this.$.crop.enabled,
					cropTop: this._multiplyBy1000(this.$.crop.top),
					cropBottom: this._multiplyBy1000(this.$.crop.bottom),
					cropLeft: this._multiplyBy1000(this.$.crop.left),
					cropRight: this._multiplyBy1000(this.$.crop.right)
				}
			});
		}

		_boxStateChanged() {
			if (!this.boxState || this.xAnchor === 'undefined' || this.yAnchor === 'undefined') {
				return;
			}

			const newState = this.boxState;

			let x = this.anchorEncode(newState.x, 16, this.xAnchor, newState.size);
			if (this.usePixelValues) {
				x = convertRange(x, [-ATEM_WIDTH, ATEM_WIDTH], [-PIXEL_WIDTH, PIXEL_WIDTH * 2]);
			}

			let y = this.anchorEncode(newState.y, 9, this.yAnchor, newState.size);
			if (this.usePixelValues) {
				y = convertRange(y, [ATEM_HEIGHT, -ATEM_HEIGHT], [-PIXEL_HEIGHT, PIXEL_HEIGHT * 2]);
			}

			this._setInputValue(this.$.x, x);
			this._setInputValue(this.$.y, y);
			this._setInputValue(this.$.size, this._divideBy1000(newState.size));
			this._setInputValue(this.$.crop.$.top, this._divideBy1000(newState.cropTop));
			this._setInputValue(this.$.crop.$.bottom, this._divideBy1000(newState.cropBottom));
			this._setInputValue(this.$.crop.$.left, this._divideBy1000(newState.cropLeft));
			this._setInputValue(this.$.crop.$.right, this._divideBy1000(newState.cropRight));
		}

		_addOne(number) {
			return number + 1;
		}

		_divideBy100(number) {
			return number / 100;
		}

		_divideBy1000(number) {
			return number / 1000;
		}

		_multiplyBy100(number) {
			return Math.floor(number * 100);
		}

		_multiplyBy1000(number) {
			return Math.floor(number * 1000);
		}

		_setInputValue(input, newValue) {
			if (awaitingBlur.has(input)) {
				awaitingBlur.set(input, newValue);
				return;
			}

			if (input.focused) {
				input.addEventListener('blur', () => {
					newValue = awaitingBlur.get(input);
					awaitingBlur.delete(input);
					this._setInputValue(input, newValue);
				}, {once: true, passive: true});
				awaitingBlur.set(input, newValue);
				return;
			}

			if (input.value === newValue) {
				return;
			}

			input.value = newValue;
		}

		_ternary(condition, a, b) {
			return condition ? a : b;
		}

		_calcSizePixels(size) {
			const width = new Decimal(1920).times(size).dividedBy(1000);
			const height = new Decimal(1080).times(size).dividedBy(1000);
			return `${width.toDecimalPlaces(0)}x${height.toDecimalPlaces(0)}`;
		}

		anchorEncode(value, maxValue, anchor = DEFAULT_ANCHOR, size = DEFAULT_SIZE) {
			value = new Decimal(value);
			anchor = new Decimal(anchor);
			size = new Decimal(size).dividedBy(10);

			const result = value.minus(size.times(maxValue)).plus(size.times(maxValue * 2).times(anchor));
			return result.dividedBy(100).toDecimalPlaces(2).toNumber();
		}

		anchorDecode(value, maxValue, anchor = DEFAULT_ANCHOR, size = DEFAULT_SIZE) {
			const one = new Decimal(1);
			value = new Decimal(value);
			anchor = new Decimal(anchor);
			size = new Decimal(size);

			const z1 = value.minus(size.times(maxValue * 2).times(anchor));
			const z2 = value.plus(size.times(maxValue * 2).times(one.minus(anchor)));
			const result = z1.plus(z2).dividedBy(2);
			return result.times(100).toDecimalPlaces(0).toNumber();
		}
	}

	function convertRange(value, fromRange, toRange) { // eslint-disable-line no-unused-vars
		if (typeof value === 'string') {
			value = parseFloat(value);
		}

		value = new Decimal(value);
		const fr0 = new Decimal(fromRange[0]);
		const fr1 = new Decimal(fromRange[1]);
		const tr0 = new Decimal(toRange[0]);
		const tr1 = new Decimal(toRange[1]);

		const result = (
			value
				.minus(fr0)
				.times(tr1.minus(tr0).dividedBy(fr1.minus(fr0)))
		).plus(tr0);

		return result.toDecimalPlaces(2).toNumber();
	}

	customElements.define(AtemSupersourceBoxProperties.is, AtemSupersourceBoxProperties);
})();

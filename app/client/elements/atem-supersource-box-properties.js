(function () {
	'use strict';

	const {ipcRenderer} = require('electron');
	const Decimal = require('decimal.js');

	const DEFAULT_ANCHOR = 0.5;
	const DEFAULT_SIZE = 0.5;
	const VIDEO_MODE_1080P5994 = 13;

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
				yAnchor: Number
			};
		}

		static get observers() {
			return [
				'_boxStateChanged(boxState.*, xAnchor, yAnchor)'
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

			ipcRenderer.send('atem:takeSuperSourceBoxProperties', {
				boxId: this.boxId,
				properties: {
					source: this.$.source.selected,
					enabled: this.$.enabled.checked,
					x: this._fooAnchorDecode(this.$.x.value, 16, this.xAnchor, this.$.size.value),
					y: this._fooAnchorDecode(this.$.y.value, 9, this.yAnchor, this.$.size.value),
					size: this._multiplyBy1000(this.$.size.value),
					cropped: this.$.cropped.checked,
					cropTop: this._multiplyBy1000(this.$.cropTop.value),
					cropBottom: this._multiplyBy1000(this.$.cropBottom.value),
					cropLeft: this._multiplyBy1000(this.$.cropLeft.value),
					cropRight: this._multiplyBy1000(this.$.cropRight.value)
				}
			});
		}

		_boxStateChanged() {
			if (!this.boxState || this.xAnchor === 'undefined' || this.yAnchor === 'undefined') {
				return;
			}

			const newState = this.boxState;
			this._setInputValue(this.$.x, this._fooAnchorEncode(newState.x, 16, this.xAnchor, newState.size));
			this._setInputValue(this.$.y, this._fooAnchorEncode(newState.y, 9, this.yAnchor, newState.size));
			this._setInputValue(this.$.size, this._divideBy1000(newState.size));
			this._setInputValue(this.$.cropTop, this._divideBy1000(newState.cropTop));
			this._setInputValue(this.$.cropBottom, this._divideBy1000(newState.cropBottom));
			this._setInputValue(this.$.cropLeft, this._divideBy1000(newState.cropLeft));
			this._setInputValue(this.$.cropRight, this._divideBy1000(newState.cropRight));
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

		_fooAnchorEncode(value, maxValue, anchor = DEFAULT_ANCHOR, size = DEFAULT_SIZE) {
			value = new Decimal(value);
			anchor = new Decimal(anchor);
			size = new Decimal(size).dividedBy(10);

			const result = value.minus(size.times(maxValue)).plus(size.times(maxValue * 2).times(anchor));
			return result.dividedBy(100).toDecimalPlaces(2).toNumber();
		}

		_fooAnchorDecode(value, maxValue, anchor = DEFAULT_ANCHOR, size = DEFAULT_SIZE) {
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

	function convertRange(value, r1, r2) { // eslint-disable-line no-unused-vars
		if (typeof value === 'string') {
			value = parseFloat(value);
		}

		const result = (
			(value - r1[0]) *
			(r2[1] - r2[0]) / (r1[1] - r1[0])
		) + r2[0];

		return Math.floor(result);
	}

	customElements.define(AtemSupersourceBoxProperties.is, AtemSupersourceBoxProperties);
})();

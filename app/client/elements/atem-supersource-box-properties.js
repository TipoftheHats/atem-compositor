(function () {
	'use strict';

	const {ipcRenderer} = require('electron');
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
				}
			};
		}

		static get observers() {
			return [
				'_boxStateChanged(boxState.*)'
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
					size: 500
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
			ipcRenderer.send('atem:takeSuperSourceBoxProperties', {
				boxId: this.boxId,
				properties: {
					source: this.$.source.selected,
					enabled: this.$.enabled.checked,
					x: this._undoDivideBy100(this.$.x.value),
					y: this._undoDivideBy100(this.$.y.value),
					size: this._undoDivideBy1000(this.$.size.value),
					cropped: this.$.cropped.checked,
					cropTop: this._undoDivideBy1000(this.$.cropTop.value),
					cropBottom: this._undoDivideBy1000(this.$.cropBottom.value),
					cropLeft: this._undoDivideBy1000(this.$.cropLeft.value),
					cropRight: this._undoDivideBy1000(this.$.cropRight.value)
				}
			});
		}

		_boxStateChanged() {
			const newState = this.boxState;
			this._setInputValue(this.$.x, this._divideBy100(newState.x));
			this._setInputValue(this.$.y, this._divideBy100(newState.y));
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

		_undoDivideBy100(number) {
			return Math.floor(number * 100);
		}

		_undoDivideBy1000(number) {
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

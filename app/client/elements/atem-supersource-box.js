(function () {
	'use strict';

	const {ipcRenderer} = require('electron');

	const DEFAULT_SIZE = 500;

	/**
	 * @customElement
	 * @polymer
	 */
	class AtemSupersourceBox extends Polymer.Element {
		static get is() {
			return 'atem-supersource-box';
		}

		static get properties() {
			return {
				atemState: Object,
				boxId: Number,
				boxState: Object
			};
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
					size: DEFAULT_SIZE
				}
			});
		}

		takeEnabled(e) {
			ipcRenderer.send('atem:takeSuperSourceBoxProperties', {
				boxId: this.boxId,
				properties: {
					enabled: e.detail.value
				}
			});
		}

		takeProperties(e) {
			ipcRenderer.send('atem:takeSuperSourceBoxProperties', {
				boxId: this.boxId,
				properties: e.detail.properties
			});
		}

		_addOne(number) {
			return number + 1;
		}
	}

	customElements.define(AtemSupersourceBox.is, AtemSupersourceBox);
})();

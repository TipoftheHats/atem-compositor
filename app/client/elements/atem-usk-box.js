(function () {
	'use strict';

	const {ipcRenderer} = require('electron');

	const DEFAULT_SIZE = 500;

	/**
	 * @customElement
	 * @polymer
	 */
	class AtemUskBox extends Polymer.Element {
		static get is() {
			return 'atem-usk-box';
		}

		static get properties() {
			return {
				atemState: Object,
				uskState: {
					type: Object,
					notify: true,
					computed: '_computeUskState(atemState, selectedMeIndex, selectedUskIndex)'
				}
			};
		}

		resetCrop() {
			ipcRenderer.send('atem:takeUskDveSettings', {
				mixEffect: this.selectedMeIndex,
				upstreamKeyerId: this.selectedUskIndex,
				properties: {
					maskTop: 0,
					maskBottom: 0,
					maskLeft: 0,
					maskRight: 0
				}
			});
		}

		resetPosition() {
			ipcRenderer.send('atem:takeUskDveSettings', {
				mixEffect: this.selectedMeIndex,
				upstreamKeyerId: this.selectedUskIndex,
				properties: {
					positionX: 0,
					positionY: 0
				}
			});
		}

		resetSize() {
			ipcRenderer.send('atem:takeUskDveSettings', {
				mixEffect: this.selectedMeIndex,
				upstreamKeyerId: this.selectedUskIndex,
				properties: {
					sizeX: DEFAULT_SIZE,
					sizeY: DEFAULT_SIZE
				}
			});
		}

		takeEnabled(e) {
			ipcRenderer.send('atem:takeUskOnAir', {
				mixEffect: this.selectedMeIndex,
				upstreamKeyerId: this.selectedUskIndex,
				onAir: e.detail.value
			});
		}

		takeProperties(e) {
			const newProps = e.detail.properties;

			ipcRenderer.send('atem:takeUskFillSource', {
				mixEffect: this.selectedMeIndex,
				upstreamKeyerId: this.selectedUskIndex,
				fillSource: newProps.source
			});

			ipcRenderer.send('atem:takeUskDveSettings', {
				mixEffect: this.selectedMeIndex,
				upstreamKeyerId: this.selectedUskIndex,
				properties: {
					positionX: newProps.x,
					positionY: newProps.y,
					sizeX: newProps.size,
					sizeY: newProps.size,
					maskEnabled: newProps.cropped,
					maskTop: newProps.cropTop,
					maskBottom: newProps.cropBottom,
					maskLeft: newProps.cropLeft,
					maskRight: newProps.cropRight
				}
			});
		}

		acceptCover() {
			ipcRenderer.send('atem:setUskAsDve', {
				mixEffect: this.selectedMeIndex,
				upstreamKeyerId: this.selectedUskIndex
			});
		}

		_computeUskState(atemState, selectedMeIndex, selectedUskIndex) {
			selectedMeIndex = parseInt(selectedMeIndex, 10);
			selectedUskIndex = parseInt(selectedUskIndex, 10);

			if (!atemState || typeof selectedMeIndex !== 'number' || typeof selectedUskIndex !== 'number') {
				return;
			}

			const meState = atemState.video.ME[selectedMeIndex];
			if (!meState) {
				return;
			}

			const uskState = atemState.video.ME[selectedMeIndex].upstreamKeyers[selectedUskIndex];
			if (!uskState) {
				return;
			}

			return uskState;
		}

		_isDveTaken(activeDveUsk, selectedUsk) {
			if (!activeDveUsk || !selectedUsk) {
				return false;
			}

			return activeDveUsk !== selectedUsk;
		}

		_calcBoxState(uskState) {
			if (!uskState) {
				return;
			}

			return {
				source: uskState.fillSource,
				x: uskState.dveSettings.positionX,
				y: uskState.dveSettings.positionY,
				size: uskState.dveSettings.sizeX,
				cropped: uskState.dveSettings.maskEnabled,
				cropTop: uskState.dveSettings.maskTop,
				cropBottom: uskState.dveSettings.maskBottom,
				cropLeft: uskState.dveSettings.maskLeft,
				cropRight: uskState.dveSettings.maskRight
			};
		}

		_addOne(number) {
			return parseInt(number, 10) + 1;
		}
	}

	customElements.define(AtemUskBox.is, AtemUskBox);
})();

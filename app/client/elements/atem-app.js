(function () {
	'use strict';

	const {ipcRenderer} = require('electron');
	Polymer.setPassiveTouchGestures(true); // Added in Polymer v2.1.0

	/**
	 * @customElement
	 * @polymer
	 */
	class AtemApp extends Polymer.Element {
		static get is() {
			return 'atem-app';
		}

		static get properties() {
			return {
				atemState: Object
			};
		}

		ready() {
			super.ready();

			ipcRenderer.on('atem:stateChanged', (event, state) => {
				this.atemState = state;
				console.log('atem:stateChanged:', state);
			});

			ipcRenderer.on('updateDownloaded', (event, info) => {
				this.$['updateDialog-label'].innerText = `A new version (${info.version}) is ready to install. Would you like to install it now?`;
				this.$.updateDialog.open();
			});

			ipcRenderer.send('init');
		}

		_handleUpdateDialogClosed(e) {
			if (e.detail.confirmed) {
				ipcRenderer.send('installUpdateNow');
			}
		}
	}

	customElements.define(AtemApp.is, AtemApp);
})();

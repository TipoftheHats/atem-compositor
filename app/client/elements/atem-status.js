(function () {
	'use strict';
	const {ipcRenderer} = require('electron');

	/**
	 * @customElement
	 * @polymer
	 */
	class AtemStatus extends Polymer.Element {
		static get is() {
			return 'atem-status';
		}

		static get properties() {
			return {
				status: {
					type: String,
					reflectToAttribute: true,
					notify: true,
					value: 'offline'
				}
			};
		}

		ready() {
			super.ready();
			ipcRenderer.on('atem-connection-status', (event, status) => {
				this.status = status;
				console.log('new status:', status);
			});

			this.addEventListener('click', () => {
				ipcRenderer.send('openConnectionWindow');
			});
		}
	}

	customElements.define(AtemStatus.is, AtemStatus);
})();

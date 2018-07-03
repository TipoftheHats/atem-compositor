(function () {
	'use strict';

	const {ipcRenderer} = require('electron');
	const recentConnections = ipcRenderer.sendSync('getRecentConnectionsSync');

	/**
	 * @customElement
	 * @polymer
	 */
	class ATEMSettings extends Polymer.Element {
		static get is() {
			return 'atem-settings';
		}

		static get properties() {
			return {
				recentConnections: {
					type: Array,
					value: recentConnections.slice(0, 5)
				},
				ip: String,
				port: {
					type: Number,
					value: 9910
				}
			};
		}

		static get observers() {
			return [
				'_updateSelectedRecentConnection(ip, port)'
			];
		}

		connect() {
			ipcRenderer.sendSync('submitIpPort', this.ip, parseInt(this.port, 10));
		}

		cancel() {
			ipcRenderer.send('closeConnectionWindow');
		}

		formatTimestamp(timestamp) {
			return new Date(timestamp).toLocaleString({
				year: 'numeric',
				month: 'numeric',
				day: 'numeric',
				hour: 'numeric',
				minute: '2-digit',
				second: '2-digit'
			});
		}

		_updateSelectedRecentConnection(ip, port) {
			this.$.recentConnections.selected = this.recentConnections.findIndex(rc => {
				return rc.ip === ip && rc.port === parseInt(port, 10);
			});
		}

		_handleInputKeyDown(e) {
			// Enter key
			if (e.which === 13) {
				this.submit();
			}
		}

		_calcRecentConnectionsHidden(recentConnections) {
			return !recentConnections || recentConnections.length <= 0;
		}

		_selectedRecentConnectionChanged(e) {
			const selectedRecentConnection = this.recentConnections[e.detail.value];
			if (selectedRecentConnection) {
				this.ip = selectedRecentConnection.ip;
				this.port = selectedRecentConnection.port;
			}
		}
	}

	customElements.define(ATEMSettings.is, ATEMSettings);
})();

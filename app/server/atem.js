'use strict';

// Packages
const {Atem} = require('atem-connection');
const log = require('electron-log');
const {ipcMain} = require('electron');

const atem = new Atem();
let mainWindow;
let lastAtemStatus = '';
let stateChangesWaiting = false;

atem.socket.on('disconnect', () => {
	setATEMConnectionStatus('offline');
});

atem.socket.on('reconnect', () => {
	setATEMConnectionStatus('connecting');
});

atem.socket.on('connect', () => {
	setATEMConnectionStatus('connected');
});

module.exports = {
	async init(mw) {
		mainWindow = mw;

		atem.on('stateChanged', () => {
			stateChangesWaiting = true;
		});

		ipcMain.on('init', () => {
			log.debug('Received "init" message from main window');
			sendToMainWindow('atem-connection-status', lastAtemStatus);
			sendToMainWindow('atem:stateChanged', atem.state);
		});

		ipcMain.on('atem:takeSuperSourceBoxProperties', (event, {boxId, properties}) => {
			log.debug(`Attempting to take SSBP #${boxId}...`);
			atem.setSuperSourceBoxSettings(properties, boxId).then(() => {
				log.debug(`Successfully took SSBP #${boxId}`);
			}).catch(e => {
				log.error(`Failed to take SSBP #${boxId}:`, e);
			});
		});

		// Send state updates at most 60 times a second.
		setInterval(() => {
			if (stateChangesWaiting) {
				sendToMainWindow('atem:stateChanged', atem.state);
				stateChangesWaiting = false;
			}
		}, 1000 / 60);
	},

	setIpPort(ip, port) {
		atem.connect(ip, port);
		setATEMConnectionStatus('connecting');
		renewSubscriptions();
	}
};

/**
 * Renews subscriptions with the X32 (they expire every 10s).
 * @returns {undefined}
 */
function renewSubscriptions() {

}

function sendToMainWindow(...args) {
	if (!mainWindow || mainWindow.isDestroyed()) {
		return;
	}

	mainWindow.webContents.send(...args);
}

function setATEMConnectionStatus(newStatus) {
	console.log('setATEMConnectionStatus:', newStatus);
	if (newStatus !== lastAtemStatus) {
		sendToMainWindow('atem-connection-status', newStatus);
		lastAtemStatus = newStatus;
	}
}

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
			const idString = `SSBP #${boxId}...`;
			log.debug(`Attempting to take ${idString}...`);
			atem.setSuperSourceBoxSettings(properties, boxId).then(() => {
				log.debug(`Successfully took ${idString}`);
			}).catch(e => {
				log.error(`Failed to take ${idString}:`, e);
			});
		});

		ipcMain.on('atem:takeUskDveSettings', (event, {mixEffect, upstreamKeyerId, properties}) => {
			const idString = `USK DVE Settings #${mixEffect}:${upstreamKeyerId}`;
			log.debug(`Attempting to take ${idString}...`);
			atem.setUpstreamKeyerDVESettings(properties, mixEffect, upstreamKeyerId).then(() => {
				log.debug(`Successfully took ${idString}`);
			}).catch(e => {
				log.error(`Failed to take ${idString}:`, e);
			});
		});

		ipcMain.on('atem:takeUskOnAir', (event, {mixEffect, upstreamKeyerId, onAir}) => {
			const idString = `USK onAir #${mixEffect}:${upstreamKeyerId}`;
			log.debug(`Attempting to take ${idString}...`);
			atem.setUpstreamKeyOnAir(onAir, mixEffect, upstreamKeyerId).then(() => {
				log.debug(`Successfully took ${idString}`);
			}).catch(e => {
				log.error(`Failed to take ${idString}:`, e);
			});
		});

		ipcMain.on('atem:takeUskFillSource', (event, {mixEffect, upstreamKeyerId, fillSource}) => {
			const idString = `USK fill source #${mixEffect}:${upstreamKeyerId}`;
			log.debug(`Attempting to take ${idString}...`);
			atem.setUpstreamKeyerFillSource(fillSource, mixEffect, upstreamKeyerId).then(() => {
				log.debug(`Successfully took ${idString}`);
			}).catch(e => {
				log.error(`Failed to take ${idString}:`, e);
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

'use strict';

// Packages
const {Atem, Enums: AtemEnums} = require('atem-connection');
const log = require('electron-log');
const {ipcMain} = require('electron');

const atem = new Atem();
let mainWindow;
let lastAtemStatus = 'offline';
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
			atem.setUpstreamKeyerOnAir(onAir, mixEffect, upstreamKeyerId).then(() => {
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

		ipcMain.on('atem:setUskAsDve', async (event, {mixEffect, upstreamKeyerId}) => {
			const idString = `USK #${mixEffect}:${upstreamKeyerId}`;
			log.debug(`Attempting to set ${idString} as DVE...`);

			let activeDveMe;
			atem.state.video.ME.forEach(me => {
				me.upstreamKeyers.forEach(usk => {
					if (usk.mixEffectKeyType === AtemEnums.MixEffectKeyType.DVE) {
						activeDveMe = me;
					}
				});
			});

			let activeDveUsk;
			if (activeDveMe) {
				activeDveMe.upstreamKeyers.forEach(usk => {
					if (usk.mixEffectKeyType === AtemEnums.MixEffectKeyType.DVE) {
						activeDveUsk = usk;
					}
				});
			}

			try {
				if (activeDveMe && activeDveUsk) {
					log.debug(`ME: ${activeDveMe.index}, USK: ${activeDveUsk.upstreamKeyerId}`);
					atem.setUpstreamKeyerOnAir(false, activeDveMe.index, activeDveUsk.upstreamKeyerId);
					await atem.setUpstreamKeyerType(
						{keyType: AtemEnums.MixEffectKeyType.Pattern},
						activeDveMe.index,
						activeDveUsk.upstreamKeyerId
					);
				}

				atem.setUpstreamKeyerType(
					{keyType: AtemEnums.MixEffectKeyType.DVE},
					mixEffect,
					upstreamKeyerId
				);
				atem.setUpstreamKeyerOnAir(true, mixEffect, upstreamKeyerId);

				log.debug(`Successfully set ${idString} as DVE`);
			} catch (e) {
				log.error(`Failed to set ${idString} as DVE:`, e);
			}
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

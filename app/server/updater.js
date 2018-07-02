'use strict';

// Packages
const {autoUpdater} = require('electron-updater');
const {ipcMain} = require('electron');
const log = require('electron-log');

// Ours
const {isDev} = require('./util');

autoUpdater.logger = log;

module.exports = function (mainWindow) {
	if (isDev) {
		log.debug('Detected dev environment, autoupdate disabled.');
		return;
	}

	autoUpdater.on('update-downloaded', info => {
		mainWindow.webContents.send('updateDownloaded', info);
	});

	log.debug('Checking for updates...');
	autoUpdater.checkForUpdates();

	ipcMain.on('installUpdateNow', () => {
		autoUpdater.quitAndInstall();
	});
};

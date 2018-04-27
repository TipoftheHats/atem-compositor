'use strict';

// Native
const path = require('path');

// Packages
const windowStateKeeper = require('electron-window-state');
const {app, BrowserWindow} = require('electron');
const log = require('electron-log');

// Ours
const {version} = require('./util');

log.transports.file.level = 'debug';
log.transports.console.level = 'debug';
require('electron-debug')({showDevTools: false});

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', async () => {
	// Load the previous state with fallback to defaults
	const mainWindowState = windowStateKeeper();

	// Create the browser window using the state information.
	mainWindow = new BrowserWindow({
		x: mainWindowState.x,
		y: mainWindowState.y,
		width: 1781,
		height: 861,
		useContentSize: true,
		resizable: false,
		frame: true,
		title: `ATEM Controller v${version}`
	});

	// Quit when main window is closed.
	mainWindow.on('closed', () => {
		app.quit();
	});

	// Spin up the ATEM lib
	const atem = require('./atem');
	await atem.init(mainWindow);

	// Spin up the connection-window lib
	require('./connection-window').init(mainWindow);

	// Spin up the menu lib
	require('./menu')(mainWindow, atem);

	// Spin up the autoupdater
	require('./updater')(mainWindow);

	// Let us register listeners on the window, so we can update the state
	// automatically (the listeners will be removed when the window is closed)
	// and restore the maximized or full screen state
	mainWindowState.manage(mainWindow);

	// And load the index.html of the app.
	const webviewPath = path.resolve(__dirname, '../client/main.html');
	mainWindow.loadURL(`file:///${webviewPath}`);
});

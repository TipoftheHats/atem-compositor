'use strict';

const ABOUT_WIDTH = 455;
const ABOUT_HEIGHT = 230;

// Native
const fs = require('fs');
const path = require('path');

// Packages
const {app, BrowserWindow, ipcMain, Menu, shell} = require('electron');
const log = require('electron-log');

// Ours
const ipPrompt = require('./connection-window');

const userDataPath = app.getPath('userData');
const recentPath = path.join(userDataPath, 'recentConnections.json');
const recentConnections = (function () {
	if (fs.existsSync(recentPath)) {
		try {
			return JSON.parse(fs.readFileSync(recentPath, 'utf-8'));
		} catch (e) {
			log.error(e);
			return [];
		}
	}

	return [];
})();

let aboutWindow;
let mainWindow;
let atem;

module.exports = function (mw, a) {
	mainWindow = mw;
	atem = a;

	if (recentConnections && recentConnections.length > 0) {
		const recentUrl = recentConnections[0];
		log.info(`Restoring connection to ${recentUrl.ip}:${recentUrl.port}`);
		recentUrl.lastOpened = Date.now();
		atem.setIpPort(recentUrl.ip, recentUrl.port);
	}

	regenerateMenu();
};

module.exports.recentConnections = recentConnections;

ipcMain.on('submitIpPort', (event, ip, port) => {
	let recentUrl = recentConnections.find(r => r.ip === ip && r.port === port);
	if (!recentUrl) {
		recentUrl = {ip, port};
		recentConnections.push(recentUrl);

		if (recentConnections.length > 10) {
			recentConnections.length = 10;
		}
	}
	recentUrl.lastOpened = Date.now();
	sortRecentConnections();

	try {
		fs.writeFileSync(recentPath, JSON.stringify(recentConnections), 'utf-8');
	} catch (e) {
		log.error(e);
	}

	atem.setIpPort(ip, port);
	ipPrompt.close();
	regenerateMenu();
});

ipcMain.on('getRecentConnectionsSync', event => {
	event.returnValue = recentConnections;
});

function regenerateMenu() {
	const fileTemplate = {
		label: 'File',
		submenu: [{
			label: 'Open...',
			click() {
				ipPrompt.open();
			}
		}, {
			label: 'Open Recent',
			submenu: recentConnections.map((r, index) => {
				return {
					label: `${r.ip}:${r.port}`,
					click() {
						atem.setIpPort(r.ip, r.port);
						recentConnections[index].lastUpdated = Date.now();
						sortRecentConnections();
						regenerateMenu();
					}
				};
			})
		}]
	};

	const viewTemplate = {
		label: 'View',
		submenu: [{
			label: 'Reload',
			accelerator: 'CmdOrCtrl+R',
			click(item, focusedWindow) {
				if (focusedWindow) {
					focusedWindow.reload();
				}
			}
		}, {
			label: 'Toggle Full Screen',
			accelerator: (function () {
				if (process.platform === 'darwin') {
					return 'Ctrl+Command+F';
				}

				return 'F11';
			})(),
			click(item, focusedWindow) {
				if (focusedWindow) {
					focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
				}
			}
		}, {
			label: 'Toggle Developer Tools',
			accelerator: (function () {
				if (process.platform === 'darwin') {
					return 'Alt+Command+I';
				}

				return 'Ctrl+Shift+I';
			})(),
			click(item, focusedWindow) {
				if (focusedWindow) {
					focusedWindow.toggleDevTools();
				}
			}
		}]
	};

	const windowTemplate = {
		label: 'Window',
		role: 'window',
		submenu: [{
			label: 'Minimize',
			accelerator: 'CmdOrCtrl+M',
			role: 'minimize'
		}, {
			label: 'Close',
			accelerator: 'CmdOrCtrl+W',
			role: 'close'
		}]
	};

	const helpTemplate = {
		label: 'Help',
		role: 'help',
		submenu: [{
			label: 'About',
			click() {
				// Calculate the position of the aboutWindow.
				// It will appear in the center of the mainWindow.
				const mainWindowPosition = mainWindow.getPosition();
				const mainWindowSize = mainWindow.getSize();
				const x = Math.round(mainWindowPosition[0] + (mainWindowSize[0] / 2) - (ABOUT_WIDTH / 2));
				const y = Math.round(mainWindowPosition[1] + (mainWindowSize[1] / 2) - (ABOUT_HEIGHT / 2));

				// If the aboutWindow is already open, focus and re-center it.
				if (aboutWindow) {
					aboutWindow.focus();
					aboutWindow.setPosition(x, y);
					return;
				}

				aboutWindow = new BrowserWindow({
					x,
					y,
					width: ABOUT_WIDTH,
					height: ABOUT_HEIGHT,
					useContentSize: true,
					resizable: false,
					fullscreen: false,
					fullscreenable: false,
					frame: true,
					minimizable: false,
					maximizable: false,
					autoHideMenuBar: true,
					title: 'About ATEM Compositor'
				});

				aboutWindow.on('closed', () => {
					aboutWindow = null;
				});

				// Remove the menu from the aboutWindow.
				aboutWindow.setMenu(null);

				const promptPath = path.resolve(__dirname, '../client/about/about.html');
				aboutWindow.loadURL(`file:///${promptPath}`);
			}
		}, {
			label: 'Report A Bug',
			click() {
				shell.openExternal('https://github.com/lange/atem-controller/issues/new');
			}
		}]
	};

	const template = [fileTemplate, viewTemplate, windowTemplate, helpTemplate];

	// Add Mac-specific menu items
	if (process.platform === 'darwin') {
		const name = app.getName();
		template.unshift({
			label: name,
			submenu: [{
				label: `About ${name}`,
				role: 'about'
			}, {
				type: 'separator'
			}, {
				label: 'Services',
				role: 'services',
				submenu: []
			}, {
				type: 'separator'
			}, {
				label: `Hide ${name}`,
				accelerator: 'Command+H',
				role: 'hide'
			}, {
				label: 'Hide Others',
				accelerator: 'Command+Alt+H',
				role: 'hideothers'
			}, {
				label: 'Show All',
				role: 'unhide'
			}, {
				type: 'separator'
			}, {
				label: 'Quit',
				accelerator: 'Command+Q',
				click() {
					app.quit();
				}
			}]
		});

		windowTemplate.submenu.push({
			type: 'separator'
		}, {
			label: 'Bring All to Front',
			role: 'front'
		});
	}

	const menu = Menu.buildFromTemplate(template);
	Menu.setApplicationMenu(menu);
}

function sortRecentConnections() {
	recentConnections.sort((a, b) => {
		return b.lastOpened - a.lastOpened;
	});
}

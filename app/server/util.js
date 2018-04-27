'use strict';

const path = require('path');
const isDev = require('electron-is-dev');

module.exports = {
	isDev,
	version: (function () {
		const packagePath = path.resolve(__dirname, '../package.json');
		return require(packagePath).version;
	})()
};

const {shell} = require('electron');

const {version} = require('../../server/util');

document.getElementById('header').textContent = `ATEM Compositor v${version}`;

// Open links externally by default
document.addEventListener('click', e => {
	if (e.target.tagName === 'A' && e.target.target === '_blank') {
		e.preventDefault();
		shell.openExternal(e.target.href);
	}
});


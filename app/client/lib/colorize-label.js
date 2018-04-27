'use strict';

const tinycolor = require('tinycolor2');

module.exports = function (colorCode, labelElement) {
	let primaryColor;
	let gradientFgColor;
	let gradientBgColor;
	let textColor;
	const inverted = colorCode && colorCode.endsWith('i');
	switch (colorCode) {
		case 'BL':
			textColor = '#05084B';
		/* falls through */
		case 'BLi':
			primaryColor = '#5454FF';
			gradientFgColor = 'rgba(0, 0, 0, 0)';
			gradientBgColor = '#05084B';
			break;

		case 'CY':
			textColor = '#1A195E';
		/* falls through */
		case 'CYi':
			primaryColor = '#00FFFF';
			gradientFgColor = '#4C3CFF';
			gradientBgColor = '#11133F';
			break;

		case 'GN':
			textColor = '#113F17';
		/* falls through */
		case 'GNi':
			primaryColor = '#0AFF5C';
			gradientFgColor = '#27AA31';
			gradientBgColor = '#113F17';
			break;

		case 'MG':
			textColor = '#11133F';
		/* falls through */
		case 'MGi':
			primaryColor = '#FF00FF';
			gradientFgColor = 'rgba(255, 60, 247, 0.5)';
			gradientBgColor = '#11133F';
			break;

		case 'OFF':
			textColor = '#000000';
		/* falls through */
		case 'OFFi':
			primaryColor = '#757575';
			gradientFgColor = 'rgba(0, 0, 0, 0)';
			gradientBgColor = '#000000';
			break;

		case 'RD':
			textColor = '#3F1111';
		/* falls through */
		case 'RDi':
			primaryColor = '#FF2020';
			gradientFgColor = 'rgba(255, 60, 60, 0.3)';
			gradientBgColor = '#3F1111';
			break;

		case 'WH':
			textColor = '#000000';
		/* falls through */
		case 'WHi':
			primaryColor = '#FFFFFF';
			gradientFgColor = 'rgba(255, 255, 255, 0.3)';
			gradientBgColor = '#343434';
			break;

		case 'YE':
			textColor = '#3F3F11';
		/* falls through */
		case 'YEi':
			primaryColor = '#FFEB0A';
			gradientFgColor = '#989200';
			gradientBgColor = '#3F3F11';
			break;

		default:
			// Do nothing.
	}

	if (inverted) {
		textColor = primaryColor;
		const tcGradientFgColor = tinycolor(gradientFgColor);
		const gradientFgEndColor = tcGradientFgColor.setAlpha(0).toRgbString();
		labelElement.style.background = `
					radial-gradient(
						closest-side at 54.61% 50%,
						${gradientFgColor} 0%,
						${gradientFgEndColor} 100%
					),
					${gradientBgColor}
				`;
	} else {
		labelElement.style.background = primaryColor;
	}

	labelElement.style.color = textColor;
	labelElement.style.border = `2px solid ${primaryColor}`;

	return {
		primaryColor,
		textColor,
		gradientFgColor,
		gradientBgColor
	};
};

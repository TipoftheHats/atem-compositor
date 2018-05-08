(function () {
	'use strict';

	const Decimal = require('decimal.js');

	/**
	 * @customElement
	 * @polymer
	 */
	class AtemSize extends Polymer.Element {
		static get is() {
			return 'atem-size';
		}

		static get properties() {
			return {
				min: Number,
				max: Number,
				step: Number,
				value: {
					type: Number,
					notify: true
				},
				boxState: Number
			};
		}

		_calcSizePixels(size) {
			const width = new Decimal(1920).times(size).dividedBy(1000);
			const height = new Decimal(1080).times(size).dividedBy(1000);
			return `${width.toDecimalPlaces(0)}x${height.toDecimalPlaces(0)}`;
		}
	}

	customElements.define(AtemSize.is, AtemSize);
})();

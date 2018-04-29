(function () {
	'use strict';

	/**
	 * @customElement
	 * @polymer
	 */
	class AtemAnchorSelector extends Polymer.Element {
		static get is() {
			return 'atem-anchor-selector';
		}

		static get properties() {
			return {
				selected: {
					type: String,
					value: 'center-center',
					observer: '_selectedChanged'
				},
				xAnchor: {
					type: Number,
					notify: true
				},
				yAnchor: {
					type: Number,
					notify: true
				}
			};
		}

		_selectedChanged(newVal) {
			if (!newVal) {
				return;
			}

			newVal.split('-').forEach((string, index) => {
				let result = 0.5;

				if (string === 'top' || string === 'right') {
					result = 1;
				} else if (string === 'bottom' || string === 'left') {
					result = 0;
				}

				this[index === 0 ? 'yAnchor' : 'xAnchor'] = result;
			});
		}

		_calcPrettyLabel(selected) {
			if (!selected || selected === 'center-center') {
				return 'Center';
			}

			return selected.split('-').map(str => {
				return str.charAt(0).toUpperCase() + str.substr(1);
			}).join(' ');
		}
	}

	customElements.define(AtemAnchorSelector.is, AtemAnchorSelector);
})();

(function () {
	'use strict';

	/**
	 * @customElement
	 * @polymer
	 */
	class AtemCompositionBox extends Polymer.Element {
		static get is() {
			return 'atem-composition-box';
		}

		static get properties() {
			return {
				label: String,
				enabled: {
					type: Boolean,
					notify: true
				}
			};
		}
	}

	customElements.define(AtemCompositionBox.is, AtemCompositionBox);
})();

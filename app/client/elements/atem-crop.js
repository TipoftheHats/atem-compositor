(function () {
	'use strict';

	/**
	 * @customElement
	 * @polymer
	 */
	class AtemCrop extends Polymer.Element {
		static get is() {
			return 'atem-crop';
		}

		static get properties() {
			return {
				label: {
					type: String,
					value: 'Crop'
				},
				sideMin: {
					type: Number,
					value: 0
				},
				sideMax: {
					type: Number,
					value: 32
				},
				endMin: {
					type: Number,
					value: 0
				},
				endMax: {
					type: Number,
					value: 18
				},
				top: {
					type: Number,
					notify: true,
					value: 0
				},
				bottom: {
					type: Number,
					notify: true,
					value: 0
				},
				left: {
					type: Number,
					notify: true,
					value: 0
				},
				right: {
					type: Number,
					notify: true,
					value: 0
				},
				enabled: {
					type: Boolean,
					notify: true
				}
			};
		}
	}

	customElements.define(AtemCrop.is, AtemCrop);
})();

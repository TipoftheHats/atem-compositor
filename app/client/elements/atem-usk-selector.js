(function () {
	'use strict';

	const AtemEnums = require('atem-connection').Enums;

	/**
	 * @customElement
	 * @polymer
	 */
	class AtemUskSelector extends Polymer.Element {
		static get is() {
			return 'atem-usk-selector';
		}

		static get properties() {
			return {
				atemState: Object,
				selectedMeIndex: {
					type: Number,
					notify: true
				},
				selectedUskIndex: {
					type: Number,
					notify: true
				},
				activeDveMe: {
					type: Object,
					computed: '_computeActiveDveMe(atemState)',
					observer: '_activeDveMeChanged'
				},
				activeDveUsk: {
					type: Object,
					computed: '_computeActiveDveUsk(activeDveMe)',
					observer: '_activeDveUskChanged'
				}
			};
		}

		_computeActiveDveMe(atemState) {
			if (!atemState || !atemState.video || !atemState.video.ME) {
				return;
			}

			let activeDveMe;
			atemState.video.ME.forEach(me => {
				me.upstreamKeyers.forEach(usk => {
					if (usk.mixEffectKeyType === AtemEnums.MixEffectKeyType.DVE) {
						activeDveMe = me;
					}
				});
			});

			return activeDveMe;
		}

		_activeDveMeChanged(activeDveMe) {
			this.$.me.selected = activeDveMe ? activeDveMe.index : -1;
		}

		_computeActiveDveUsk(activeDveMe) {
			if (!activeDveMe) {
				return;
			}

			let activeDveUsk;
			activeDveMe.upstreamKeyers.forEach(usk => {
				if (usk.mixEffectKeyType === AtemEnums.MixEffectKeyType.DVE) {
					activeDveUsk = usk;
				}
			});

			return activeDveUsk;
		}

		_activeDveUskChanged(activeDveUsk) {
			this.$.usk.selected = activeDveUsk ? activeDveUsk.upstreamKeyerId : -1;
		}

		_plusOne(number) {
			return number + 1;
		}
	}

	customElements.define(AtemUskSelector.is, AtemUskSelector);
})();

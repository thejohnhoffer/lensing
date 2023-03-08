import Icon from "./assets/lensing_icon.svg";
import IconKeyboard from "./assets/lensing_keyboard.svg";
import IconFilterConfig from "./assets/lensing_filter_config.svg";

/**
 * @class Controls
 */
export default class Controls {

    // Vars
    on = true;

    /**
     * @constructor
     */
    constructor(_lensing) {
        // Fields
        this.lensing = _lensing;
        // Init
        this.init();
    }

    /** - TODO :: ckpt. 20220706
     * @function init
     * Builds the button used as a dock for lensing
     *
     * @returns null
     */
    init() {

        // Configs
        const w = 38;
        const iconW = 28;
        const iconLilW = 16;
        const iconPad = (w - iconW) / 2;
        const sliderWH = [iconW, iconW * 5];

        // Build container
        const container = document.createElement('div');
        container.setAttribute('style', `height: 100%; width: ${w}px; `
            + `position: absolute; right: 0; top: 0; `
            + `display: flex; flex-flow: column nowrap; align-items: center;`
            + `visibility: ${this.on ? 'visible' : 'hidden'}`
        );

        // Append img
        this.lensing.viewer.canvas.parentElement.append(container);
    }

    /** - TODO :: ckpt. 20220706
     * @function handleSliderChange
     * Passes event to lenses.
     *
     * @param {Event} e
     *
     * returns void
     */
    handleSliderChange(e) {

        // Update val
        this.lensing.lenses.updateFilter(e.target.value)
    }
}

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

        // Build icon
        // Add the image to our existing div.
        const icon = new Image();
        icon.src = Icon;
        icon.alt = 'Lensing Icon';
        icon.setAttribute('style', `height: ${iconW}px; width: ${iconW}px; `
            + `position: relative; margin: ${iconPad}px;`
        );
        container.appendChild(icon);

        // Build lens report
        this.lensReport = document.createElement('div');
        this.lensReport.setAttribute('style',
            `position: absolute; right: ${iconW + iconPad * 3}px; top: 12px;`
            + `color: white; font-family: sans-serif; font-size: 10px; font-style: italic; font-weight: lighter; `
            + `white-space: nowrap;`
        );
        container.appendChild(this.lensReport);
        this.updateReport();
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

    /** - TODO :: ckpt. 20220706
     * @function updateReport
     * Updates lens report in controls
     *
     * returns void
     */
    updateReport() {

        // Update val
        this.lensReport.innerHTML = `${this.lensing.lenses.selections.filter.display} `
            + `${this.lensing.lenses.selections.magnifier.settings.active}X `
            + `${this.lensing.lenses.selections.magnifier.display}`;

    }

}

/*
Lensing
 */

import Controls from './controls';
import Events from './events';
import Lenses from './lenses';
import Snapshots from './snapshots';

/*
TODO -
  - Add in rotate
  - Make aux_viewer size of lens - tried ... bad performance
  - Refactor mouse events to OSD.MouseTracker
  - Update to handle async filters
*/

/**
 * @class Lensing
 *
 */
export default class Lensing {

    // Construct refs
    osd = null;
    viewer = null;
    viewerConfig = null;
    lensingConfig = null;
    dataLoad = null;

    // Class refs
    controls = null;
    events = null;
    lenses = null;

    // Components
    overlay = null;
    viewerCanvas = null;
    viewerAux = null;
    viewerAuxCanvas = null;

    // Optimization for Safari, Edge, Firefox
    offscreen = document.createElement('canvas');

    // Position data
    positionData = {
        centerPoint: null,
        currentEvent: '',
        pos: [],
        posFull: [],
        refPoint: null,
        eventPoint: null,
        screenCoords: [],
        zoom: 0,
        zoomAux: 0
    };

    // Configs
    configs = {
        addOnBoxFilters: [],
        addOnBoxMagnifiers: [],
        counter: 0,
        counterControl: 2,
        counterException: false,
        imageMetadata: null,
        mag: 1,
        on: true,
        placed: false,
        px: '',
        pxData: null,
        pxRatio: 1,
        rad: 100,
        radDefault: 100,
        radInc: 10,
        radMin: 0,
        radMax: 400,
        shape: 'circle',
        showControls: false,
    }

    /**
     * @constructor
     */
    constructor(_osd, _viewer, _viewer_config, _lensing_config, _data_load) {

        // Arriving from source application
        this.osd = _osd;
        this.NAV_GAP = 40;
        this.viewer = _viewer;
        this.viewerConfig = _viewer_config;
        this.lensingConfig = _lensing_config;
        this.dataLoad = _data_load;

        // Set configs passed in from source application
        this.configUpdate(this.lensingConfig);

        // Set configs based on source device
        this.deviceConfig();

        // Init
        this.init();
    }

    /** - TODO :: ckpt. 20220706
     * 1.
     * @function init
     * Initializes the viewers, overlay, lenses 
     *
     * @returns void
     */
    init() {

        this.rootEl = document.querySelector(`#${this.viewerConfig.id}`);
        // Build magnifier viewer (hidden viewer)
        this.viewerAux = this.buildHiddenViewer();

        // Keep viewer canvas and aux canvas as a variable
        this.viewerCanvas = this.viewer.canvas.querySelector('canvas');
        this.viewerAuxCanvas = this.viewerAux.canvas.querySelector('canvas');

        // Build lens overlay
        this.overlay = this.buildOverlay('lens',
            [this.viewer.canvas.clientWidth, this.viewer.canvas.clientHeight]);

        // Instantiate filters / ck filters from data_load
        this.lenses = new Lenses(this);

        // Instantiate controls
        this.controls = new Controls(this);

        // Instantiate snapshots
        this.snapshots = new Snapshots(this);

        // Add event listeners to viewer
        this.events = new Events(this);
        this.events.bulkAttachEvents();
        this.recenter();
    }

    get padding () {
      const px_ratio = this.configs.pxRatio;
      const diameter = this.configs.rad * 2;
      return Math.ceil(diameter / px_ratio - this.NAV_GAP*2);
    }

    recenter() {
        this.events.handleViewerOpen();
    }

    /** - TODO :: ckpt. 20220706
     * @function buildHiddenViewer
     * Builds a hidden (aux) viewer that is used to project modified / magnified data
     *
     * @returns any
     */
    buildHiddenViewer() {

        // Update viewer positions
        const rootEl = this.rootEl;
        rootEl.style.position = 'relative';

        // Instantiate hidden viewer that matches configuration from source viewer
        const viewerAux = new this.osd(this.viewerConfig);

        // Position (0 index is original source viewer; 1 index is hidden viewer)
        const containers = rootEl.querySelectorAll(`.openseadragon-container`);
        containers[0].classList.add('lensing-c_main');
        containers[0].style.position = 'relative';
        containers[1].classList.add('lensing-c_aux')
        containers[1].style.position = 'absolute';
        containers[1].style.top = '0';
        containers[1].style.left = '0';
        containers[1].style.visibility = 'hidden';

        // Return osd viewer
        return viewerAux;
    }

    /**
     * @function buildOverlay
     * Builds overlay, including canvas and svg
     *
     * @param {string} id
     * @param {array} dims
     *
     * @returns any
     */
    buildOverlay(id, dims) {

        // Build container
        const container = document.createElement('div');
        container.setAttribute('class', `overlay_container_${id} overlay_container`);
        container.setAttribute('style', `
          display: grid;
          position: absolute;
          pointer-events: none;
          grid-template-columns: ${this.NAV_GAP}px auto ${this.NAV_GAP}px;
          grid-template-rows: ${this.NAV_GAP}px auto ${this.NAV_GAP}px;
          justify-content: center;
          align-content: center;
          opacity: 90%;
        `);
        // Append container
        this.viewer.canvas.append(container);

        const lens_range = document.createElement('input');
        lens_range.setAttribute("type", "range");
        lens_range.setAttribute("value", "100");
        lens_range.setAttribute("max", "100");
        lens_range.setAttribute('style', `
          pointer-events: all;
          padding-right: 10px;
          padding-left: 10px;
          height: 30px;
          width: 100px;
        `);
        const lens_range_div = document.createElement('div');
        lens_range_div.className = 'bg-trans';
        lens_range_div.setAttribute('style', `
          justify-content: center;
          align-content: center;
          display: grid;
        `);
        const bottom_div = document.createElement('div')
        bottom_div.setAttribute('style', `
          opacity: 0;
          grid-template-columns: 1fr;
          grid-template-rows: 1fr;
          justify-content: center;
          align-content: center;
          grid-column: 2;
          display: grid;
          grid-row: 3;
        `);
        const plus_span = document.createElement('span');
        plus_span.className = 'bg-trans';
        plus_span.setAttribute('style', `
          pointer-events: none;
          padding-top: 5px;
          color: #007bff;
          height: 100px;
          grid-row: 2;
        `);
        const plus_button = document.createElement('button');
        plus_button.className = 'lens-input-plus';
        plus_button.setAttribute('style', `
          opacity: 0;
          font-size: ${this.NAV_GAP}px;
          width: ${this.NAV_GAP}px;
          grid-template-columns: 1fr;
          grid-template-rows: 1fr 30px 1fr;
          justify-content: center;
          align-content: center;
          pointer-events: all;
          line-height: 35px;
          font-weight: 500;
          background: none;
          grid-column: 3;
          grid-row: 2;
          border: none;
          display: grid;
          padding: 0;
        `);
        const minus_span = document.createElement('span');
        minus_span.className = 'bg-trans';
        minus_span.setAttribute('style', `
          pointer-events: none;
          padding-bottom: 2px;
          padding-top: 3px;
          color: #007bff;
          height: 100px;
          width: 40px;
          grid-row: 2;
        `);
        const minus_button = document.createElement('button');
        minus_button.className = 'lens-input-minus';
        minus_button.setAttribute('style', `
          opacity: 0;
          grid-column: 1; grid-row: 2;
          width: ${this.NAV_GAP}px;
          font-size: ${1.5 * this.NAV_GAP}px;
          grid-template-rows: 1fr 30px 1fr;
          grid-template-columns: 1fr;
          justify-content: center;
          align-content: center;
          pointer-events: all;
          line-height: 35px;
          font-weight: 400;
          background: none;
          border: none;
          display: grid;
          padding: 0;
        `);
        const padding = document.createElement('div');
        padding.setAttribute('style', `
          grid-column: 2; grid-row: 2;
          justify-content: center;
          align-content: center;
          display: grid;
        `);
        plus_span.innerText = "+";
        minus_span.innerText = "-";
        plus_button.append(plus_span);
        minus_button.append(minus_span);
        lens_range_div.append(lens_range);
        bottom_div.append(lens_range_div);
        container.append(plus_button);
        container.append(minus_button);
        container.append(padding);
        container.append(bottom_div);
        // Build actualCanvas
        const actualCanvas = document.createElement('canvas');
        actualCanvas.className = 'lens_overlay_canvas';
        actualCanvas.setAttribute('style', `
          pointer-events: all; position: absolute;
          grid-column: 1/3; grid-row: 1/3;
        `);

        // Append acvtualCanvas to container, container to viewer
        container.append(actualCanvas);

        // Return
        return {
            padding: padding,
            canvas: actualCanvas,
            container: container,
            lens_range: lens_range,
            plus_span: plus_span,
            minus_span: minus_span,
            context: actualCanvas.getContext('2d')
        };
    }

    /** - TODO :: ckpt. 20220706
     * @function configUpdate
     * Updates configuration settings passed from source application
     *
     * @param {any} config
     *
     * @returns void
     */
    configUpdate(config) {
        for (const [k, v] of Object.entries(config)) {
            if (this.configs.hasOwnProperty(k)) {
                this.configs[k] = v;
            }
        }
    }

    /** - TODO :: ckpt. 20220706
     * @function device_config
     * Updates configurations using device pixel ratio (housekeeping for different monitor resolutions)
     *
     * @returns void
     */
    deviceConfig() {

        // Pixel ratio
        const pxRatio = window.devicePixelRatio;

        // Configs pxRatio
        this.configs.pxRatio = pxRatio;
        this.configs.rad = Math.round(50 * pxRatio);
        this.configs.radDefault = Math.round(50 * pxRatio);
        this.configs.radInc = Math.round(5 * pxRatio);
        this.configs.radMax = Math.round(200 * pxRatio);
    }

    /** - TODO :: ckpt. 20220706
     * @function drawLens
     * Paints the overlay
     *
     * @param {any} data
     *
     * @returns void
     */
    drawLens(data) {

        // if (this.configs.counter % this.configs.counter_control === 0 || this.configs.counter_exception) {
        if (this.configs.counter % this.configs.counterControl === 0 || this.configs.counterException
            || !this.configs.placed) {

            // Reset
            this.configs.counterException = false;

            const animate = this.animate.bind(this, data);
            requestAnimationFrame(animate);
        }
        this.configs.counter++;
    }

    /**
     * @function animate
     * Requests Animation Frame
     *
     * @param {any} data
     *
     * @returns void
     */
    animate(data) {
        // Update overlay dims and position
        const px_ratio = this.configs.pxRatio;
        const diameter = this.configs.rad * 2;
        const padding =  this.padding + 'px';
        const canvas_diameter = diameter;
        const css_diameter =  Math.ceil(diameter / px_ratio) + 'px';
        const css_radius =  Math.ceil(0.5 * diameter / px_ratio) + 'px';
        const css_x = Math.round((data.x - this.configs.rad) / px_ratio) + 'px';
        const css_y = Math.round((data.y - this.configs.rad) / px_ratio) + 'px';

        const chord = () => {
          const a = this.padding;
          const rad = this.configs.rad;
          const solution = 2*rad - Math.sqrt(4*rad**2 - a**2);
          return Math.ceil(this.padding - solution / 2) + 'px';
        }
        this.overlay.padding.style.width = padding;
        this.overlay.padding.style.height = chord();
        this.overlay.lens_range.style.width = padding;
        this.overlay.canvas.style.width = css_diameter;
        this.overlay.canvas.style.height = css_diameter;
        this.overlay.plus_span.style.height = css_radius;
        this.overlay.minus_span.style.height = css_radius;
        this.overlay.container.style.width = css_diameter;
        this.overlay.container.style.height = css_diameter;
//        this.overlay.container.style.clipPath = `circle(${css_radius} at center)`;
        if (this.overlay.canvas.width !== canvas_diameter) {
          this.overlay.canvas.setAttribute('width', canvas_diameter + 'px');
        }
        if (this.overlay.canvas.height !== canvas_diameter) {
          this.overlay.canvas.setAttribute('height', canvas_diameter + 'px');
        }
        this.overlay.context.clearRect(0, 0, canvas_diameter, canvas_diameter);

        if (!this.configs.placed) {
            this.overlay.container.style.left = css_x;
            this.overlay.container.style.top = css_y;
        }

        // Save
        this.overlay.context.save();

        // Filter
        let filteredD = this.lenses.modify(data.d);

        // Save
        this.imgData = filteredD;

        // Convert to bitmap
        this.createTempoaryCanvas(filteredD).then(imgBitmap => {

            // Clip
            if (this.configs.shape === 'circle') {
                this.overlay.context.beginPath();
                this.overlay.context.arc(this.configs.rad, this.configs.rad, this.configs.rad, 0, Math.PI * 2);
                this.overlay.context.clip();
            }

            // Draw
            if (this.lenses.selections.magnifier.name === 'mag_standard') {
                this.overlay.context.drawImage(imgBitmap,
                    0,
                    0,
                    this.configs.rad * 2,
                    this.configs.rad * 2
                );
            } else if (this.lenses.selections.magnifier.name === 'mag_fisheye') {
                this.overlay.context.scale(1 / this.configs.mag, 1 / this.configs.mag)
                this.overlay.context.drawImage(imgBitmap,
                    0,
                    0,
                    this.configs.rad * 2 * this.configs.mag,
                    this.configs.rad * 2 * this.configs.mag
                );
            } else if (this.lenses.selections.magnifier.name === 'mag_plateau') {
                this.overlay.context.drawImage(imgBitmap,
                    -(this.configs.mag - 1) * this.configs.rad,
                    -(this.configs.mag - 1) * this.configs.rad,
                    this.configs.rad * 2 * this.configs.mag,
                    this.configs.rad * 2 * this.configs.mag
                );
            }

            // Restore
            this.overlay.context.restore();

            // Lens border / stroke
            this.overlay.context.strokeStyle = `white`;
            this.overlay.context.lineWidth = this.configs.pxRatio;
            this.overlay.context.beginPath();
            if (this.configs.shape === 'circle') {
                this.overlay.context.arc(this.configs.rad, this.configs.rad, this.configs.rad - 1, 0, Math.PI * 2);
            } else if (this.configs.shape === 'square') {
                this.overlay.context.strokeRect(1, 1, (this.configs.rad - 1) * 2, (this.configs.rad - 1) * 2);
            }
            this.overlay.context.stroke();

        }).catch(err => console.log(err));

    }

    /**
     * @function createTempoaryCanvas
     * Polyfill for Edge / Safari createImageBitmap
     * Also solves perfomance issues in Firefox
     * @param {ImageData} imagedata
     *
     * @returns Promise<CanvasRenderingContext2D>
     */

    createTempoaryCanvas (imagedata) {
      const canvas = this.offscreen;
      const ctx = canvas.getContext('2d');
      canvas.width = imagedata.width;
      canvas.height = imagedata.height;
      ctx.putImageData(imagedata, 0, 0);
      return Promise.resolve(canvas);
    }

    /** - TODO :: ckpt. 20220706
     * @function manageLensUpdate
     * Defines position configurations before redraw
     *
     * @returns void
     */
    manageLensUpdate() {

        const over_class = "overlay_container";
        const over = [...document.getElementsByClassName(over_class)];
        if (this.configs.shape === "") {
          over.forEach(o => o.classList.add("d-none"));
        }
        else {
          over.forEach(o => o.classList.remove("d-none"));
        }
        // Check pos and placement
        // if (this.positionData.pos.length > 0 && !this.configs.placed) {
        if (this.positionData.pos.length > 0) {

            // Get context, init data
            const ctx = this.viewerAuxCanvas.getContext('2d');
            let d = null;

            // Respond to magnifaction
            if (this.lenses.selections.magnifier.name === 'mag_standard') {
                let xy = this.configs.rad * 2;
                d = ctx.getImageData(
                    this.positionData.pos[0] - this.configs.rad,
                    this.positionData.pos[1] - this.configs.rad,
                    xy,
                    xy
                );
            } else {
                let xy = Math.round(this.configs.rad * 2 * this.configs.mag);
                d = ctx.getImageData(
                    this.positionData.pos[0] - this.configs.rad * this.configs.mag,
                    this.positionData.pos[1] - this.configs.rad * this.configs.mag,
                    xy,
                    xy
                );
            }

            // If data filter is on - FIXME :: post-"Bare bones"
            if (this.lenses.selections.filter.name.substring(0, 8) === 'fil_data') {
                this.setPixel(ctx);
            }

            // Draw
            this.drawLens({
                x: this.positionData.pos[0],
                y: this.positionData.pos[1],
                d: d
            });
        }
    }

    /**
     * @function manage_slider_update
     * Updates slider in controls bar
     *
     * @returns null
     */
    manage_slider_update() {

        // Get filter
        const filter = this.lenses.selections.filter;
        filter.settings.active = filter.settings.default;

        // Update controls slider
        this.controls.slider.max = filter.settings.max;
        this.controls.slider.value = filter.settings.default;
        this.controls.slider.step = filter.settings.step;
    }

    /** - TODO :: ckpt. 20220706
     * @function setPixel
     * Sets pixel for data configured for color
     *
     * @param {any} ctx
     *
     * @return void
     */
    setPixel(ctx) {

        // Get single pixel info TODO - PoC work
        const px = ctx.getImageData(
            this.positionData.pos[0],
            this.positionData.pos[1],
            1,
            1
        );
        this.configs.pxCol = px.data[0] + '_' + px.data[1] + '_' + px.data[2];

        // Perform setup
        this.lenses.selections.filter.setPixel(px, this, this.lenses)
    }

    /** - TODO :: ckpt. 20220706
     * @function setPosition
     * Converts mouse coords to viewport point for hidden layer if mag on; sets coordinate config for overlay
     *
     * @param {array} coords
     * @param {boolean} isPoint
     *
     * @returns void
     */
    setPosition(coords, isPoint = false) {


        // Get some cords for overlay
        if (!this.configs.placed) {

            let x = Math.round(coords[0] * this.configs.pxRatio);
            let y = Math.round(coords[1] * this.configs.pxRatio);
            this.positionData.pos = [x, y];
            if (isPoint) {
                const reCoords = this.viewer.viewport.pixelFromPoint(coords);
                this.configs.pos = [
                    Math.round(reCoords.x * this.configs.pxRatio),
                    Math.round(reCoords.y * this.configs.pxRatio)
                ];
            }
        }

        // Transform coordinates to scroll point
        const point = new this.osd.Point(coords[0], coords[1]);
        this.positionData.eventPoint = isPoint
            ? coords
            : this.viewer.viewport.viewerElementToViewportCoordinates(point);
        const posFull = this.viewer.world.getItemAt(0)
            ? this.viewer.world.getItemAt(0).viewportToImageCoordinates(this.positionData.eventPoint)
            : {x: 0, y: 0};
        this.positionData.posFull = [posFull.x, posFull.y];

        // Check for event point before calculating reference point
        this.positionData.centerPoint = this.viewer.viewport.getCenter(true);
        const gap = this.positionData.centerPoint.minus(this.positionData.eventPoint).divide(this.configs.mag);
        this.positionData.refPoint = this.positionData.eventPoint.plus(gap);

        // Emulate event - FIXME :: consider automated events to events file
        this.viewerAux.raiseEvent('click', {eventType: 'pan', immediately: true});
    }

    /**
     * updateConfigs
     */
    updateConfigs(newConfigs) {
        for (let [k, v] of Object.entries(newConfigs)) {
            this.configs[k] = v;
        }
    }

}

/*
Ref.
https://stackoverflow.com/questions/38384001/using-imagedata-object-in-drawimage
https://stackoverflow.com/questions/39665545/javascript-how-to-clip-using-drawimage-putimagedata
https://stackoverflow.com/questions/32681929/hook-into-openseadragon-with-custom-user-interface-device
 */

/**
 * @class Events
 */
export default class Events {

    // Class vars
    lensing = null;

    /**
     * @constructor
     */
    constructor(_lensing) {
        this.lensing = _lensing;
    }

    /** - TODO :: ck. 20220706
     * @function bulkAttachEvents
     * Attaches events to source viewer and hidden viewer
     *
     * @returns void
     */
    bulkAttachEvents() {

        const handle_input = (e, padding) => {
          const scale = 100/padding;
          const dx = e.movementX * scale;
          const max = parseInt(e.target.max);
          const value = parseInt(e.target.value);
          const opacity = e.target.value / 100;
          e.target.value = Math.max(0, Math.min(100, value + dx));
          this.handleLensOpacity(opacity);
          this.lensing.configs.counterException = true;
          this.lensing.manageLensUpdate();
        }
        const handle_button = (classname) => {
          if (classname === "lens-input-minus") {
            this.handleLensResize(false);
          }
          else if (classname === "lens-input-plus") {
            this.handleLensResize(true);
          }
        }
        const lens_canvas = this.lensing.overlay.canvas;
//        this.lensing.rootEl.addEventListener('mousemove', (e) => {
        this.lensing.viewer.addHandler('canvas-click', (e) => {
          const classname = e.originalEvent.target.className;
          const tagname = e.originalEvent.target.tagName;
          if (tagname === "INPUT") {
            e.preventDefaultAction = true;
          }
          else if (tagname === "BUTTON") {
            handle_button(classname);
            e.preventDefaultAction = true;
            this.lensing.configs.counterException = true;
            this.lensing.manageLensUpdate();
          }
          else if (classname === "lens-input-wrapper") {
            e.preventDefaultAction = true;
          }
        });
        this.lensing.viewer.addHandler('canvas-drag', (e) => {
          const x = e.position.x;
          const y = e.position.y;
          /*
           * Unusual workaround, unable to correctly handle
           * event propogation without this unusual solution
           */
          const at_point = document.elementsFromPoint(x, y);
          const lens = [...at_point].find((target) => {
            return target.className === "lens_overlay_canvas";
          }) || null;
          const classname = e.originalEvent.target.className;
          const tagname = e.originalEvent.target.tagName;
          if (tagname === "INPUT") {
            handle_input(e.originalEvent, this.lensing.padding);
            e.preventDefaultAction = true;
          }
          else if (tagname === "BUTTON") {
            handle_button(classname);
            e.preventDefaultAction = true;
            this.lensing.configs.counterException = true;
            this.lensing.manageLensUpdate();
          }
          else if (classname === "lens-input-wrapper") {
            handle_input(e.originalEvent, this.lensing.padding);
            e.preventDefaultAction = true;
          }
          else if (lens && e.originalEvent.buttons !== 0) {
            this.lensing.positionData.currentEvent = 'pan';
            this.lensing.positionData.screenCoords = [x, y];
            this.lensing.setPosition(this.lensing.positionData.screenCoords);
            this.lensing.manageLensUpdate();
            e.preventDefaultAction = true;
          }
        });

        this.lensing.viewer.addHandler('animation', this.handleViewerAuxMove.bind(this));
        this.lensing.viewer.addHandler('open', this.handleViewerOpen.bind(this));
        this.lensing.viewer.addHandler('zoom', this.handleViewerZoom.bind(this));

        // Key-ing
        this.lensing.viewer.canvas.addEventListener('keydown', this.handleViewerKeydown.bind(this));

    }

    /** - TODO :: ckpt. 20220706
     * @function handleViewerCanvasDrag
     * Manages drag
     *
     * @param {Event} e
     *
     * @returns void
     */
    handleViewerCanvasDrag(e) {

        console.log('...drag...')
        // Get pos data from event
        this.lensing.positionData.currentEvent = 'pan';
        this.lensing.positionData.screenCoords = [Math.round(e.position.x), Math.round(e.position.y)];
    }

    /** - TODO :: ckpt. 20220706
     * @function handleViewerOpen
     * Initializes position settings from center
     *
     * @returns void
     */
    handleViewerOpen() {

        const screenRect = this.lensing.viewerAuxCanvas.getBoundingClientRect();
        const mid_y = ( screenRect.top + screenRect.bottom ) / 2;
        const mid_x = ( screenRect.left + screenRect.right ) / 2;
    
        // Defaults
        this.lensing.positionData.refPoint = this.lensing.viewer.viewport.getCenter(false);
        this.lensing.positionData.centerPoint = this.lensing.viewer.viewport.getCenter(false);
        this.lensing.positionData.eventPoint = this.lensing.viewer.viewport.getCenter(false);
        this.lensing.positionData.zoom = this.lensing.viewer.viewport.getZoom(true);

        this.lensing.positionData.screenCoords = [mid_x, mid_y];
        this.lensing.setPosition(this.lensing.positionData.screenCoords);
        this.lensing.manageLensUpdate();
    }

    /** - TODO :: ckpt. 20220706
     * @function handleViewerZoom
     * Configures position data for zoom and raises hidden viewer click event
     *
     * @param {Event} e
     *
     * @returns null
     */
    handleViewerZoom(e) {

        // Update zoom data
        this.lensing.positionData.zoom = e.zoom;
        if (e.refPoint && e.refPoint.hasOwnProperty('x') && e.refPoint.hasOwnProperty('y')) {

            // Config
            this.lensing.positionData.currentEvent = 'zoom';
            this.lensing.positionData.screenCoords = [];

            // Emulate event
            this.lensing.positionData.refPoint = e.refPoint;
            this.lensing.viewerAux.raiseEvent('click', {eventType: 'zoom', immediately: false});
        } else {
            this.lensing.positionData.refPoint = this.lensing.viewer.viewport.getCenter(false);
        }
    }

    /** - TODO :: ckpt. 20220706
     * @function handleViewerAuxMove
     *
     * @param {Event} e
     *
     * @returns void
     */
    handleViewerAuxMove(e) {

        // Update lensing position reference point
        this.lensing.positionData.refPoint = this.lensing.viewer.viewport.getCenter(false);
        const diff = this.lensing.viewerAuxCanvas.width / this.lensing.viewerCanvas.width;
        const zoom = this.lensing.positionData.zoom * this.lensing.configs.mag / diff;

        // Keep viewerAux in sync with primary viewer
        this.lensing.viewerAux.viewport.panTo(this.lensing.positionData.refPoint, e.immediately);
        this.lensing.viewerAux.viewport.zoomTo(zoom, this.lensing.positionData.refPoint, e.immediately);

        this.lensing.manageLensUpdate();
    }

    handleLensOpacity(o) {
      this.lensing.viewerAux.world._items.forEach(i => {
        if ([o, i.getOpacity()].every(x => x !== 0)) i.setOpacity(o);
      })
    }

    handleLensResize(zoom_in) {
      const { radInc, radMin, radMax } = this.lensing.configs;
      if (zoom_in) {
        if (this.lensing.configs.rad + radInc <= radMax) {
            this.lensing.configs.rad += radInc;
        }
      }
      else {
        if (this.lensing.configs.rad - radInc >= radMin) {
            this.lensing.configs.rad -= radInc;
        }
      }
    }

    /** - TODO :: ckpt. 20220706
     * @function handleViewerKeydown
     * Handles keyboard shortcuts
     *
     * @param {Event} e
     *
     * @returns void
     */
    handleViewerKeydown(e) {

        // Lens filter
        const keys_filter = ['{', '}', '|'];
        if (keys_filter.includes(e.key)) {
            // Specifics
            if (e.key === '{') {
                this.lensing.lenses.changeLens('prev', 'filter');
            } else if (e.key === '}') {
                this.lensing.lenses.changeLens('next', 'filter');
            } else if (e.key === '|') {
                this.lensing.lenses.changeLens('none', 'filter');
            }
            // Generics
            this.lensing.configs.counterException = true;
            this.lensing.manage_slider_update();
            this.lensing.manageLensUpdate();
        }

        // Lens shape
        const keys_shape = ['L'];
        if (keys_shape.includes(e.key)) {
            // Specifics
            if (e.key === 'L') {
                if (this.lensing.configs.shape === 'circle') {
                    this.lensing.configs.shape = 'square';
                } else if (this.lensing.configs.shape === 'square') {
                    this.lensing.configs.shape = 'circle';
                }
            }
            // Generics
            this.lensing.configs.counterException = true;
            this.lensing.manageLensUpdate();
        }

        // Lens sizing
        const keys_size = ['[', ']', '\\'];
        if (keys_size.includes(e.key)) {
            // Specifics
            if (e.key === '[') {
              this.handleLensResize(false);
            } else if (e.key === ']') {
              this.handleLensResize(true);
            } else if (e.key === '\\') {
                this.lensing.configs.rad = this.lensing.configs.radDefault;
            }
            // Generics
            this.lensing.configs.counterException = true;
            this.lensing.manageLensUpdate();
        }

        // Lens placement
        const keys_dropFetch = ['p'];
        if (keys_dropFetch.includes(e.key)) {
            // Specifics
            if (e.key === 'p') {
                this.lensing.configs.placed = !this.lensing.configs.placed;
            }
            // Generics
            this.lensing.configs.counterException = true;
            this.lensing.manageLensUpdate();
        }

        // Lens magnification
        const keys_mag = ['m', ',', '.', '/'];
        if (keys_mag.includes(e.key)) {
            // Specifics
            if (e.key === 'm') {
                this.lensing.lenses.changeLens('next', 'magnifier');
                this.lensing.configs.mag = this.lensing.lenses.selections.magnifier.settings.active = this.lensing.lenses.selections.magnifier.settings.default;
            } else if (e.key === ',') {
                if (this.lensing.configs.mag - this.lensing.lenses.selections.magnifier.settings.step >= this.lensing.lenses.selections.magnifier.settings.min) {
                    this.lensing.configs.mag -= this.lensing.lenses.selections.magnifier.settings.step;
                    this.lensing.lenses.selections.magnifier.settings.active = this.lensing.configs.mag;
                }
            } else if (e.key === '.') {
                if (this.lensing.configs.mag + this.lensing.lenses.selections.magnifier.settings.step <= this.lensing.lenses.selections.magnifier.settings.max) {
                    this.lensing.configs.mag += this.lensing.lenses.selections.magnifier.settings.step;
                    this.lensing.lenses.selections.magnifier.settings.active = this.lensing.configs.mag;
                }
            } else if (e.key === '/') {
                this.lensing.configs.mag = this.lensing.lenses.selections.magnifier.settings.default;
                this.lensing.lenses.selections.magnifier.settings.active = this.lensing.configs.mag;
            }
            // Generics
            this.lensing.configs.counterException = true;
            this.lensing.positionData.refPoint = this.lensing.positionData.eventPoint;
            this.lensing.positionData.zoom = this.lensing.viewer.viewport.getZoom(true);
            this.lensing.viewerAux.raiseEvent('click', {eventType: 'zoom', immediately: true});
        }

      // Lens snapshot
        const keys_snapshot = ['D'];
        if (keys_snapshot.includes(e.key)) {
            // Specifics
            if (e.key === 'D') {
                this.lensing.snapshots.take_snapshot();
            }
        }


    }


}

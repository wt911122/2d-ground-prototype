import { createCanvas } from '../utils/canvas';
import { bounding_box } from '../utils/functions';

class JFlow extends EventTarget{

    constructor({ points }) {
        super();
        this.points = points;
        this.ctx = null;
        this.canvas = null;
        this.dpr = 1;
        this.padding = 20;
        /**
            for zoom and pinch
         */
        this.position = null;
		this.scale = null;
        this.maxZoom = 3;
        this.minZoom = .5
		// this.initScale = 1;
		// this.initPosition = null
		this.offeset = null;
        this._lastState = {
            x: null,
            y: null,
            dragging: false,
            processing: false
        };


    }

    $mount(dom) {
        const { 
            canvas, 
            ctx, 
            scale: dpr, 
            width: c_width, 
            height: c_height, 
            raw_width,
            raw_height,
            left, top 
        } = createCanvas(dom);
        
        this.ctx = ctx;
        this.canvas = canvas;
        this.canvasMeta = {
            width: raw_width,
            height: raw_height,
        }
        this.dpr = dpr;
        this._createEventHandler();
        this.bounding_box = bounding_box(this.points);
        const padding = this.padding;
        const { width: p_width, height: p_height, x, y } = this.bounding_box;
       
        const contentBox = {
            x: padding,
            y: padding,
            width: c_width - padding * 2,
            height: c_height - padding * 2,
        }
        const position = { x: 0, y: 0, offsetX: 0, offsetY: 0 };
        const w_ratio = contentBox.width / p_width;
        const h_ratio = contentBox.height / p_height;
        const align = w_ratio <= h_ratio ? 'x' : 'y';
        const scaleRatio = Math.min(w_ratio, h_ratio);
        this.scale = scaleRatio;
        // this.initScale = scaleRatio;
        position.x = align === 'x' ? contentBox.x : (contentBox.width - p_width * scaleRatio) / 2
        position.y = align === 'y' ? contentBox.y : (contentBox.height - p_height * scaleRatio) / 2
        position.offsetX = position.x - x * scaleRatio;
        position.offsetY = position.y - y * scaleRatio;
        this.position = position;
        // this.initPosition = { x: position.x, y: position.y, offsetX: position.offsetX, offsetY: position.offsetY };
        ctx.scale(dpr, dpr);
        this._render();
    }

    _createEventHandler() {
        const canvas = this.canvas;
        canvas.addEventListener('wheel', this._onZoom.bind(this) );
        canvas.addEventListener('pointerdown', this._onPressStart.bind(this) );
        canvas.addEventListener('pointermove', this._onPressMove.bind(this) );
        canvas.addEventListener('pointerup', this._onPressUp.bind(this) );
        document.addEventListener('pointerup', this._onPressUp.bind(this))
    }

    _onZoom(event) {
        if(this._zooming) return;
        this._zooming = true;
        const { offsetX, offsetY, deltaY } = event
        const { width: p_width, height: p_height, x, y } = this.bounding_box;
        let newScale = this.scale;
        const amount = deltaY > 0 ? 1.1 : 1 / 1.1;
        newScale *= amount;

        if (this.maxZoom && newScale > this.maxZoom){
            // could just return but then won't stop exactly at maxZoom
            newScale = this.maxZoom;
        }

        if(this.minZoom && newScale < this.minZoom) {
            newScale = this.minZoom;
        }

        var deltaScale    = newScale - this.scale;
        var currentWidth  = p_width * this.scale;
        var currentHeight = p_height * this.scale;
        var deltaWidth    = p_width * deltaScale;
        var deltaHeight   = p_height * deltaScale;

        var tX = offsetX - this.position.x;
        var tY = offsetY - this.position.y;
        var pX = -tX / currentWidth;
        var pY = -tY / currentHeight;

        this.scale = newScale;
        this.position.x += pX * deltaWidth;
		this.position.y += pY * deltaHeight;
        this.position.offsetX = this.position.x - x * newScale;
        this.position.offsetY = this.position.y - y * newScale;
        requestAnimationFrame(() => {
            this._render();
            this._zooming = false;
        })
    }

    _onPressStart(event) { 
        const { offsetX, offsetY, deltaY } = event
        this._lastState = {
            x: event.offsetX,
            y: event.offsetY,
            dragging: true,
            processing: false,
        }
    }

    _onPressMove(event) {
        if(!this._lastState.dragging) return;
        if(this._lastState.processing) return;
        this._lastState.processing = true;
        const { offsetX, offsetY } = event;

        const deltaX = offsetX - this._lastState.x;
        const deltaY = offsetY - this._lastState.y;
        this._lastState.x = offsetX;
        this._lastState.y = offsetY;
        this._recalculatePosition(deltaX, deltaY);
        requestAnimationFrame(() => {
            this._render();
            this._lastState.processing = false;
        })
    }

    _onPressUp() {
        console.log('pointerup')
        this._lastState = {
            x: null,
            y: null,
            dragging: false,
            processing: false,
        }
    }

    _recalculatePosition(deltaX, deltaY, scale) {
        const { x, y } = this.bounding_box;
        if(scale === undefined) {
            scale = this.scale;
        }
        this.position.x += deltaX;
		this.position.y += deltaY;
        this.position.offsetX = this.position.x - x * scale;
        this.position.offsetY = this.position.y - y * scale;
    }

    _calculatePoint(p) {
        const scale = this.scale;
        const position = this.position;
        return [p[0] * scale + position.offsetX, p[1] * scale + position.offsetY]
    }

    _calculateDistance(l) {
        const scale = this.scale;
        return scale * l;
    }

    _resetTransform() {
        const { width: c_width, height: c_height } = this.canvasMeta;
        const position = this.position;
        const scale = this.scale;
        const ctx = this.ctx;
        ctx.setTransform();
        ctx.clearRect(0, 0, c_width, c_height);
        ctx.scale(this.dpr, this.dpr);
        ctx.transform(scale, 0, 0, scale, position.offsetX, position.offsetY);
    }

    _render() {
        const { width: p_width, height: p_height, x, y } = this.bounding_box;
        const ctx = this.ctx;
        this._resetTransform();
        ctx.beginPath();
        ctx.rect(x, y, p_width, p_height);
        ctx.save();
        ctx.strokeStyle = 'blue'
        ctx.lineWidth = 10;
        ctx.stroke();
        ctx.restore();
        const radius = 20
        const fontSize = 10
        this.points.forEach((p, idx) => {
            const [x, y] = p;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.fill();
            ctx.save();
            ctx.font = `bold ${fontSize}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'white';
            ctx.fillText(String.fromCharCode(65 + idx), x, y);
            ctx.restore();
        })
    }
}

export default JFlow;
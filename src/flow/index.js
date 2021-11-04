import { createCanvas } from '../utils/canvas';
import { bounding_box } from '../utils/functions';
import StackMixin from '../instance/stackMixin';
import LayoutMixin from '../instance/layoutMixin';
import MessageMixin from '../instance/messageMixin';
import { setUniqueId, getUniqueId } from '../utils/functions';
import Point from '../instance/point';
export { default as Point } from '../instance/point';
export { default as Rectangle } from '../instance/rectangle';
export { default as Group } from '../instance/group2';
export { default as Text } from '../instance/text';
export { default as Icon } from '../instance/image';
export { default as Link } from '../instance/link';
export { default as PolylineLink } from '../instance/polyline-link';
export { default as BezierLink } from '../instance/bezier-link';
export { default as LinearLayout} from '../layout/linear-layout';

class JFlow {
    constructor(configs) {
        this.initStack(configs);
        this.initLayout(configs);
        this.plugins = [];
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
        this._lastDragState = {
            target: null,
            targetLink: null,
            processing: false,
        }

        /**
            for focus
         */
        this._lastFocus = {
            instance: null,
            processing: false,
        }

        this.allowDrop = configs.allowDrop;
    }

    use(plugin) {
        this.plugins.push(plugin)
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
        this.reflow();
        this.ctx = ctx;
        this.canvas = canvas;
        this.canvasMeta = {
            width: raw_width,
            height: raw_height,
        }
        this.dpr = dpr;
        this._createEventHandler();
        this._getBoundingGroupRect();

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
        if(scaleRatio > this.maxZoom) {
            this.maxZoom = scaleRatio;
        }
        if(scaleRatio < this.minZoom) {
            this.minZoom = scaleRatio;
        }
        // this.initScale = scaleRatio;
        position.x = align === 'x' ? contentBox.x : (contentBox.width - p_width * scaleRatio) / 2 + padding
        position.y = align === 'y' ? contentBox.y : (contentBox.height - p_height * scaleRatio) / 2 + padding
        position.offsetX = position.x - x * scaleRatio;
        position.offsetY = position.y - y * scaleRatio;
        this.position = position;
        
        this._render();
    }
    
    _getBoundingGroupRect() {
        const points = this._stack.getBoundingRectPoints();
        this.bounding_box = bounding_box(points);
    }

    $setFocus(instance) {
        if(this._lastFocus.processing) return;
        this._lastFocus.processing = true;
        if(this._lastFocus.instance){
            this._lastFocus.instance.status.focus = false;
        }
        
        this._lastFocus.instance = instance;
        if(instance) {
            instance.status.focus = true;
            instance.bubbleEvent(new CustomEvent('focus'))
        }

        requestAnimationFrame(() => {
            this._render();
            this._lastFocus.processing = false;
        })

    }

    _createEventHandler() {
        const canvas = this.canvas;
        canvas.addEventListener('wheel', this._onZoom.bind(this) );
        canvas.addEventListener('pointerdown', this._onPressStart.bind(this) );
        canvas.addEventListener('pointermove', this._onPressMove.bind(this) );
        canvas.addEventListener('pointerup', this._onPressUp.bind(this) );
        // canvas.addEventListener('click', this._onClick.bind(this));
        document.addEventListener('pointerup', this._onPressUp.bind(this));
        
        if(this.allowDrop) {
            canvas.addEventListener('dragover', event => {
                event.preventDefault();
                if(this._lastDragState.processing) return;
                this._lastDragState.processing = true;
                let refresh = false;
                const { offsetX, offsetY } = event
                const {
                    target,
                    targetLink,
                } = this._targetLockOn([offsetX, offsetY])

                if(this._lastDragState.targetLink !== targetLink 
                    || this._lastDragState.target !== target){
                    refresh = true;
                } 

                if(this._lastDragState.target && this._lastDragState.target !== target){
                    this._lastDragState.target.status.hover = false;
                }

                if(targetLink) {
                    targetLink.status.hover = true;
                }
                if(this._lastDragState.targetLink && this._lastDragState.targetLink !== targetLink){
                    this._lastDragState.targetLink.status.hover = false;
                }
                this._lastDragState.target = target;
                this._lastDragState.targetLink = targetLink;

                if(refresh) {
                    requestAnimationFrame(() => {
                        this._render();     
                        this._lastDragState.processing = false;
                    })
                } else {
                    this._lastDragState.processing = false;
                }
                

            });
            canvas.addEventListener('drop', (event) => {
                // event.preventDefault();
                const { offsetX, offsetY, clientX, clientY } = event
                const payload = this.consumeMessage();
                const instance = payload.instance;

                const { target, targetLink } = this._lastDragState;
                const {
                    point,
                    stack,
                    linkStack,
                    belongs,
                } = this._targetLockOn([offsetX, offsetY]);
                console.log(target)
                // instance.anchor = point;
                console.log(stack)
                // belongs.addToStack(instance);

                if(targetLink) {
                    instance.anchor = point;
                    belongs.addToStack(instance);
                    const { from, to } = targetLink;
                    const index = linkStack.findIndex(l => l === targetLink);
                    const _constuctor = targetLink.__proto__.constructor;
                    linkStack.splice(index, 1,
                        new _constuctor({
                            from, 
                            to: instance,
                        }),
                        new _constuctor({
                            from: instance, 
                            to,
                        }));
                } else if(target) {
                    target.bubbleEvent(new CustomEvent('drop', {
                        detail: {
                            instance,
                            jflow: this,
                        }
                    }))
                }
                
                requestAnimationFrame(() => {
                    this.recalculate();
                    this._render();     
                    instance.bubbleEvent(new CustomEvent('`droped`', {
                        detail: {
                            offsetX,
                            offsetY,
                            clientX,
                            clientY,
                            instance,
                            jflow: this,
                        }
                    }))
                })
            })
        } 
    }

    _targetLockOn(offsetPoint, setFocusFlag = true) {
        let point = this._calculatePointBack(offsetPoint);
        this._currentp = point;
        let stack = this._stack;
        const target = stack.checkHit(point);
        let linkStack = this._linkStack;
        let belongs = this;
        if(target) {
            linkStack = target._belongs._linkStack;
            point = target._belongs._currentp;
            stack = target._belongs._stack;
            belongs = target._belongs
        }
        const targetLink = linkStack.checkHit(point);
        if(setFocusFlag) {
            this.$setFocus(targetLink || target);
        }
        return {
            belongs,
            target, 
            targetLink,
            point,
            stack,
            linkStack,
        }
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
        const {
            target,
            targetLink
        } = this._targetLockOn([offsetX, offsetY]);
        
        this._lastState = {
            x: event.offsetX,
            y: event.offsetY,
            initialX: event.offsetX,
            initialY: event.offsetY,
            dragging: true,
            processing: false,
            target,
            targetLink,
        }
    }

    _onPressMove(event) {
        const {
            x, y, dragging, processing, target,
        } = this._lastState;
        if(!dragging && !processing) {
            const { offsetX, offsetY, clientX, clientY } = event
            const {
                target,
                targetLink
            } = this._targetLockOn([offsetX, offsetY], false);

            if(target || targetLink) {
                this.canvas.style.cursor = 'move';
                // this._lastHoverTarget = (target || targetLink);
                const t = (target || targetLink);
                // console.log(t)
                t.bubbleEvent(new CustomEvent('hover', {
                    detail: {
                        offsetX,
                        offsetY,
                        clientX,
                        clientY,
                        target: t,
                        jflow: this,
                        bubbles: true,
                    }
                }))

            } else {
                this.canvas.style.cursor = 'default';
            }
        }
        if(!dragging) return;
        if(processing) return;
        let movingtarget = target;
        while (movingtarget && movingtarget._belongs.lock && movingtarget !== this) {
            movingtarget = movingtarget._belongs;
        }
        if(movingtarget === this) return;

        this._lastState.processing = true;
        const { offsetX, offsetY } = event;
        const deltaX = offsetX - x;
        const deltaY = offsetY - y;

        if(movingtarget) {
            movingtarget.anchor[0] += deltaX / this.scale;
            movingtarget.anchor[1] += deltaY / this.scale;
        } else {
            this._recalculatePosition(deltaX, deltaY);    
        }
        this._lastState.x = offsetX;
        this._lastState.y = offsetY;

        requestAnimationFrame(() => {
            this._render();
            this._lastState.processing = false;
        })
        
    }

    _onPressUp(event) {
        if(this._lastState.initialX === this._lastState.x
            && this._lastState.initialY === this._lastState.y
            && this._lastState.target) {
            console.log(this._lastState.target)
            this._lastState.target.bubbleEvent(new CustomEvent('click', {
                detail: {
                    jflow: this,
                    offsetX: event.offsetX,
                    offsetY: event.offsetY,
                    clientX: event.clientX,
                    clientY: event.clientY,
                }
            }))
        }
        this._lastState = {
            x: null,
            y: null,
            initialX: null,
            initialY: null,
            dragging: false,
            processing: false,
            target: null,
        }
    }

    _onClick(event) {
        const { offsetX, offsetY } = event;
        const point = this._calculatePointBack([offsetX, offsetY]);
        const target = this._stack.checkHit(point);
        console.log(target)
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

    _calculatePointBack(p) {
        const scale = this.scale;
        const position = this.position;
        return [(p[0] - position.offsetX)/scale, (p[1] - position.offsetY) / scale];
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
        this._resetTransform();
        this._linkStack.render(this.ctx);
        this._stack.render(this.ctx);
        
    }
}
Object.assign(JFlow.prototype, MessageMixin);
Object.assign(JFlow.prototype, StackMixin);
Object.assign(JFlow.prototype, LayoutMixin);
export default JFlow;
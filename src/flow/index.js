import { createCanvas } from '../utils/canvas';
import { bounding_box } from '../utils/functions';
import StackMixin from '../instance/stackMixin';
import LayoutMixin from '../instance/layoutMixin';
import MessageMixin from '../instance/messageMixin';
import { setUniqueId, getUniqueId } from '../utils/functions';
import Point from '../instance/point';
import JFlowEvent from '../events';
export { default as JFlowEvent } from '../events';
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
        this.uniqueName = 'jflow';
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

        this._target = {
            instance: null,
            link: null,
            moving: null,
            isInstanceDirty: false, 
            isLinkDirty: false, 
            isMovingDirty: false, 
            cache: {
                stack: null,
                belongs: null,
                point: null,
            },
            meta: {
                x: undefined,
                y: undefined,
                initialX: undefined,
                initialY: undefined, 
            },
            status: {
                dragovering: false,
                dragging: false,
                processing: false,
            }
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
            instance.bubbleEvent(new JFlowEvent('focus'))
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
                const { offsetX, offsetY } = event
                Object.assign(this._target.status, {
                    dragovering: true,
                })
                this._targetLockOn([offsetX, offsetY])
                
                if(this._target.isLinkDirty || this._target.isInstanceDirty) {
                    requestAnimationFrame(() => {
                        this._render();    
                        this._target.isLinkDirty = false; 
                        this._target.isInstanceDirty = false;
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

                // const { target, targetLink } = this._lastDragState;
                // const {
                //     point,
                //     stack,
                //     linkStack,
                //     belongs,
                // } = this._targetLockOn([offsetX, offsetY]);
                const {
                    link,
                    instance: target,
                } = this._target;

                if(link) {
                    const {
                        point, belongs
                    } = this._target.cache;
                    instance.anchor = point;
                    belongs.addInstanceToLink(link, instance)
                } else if(target) {
                    console.log(target)
                    target.bubbleEvent(new JFlowEvent('drop', {
                        event,
                        instance,
                        jflow: this,
                        target,
                    }))
                }
                
                requestAnimationFrame(() => {
                    this.recalculate();
                    this._render();     
                    instance.bubbleEvent(new JFlowEvent('droped', {
                        event,
                        instance,
                        jflow: this,
                        target,
                    }))
                    Object.assign(this._target.status, {
                        dragovering: false,
                    })
                })
            })
        } 
    }

    _targetLockOn(offsetPoint) {
        let point = this._calculatePointBack(offsetPoint);
        this._currentp = point;
        let stack = this._stack;
        const target = stack.checkHit(point, (instance) => {
            return this._target.status.dragging && (instance === this._target.moving)
        });
        let linkStack = this._linkStack;
        let belongs = this;
        if(target) {
            linkStack = target._belongs._linkStack;
            point = target._belongs._currentp;
            stack = target._belongs._stack;
            belongs = target._belongs
        }
        const targetLink = linkStack.checkHit(point);

        Object.assign(this._target, {
            instance: target,
            link: targetLink, 
            isInstanceDirty: target === this._target.instance,
            isLinkDirty: targetLink === this._target.link,
        });
        Object.assign(this._target.cache, {
            stack,
            belongs,
            point,
        })
        Object.assign(this._target.meta, {
            x: offsetPoint[0],
            y: offsetPoint[1],
        });

        if(!this._target.status.dragging && !this._target.status.dragovering) {
            let movingtarget = target;
            while (movingtarget && movingtarget._belongs.lock && movingtarget !== this) {
                movingtarget = movingtarget._belongs;
            }
            if(movingtarget === this) {
                movingtarget = target;
            }
            Object.assign(this._target, {
                moving: movingtarget,
                isMovingDirty: movingtarget === this._target.moving,
            })
        }
        return this._target;

        // this._target = {
        //     instance: target,
        //     link: targetLink,
        //     moving: movingtarget,
        //     isInstanceDirty: target === this._target.instance,
        //     isLinkDirty: targetLink === this._target.link,
        //     isMovingDirty: movingtarget === this._target.moving,
        //     meta: {
        //         x: offsetPoint[0],
        //         y: offsetPoint[1],
        //     }
        //     point,
        //     belongs
        // }

        // return {
        //     belongs,
        //     movingtarget,
        //     target, 
        //     targetLink,
        //     point,
        //     stack,
        //     linkStack,
        // }
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
        this._targetLockOn([offsetX, offsetY]);
        Object.assign(this._target.meta, {
            initialX: offsetX,
            initialY: offsetY,
        })
        Object.assign(this._target.status, {
            dragging: true,
            processing: false,
        })
    }

    _onPressMove(event) {
        const {
            dragging, processing
        } = this._target.status;
        const { x, y } = this._target.meta;

        const { offsetX, offsetY, clientX, clientY } = event
        if(!dragging && !processing) {
            const {
                link,
                instance
            } = this._targetLockOn([offsetX, offsetY]);
            if(instance || link) {
                this.canvas.style.cursor = 'move';
            } else {
                this.canvas.style.cursor = 'default';
            }
        }
        if(!dragging) return;
        if(processing) return;
        
        const movingtarget = this._target.moving;

        this._target.status.processing = true;
        const deltaX = offsetX - x;
        const deltaY = offsetY - y;

        if(movingtarget) {
            movingtarget.anchor[0] += deltaX / this.scale;
            movingtarget.anchor[1] += deltaY / this.scale;
        } else {
            this._recalculatePosition(deltaX, deltaY);    
        }
        this._targetLockOn([offsetX, offsetY])

        // this._target.meta.x = offsetX;
        // this._target.meta.y = offsetY;
        
        requestAnimationFrame(() => {
            this._render();
            this._target.isLinkDirty = false; 
            this._target.isInstanceDirty = false;
            this._target.status.processing = false;
        })
        
    }

    _onPressUp(event) {
        const meta = this._target.meta;
        if(meta.initialX === meta.x
            && meta.initialY === meta.y
            && this._target.instance) {
            const t = this._target.instance;
            t.bubbleEvent(new JFlowEvent('click', {
                event,
                target: t,
                jflow: this,
                bubbles: true,
            }))
        } else if(this._target.moving) {
            let checkresult = false;
            if(this._layout.static) {
                checkresult = this.staticCheck(this._target.moving);
            }

            if(!checkresult && this._target.link) {
                const {
                    point, belongs
                } = this._target.cache;
                const instance = this._target.moving;
                instance.anchor = point;
                belongs.addInstanceToLink(this._target.link, instance);
                this.recalculate();
            }
            this._target.moving = null;
            this._target.isMovingDirty = false;
            this._render();
        }
        Object.assign(this._target.meta, {
            x: undefined,
            y: undefined,
            initialX: undefined,
            initialY: undefined, 
        })
        Object.assign(this._target.status, {
            dragging: false,
            processing: false,
        })
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
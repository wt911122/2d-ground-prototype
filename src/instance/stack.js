class InstanceStack extends Array {
    constructor() {
        super();
    }

    render(ctx) {
        // TODO 拖动的元素调整到最后 
        // let topInstance = null;
        this.forEach(instance => {
            if(instance.visible) {
                ctx.save();
                if(instance.reflow && !instance._reflowed) {
                    instance.reflow();
                    instance._reflowed = true;
                }
                instance.render(ctx);
                ctx.restore();
            }
        })
    }

    checkHit(point, condition){
        let i = this.length - 1;
        while(i >= 0) {
            const instance = this[i];
            
            if(instance.visible) {
                if(condition && !condition(instance)) {
                    i--
                    continue;
                }
                const ishit = instance.isHit(point, condition);
                if(ishit) {
                    if(typeof ishit !== 'boolean') {
                        return ishit;
                    }
                    return instance;
                }
            }
            i--
        }

        return null;
    }

    getBoundingRectPoints() {
        const points = [];
        this.forEach(instance => {
            if(instance.visible && !instance.outOfFlow) {
                points.splice(points.length, 0, ...instance.getBoundingRect());
            }
        });
        return points;
    }
}

export default InstanceStack;

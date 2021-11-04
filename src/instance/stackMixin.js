import InstanceStack from './stack';
// import Link from './link';
import Link from './polyline-link';
import { setUniqueId, getUniqueId } from '../utils/functions';

const StackMixin = {
    instances: [],
    links: [],
    _stack: null,
    _linkStack: null,
    initStack({ data }) {
        this._stack = new InstanceStack();
        this._linkStack = new InstanceStack();
        if(!data) return;
        this.instances = data.instances;
        this.links = data.links;
        this.instances.forEach(i => { 
            this._stack.push(i);
            i._belongs = this;
            i._jflow = this._jflow || this;
        })
        this.links.forEach((link) => {
            this._linkStack.push(link);
            i._jflow = this._jflow || this;
        });
    },

    addToStack(instance) {
        instance._belongs = this;
        instance._jflow = this._jflow || this;
        this._stack.push(instance);
        this.recalculate()
    },

    replaceFromStack(target, instance) {
        const index = this._stack.findIndex(i => i === target);
        this._stack.splice(index, 1, instance);
        target._belongs = null;
        instance._belongs = this;
        this.recalculate()
    },

    addToLinkStack(link) {
        link._belongs = this;
        link._jflow = this._jflow || this;
        this._linkStack.push(link);
    },

    removeFromStack(target) {
        const index = this._stack.findIndex(i => i === target);
        this._stack.splice(index, 1);
        this.recalculate()
    },
    removeFromLinkStack(target) {
        const index = this._linkStack.findIndex(i => i === target);
        this._linkStack.splice(index, 1);
    },

    // reLayout() {
    //     this.reflow();
    //     this._getBoundingGroupRect();
    //     if(this._belongs) {
    //         this._belongs.reLayout();
    //     }
    // }
    // addToTempStack(instance) {
    //     this._tempStack.push(instance);
    // },

    // truncateTempStack() {
    //     let temp;
    //     if(this._tempStack) {
    //         temp = this._tempStack.slice();
    //     }
    //     this._tempStack = new InstanceStack();
    //     return temp;
    // }

}

export default StackMixin;
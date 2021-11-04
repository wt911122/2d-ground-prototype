/**
    tree layout
    + link
        root to leafs, level by level
    + no link blocks 
        top to bottom, no overlap
 */

function getInstanceHeight(instance) {
    const rect = instance.getBoundingRect();
    let min_y = Infinity;
    let max_y = -Infinity;
    let min_x = Infinity;
    let max_x = -Infinity;
    rect.forEach(point => {
        max_y = Math.max(max_y, point[1]);
        min_y = Math.min(min_y, point[1]);
        max_x = Math.max(max_x, point[0]);
        min_x = Math.min(min_x, point[0]);
    });
    return {
        height: max_y - min_y,
        width: max_x - min_x,
    }
}

function iterateLinks(
    reduceHeight,
    lastLevelHeight,
    links,
    linkLength,
    target, 
    stack,
) {
    let levelHeight = 0;
    const to = [];
    const nextLinks = [];
    links.forEach(l => {
        if(l.from === target && !stack.includes(l.to)) {
            const { height, width } = getInstanceHeight(l.to);
            levelHeight = Math.max(levelHeight, height);
            to.push(l.to);
            stack.push(l.to)
        } else {
            nextLinks.push(l);
        }
    });
    reduceHeight += (levelHeight/2 + linkLength + lastLevelHeight);
    lastLevelHeight = levelHeight / 2;
    to.forEach(t => {
        t.anchor = [0, reduceHeight];
        iterateLinks(reduceHeight, lastLevelHeight, nextLinks, linkLength, t, stack)
    });
}

// function (root, links, options) {
//     let level = 0;
//     const linkLength = options.linkLength || 18;
//     root.anchor = [0, 0];
//     const stack = [root];
    
//     const { height: reduceHeight } = getInstanceHeight(root) / 2;

//     iterateLinks(reduceHeight, links, linkLength, root, stack);
// }

class TreeLayout {
    constructor(configs) {
        this.linkLength = configs.linkLength || 18;
        this.root = configs.root;
    }

    reflow(jflow){
        const links = jflow._linkStack;
        const instances = jflow._stack;
        let root = this.root;
        if(!root) {
            root = instances[0];
        }
        let level = 0;
        const linkLength = this.linkLength;
        root.anchor = [0, 0];
        const stack = [root];
        
        const { height } = getInstanceHeight(root);
        const reduceHeight = 0;
        iterateLinks(reduceHeight, height/2, links, linkLength, root, stack);
    }
}

export default TreeLayout;
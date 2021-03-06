

export function createCanvas(wrapper) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const { width, height, left, top } = wrapper.getBoundingClientRect();
    // Set actual size in memory (scaled to account for extra pixel density).
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    const scale = window.devicePixelRatio; // Change to 1 on retina screens to see blurry canvas.
    canvas.width = Math.floor(width * scale);
    canvas.height = Math.floor(height * scale);
    
    // Normalize coordinate system to use css pixels.
    // ctx.scale(scale, scale);
    if(wrapper) {
        wrapper.append(canvas);
    }
    return {
        canvas,
        width,
        height,
        raw_width: canvas.width,
        raw_height: canvas.height,
        left,
        top,
        ctx,
        scale,
    }
}

const caheCanvas = document.createElement('canvas');
caheCanvas.width = 1;
caheCanvas.height = 1;
const caheCanvasctx = caheCanvas.getContext('2d');
const scale = window.devicePixelRatio;
caheCanvasctx.scale(scale, scale);

export function requestCacheCanvas(render) {
    caheCanvasctx.clearRect(0,0,5,5);
    render(caheCanvasctx);
    caheCanvasctx.clearRect(0,0,5,5);
}
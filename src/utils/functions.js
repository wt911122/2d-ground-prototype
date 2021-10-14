export function bounding_box(points) {
    let min_x = Infinity; 
    let min_y = Infinity; 
    let max_x = -Infinity; 
    let max_y = -Infinity; 
    for(let idx in points) {
        const item = points[idx];
        if(item[0] < min_x){
            min_x = item[0]
        }

        if (item[0] > max_x) {
            max_x = item[0]
        } 

        if (item[1] < min_y) {
            min_y = item[1]
        }

        if (item[1] > max_y) {
            max_y = item[1]
        }
    }
    return {
        // points: [(min_x,min_y),(max_x,min_y),(max_x,max_y),(min_x,max_y)],
        width: Math.max(max_x - min_x, 10),
        height: Math.max(max_y - min_y, 10),
        x: min_x,
        y: min_y,
    }
}
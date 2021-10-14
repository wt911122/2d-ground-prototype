import JFlow from "JFlow";

function randomPoints() {
    const points = [];
    let length = Math.floor((Math.random() * 20)) + 5;
    while (length -- ) {
        points.push([
            Math.floor(Math.random() * 800),
            Math.floor(Math.random() * 500),
        ])
    }
    return points;
}


const points = randomPoints();

const wrapper = document.getElementById('wrapper')
new JFlow({
    points
}).$mount(wrapper)


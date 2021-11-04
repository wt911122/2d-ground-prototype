import JFlow, { Point, Rectangle, Group, Link, PolylineLink, BezierLink } from "JFlow";
function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}
let id=0;
function randomInstances(number = 5, x = 800, y = 500) {
    const instance = [];
    let length = Math.floor((Math.random() * 5)) + number;

    while (length -- ) {
        const rand = Math.random();
        if(rand > 0.6) {
            const point = new Point({
                anchor: [
                    Math.floor(Math.random() * x),
                    Math.floor(Math.random() * y),
                ],
                content: String.fromCharCode(65 + id),
                radius: Math.floor(Math.random() * 20 + 10),
                color: getRandomColor(),
            });
            point.addEventListener('click', function(e){
                console.log(e, this);
            })
            instance.push(point);
        } else if(rand > 0){
            instance.push(new Rectangle({
                anchor: [
                    Math.floor(Math.random() * x),
                    Math.floor(Math.random() * y),
                ],
                width: Math.floor(Math.random() * 20 + 50),
                height:  Math.floor(Math.random() * 20 + 40),
                content: String.fromCharCode(65 + id),
                color: getRandomColor(),
            }));
        } else {
            const instances = randomInstances(1, 100, 150);
            const group = new Group({
                anchor: [
                    Math.floor(Math.random() * 800),
                    Math.floor(Math.random() * 500),
                ],
                data: {
                    instances,
                    links: randomLinks(instances),
                }
            })
            instance.push(group);
            group.addEventListener('click', function(e){
                console.log(e, this);
            })
        }
        id ++ ;
    }
    return instance;
}

function randomGroup() {
    const groups = [];
    let length = Math.floor((Math.random() * 3)) + 3;
    while (length -- ) {
        const instances = randomInstances(2, 100, 150);
        const group = new Group({
            anchor: [
                Math.floor(Math.random() * 800),
                Math.floor(Math.random() * 500),
            ],
            data: {
                instances,
                links: randomLinks(instances),
            }
        })
        groups.push(group);
        group.addEventListener('click', function(e){
            console.log(e, this);
        })
    }
    return groups;
}

function randomLinks(points) {
    const unlinked = points.slice();
    const links = [];
    let last;
    const p = unlinked.length;
    const idx = Math.min(Math.floor(Math.random() * p), p-1);
    const [ selected ] = unlinked.splice(idx, 1);
    last = selected

    while (unlinked.length) {
        const p = unlinked.length;
        const idx = Math.min(Math.floor(Math.random() * p), p-1);
        const [ selected ] = unlinked.splice(idx, 1);
        const link = new BezierLink({
            from: last,
            to: selected
        });
        links.push(link);
        link.addEventListener('click', function(event) {
            console.log(event, this)
        })
        last = selected;
    }
    console.log(links)
    return links;
}

function simpleInstance() {
    const instances = randomInstances(1, 100, 150);
    console.log(instances)
    return [
        new Point({
            id: id++,
            anchor: [
                Math.floor(Math.random() * 800),
                Math.floor(Math.random() * 500),
            ],
            content: String.fromCharCode(65),
            radius: Math.floor(Math.random() * 20 + 10),
            color: getRandomColor(),
        }),
        new Rectangle({
            id: id++,
            anchor: [
                Math.floor(Math.random() * 800),
                Math.floor(Math.random() * 500),
            ],
            width: Math.floor(Math.random() * 20 + 50),
            height:  Math.floor(Math.random() * 20 + 40),
            content: String.fromCharCode(66),
            color: getRandomColor(),
        }),
        new Group({
            id: id++,
            anchor: [
                Math.floor(Math.random() * 800),
                Math.floor(Math.random() * 500),
            ],
            data: {
                instances,
                links: randomLinks(instances),
            }
        })
    ]
}


// const points = randomInstances();
// const groups = randomGroup();
// console.log(points);
// console.log(groups)
// const instances = points.concat(groups);
// const links = randomLinks(instances);
const instances = simpleInstance();
const data = {
    instances,
    links: randomLinks(instances),
}

const sideBar = document.createElement('div');


const wrapper = document.getElementById('wrapper')
const jflowInstance = new JFlow({
    data,
    allowDrop: true,
});
jflowInstance.$mount(wrapper);

const buttons = document.querySelectorAll('.body > .sidebar > div > div');
buttons.forEach(btn => {
    btn.addEventListener('dragstart', function(e) {
        console.log(this)
        let instance;
        const type = btn.getAttribute('type');
        if(type === 'Point'){
            instance = new Point({
                content: 'circle',
                radius: 40,
                color: 'hotpink',
            })
        }
        if(type === 'Rectangle'){
            instance = new Rectangle({
                content: 'Rectangle',
                width: 80,
                height: 50,
                color: 'green',
            })
        }
        jflowInstance.sendMessage({ instance })
    });
})


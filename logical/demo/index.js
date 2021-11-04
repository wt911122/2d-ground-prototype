import JFlow, { BezierLink, Point, Rectangle, } from 'JFlow';
import Start from '../start';
import End from '../end';
import Assignment from '../assignment';
import Block from '../block';
import TreeLayout from '../tree-layout';
const start = new Start()
const assignment =  new Assignment()
const end = new End()
const block = new Block();

const data = {
    instances: [
       start,
       assignment,
       end,
    ],
    links: [new BezierLink({
        from: start,
        to: assignment
    }), new BezierLink({
        from: assignment,
        to: end
    })],
}
const wrapper = document.getElementById('wrapper');

const jflowInstance = new JFlow({
    data,
    allowDrop: true,
    layout: new TreeLayout({
        root: start,
        linkLength: 30,
    }),
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
                height: 280,
                color: 'green',
            })
        }
        jflowInstance.sendMessage({ instance })
    });
})
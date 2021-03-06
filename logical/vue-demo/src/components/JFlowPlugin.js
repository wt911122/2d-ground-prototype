import JFlowComponent from './JFlow';
import JFlowInstance from './JFlowInstance';
import JFlowLink from './JFlowLink';
import JFLowGroup from './JFlowGroup';
const JFLOW_NODES = [
    'Point',
    'Rectangle',
    'Text',
    'Icon',
];
const JFLOW_LINKS = [
    'Link',
    'PolylineLink',
    'BezierLink'
]

const components = [
    {
        name: 'Jflow',
        component: JFlowComponent,
    },
    {
        name: 'Group',
        component: JFLowGroup,
    },
    ...JFLOW_NODES.map(name => ({
        name,
        component: JFlowInstance(name)
    })),
    ...JFLOW_LINKS.map(name => ({
        name,
        component: JFlowLink(name)
    })),
];
const componentPrefix = 'j';
export default {
    install: (Vue, options) => {
        let prefixToUse = componentPrefix;
        if(options && options.prefix){
            prefixToUse = options.prefix;
        };
        components.forEach(k => {
            Vue.component(`${prefixToUse}${k.name}`, k.component);
        });

        if(options.custom) {
            Object.keys(options.custom).forEach(name => {
                Vue.component(`${prefixToUse}${name}`, JFlowInstance(options.custom[name]));
            })
        }
        
    }
}
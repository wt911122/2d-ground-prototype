import { Group, Point, Text, Icon, LinearLayout } from 'JFlow';
// import Variable from './variable.js';
import Selector from './selector';
import logicIcon from './logic.svg';
const p = new Image();
p.src = logicIcon;
class Block extends Group{
    constructor(configs) {
        super({
            layout: new LinearLayout({
                direction: 'vertical',
                gap: 0,
                alignment: 'start'
            }),
            padding: 10,
            borderColor: '#517cff',
            borderWidth: 2,
            borderRadius: 12,
            width: 300,
            hoverStyle: 'transparent',
            hasShrink: false,
            lock: true,
            data: {
                instances: [
                    new Group({
                        layout: new LinearLayout({
                            direction: 'horizontal',
                            gap: 0
                        }),
                        borderRadius: 10,
                        borderColor: '#ccc',
                        hoverStyle: '#517cff',
                        borderWidth: 0,
                        lock: true,
                        hasShrink: true,
                        data: {
                            instances: [
                                new Icon({
                                    image: p,
                                    width: 30,
                                    height: 30,
                                }),
                                new Text({
                                    font: '16px -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Helvetica,Tahoma,Arial,Noto Sans,PingFang SC,Microsoft YaHei,Hiragino Sans GB,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji',
                                    color: '#585c63',
                                    content: '调用逻辑',
                                }),
                            ],
                            links: [],
                        }
                    }),
                    new Text({
                        font: '12px -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Helvetica,Tahoma,Arial,Noto Sans,PingFang SC,Microsoft YaHei,Hiragino Sans GB,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji',
                        color: '#585c63',
                        content: '接口',
                    }), 
                    new Selector({
                        width: 280,
                    }),

                    new Text({
                        outOfFlow: true,
                        anchor: [130, -20],
                        content: '<>'
                    })

                ],
                links: []
            }
        })
    }
}

export default Block;
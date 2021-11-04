import { Group, Point, Text, LinearLayout } from 'JFlow';
import Variable from './variable.js';
import Slot from './slot.js';
class Assignment extends Group{
    constructor(configs) {
        const slot = new Slot();
        super({
            ...configs,
            layout: new LinearLayout(),
            borderColor: 'transparent',
            borderWidth: 0,
            hoverStyle: 'transparent',
            hasShrink: false,
            lock: true,
            data: {
                instances: [
                    new Text({
                        font: '12px -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Helvetica,Tahoma,Arial,Noto Sans,PingFang SC,Microsoft YaHei,Hiragino Sans GB,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji',
                        color: '#585c63',
                        content: '赋值',
                    }),
                    new Group({
                        layout: new LinearLayout({
                            direction: 'horizontal',
                            gap: 0
                        }),
                        borderRadius: 10,
                        padding: 10,
                        borderColor: '#ccc',
                        hoverStyle: '#517cff',
                        borderWidth: 2,
                        lock: true,
                        hasShrink: true,
                        data: {
                            instances: [
                                new Variable({
                                    content: 'variable'
                                }),
                                new Text({
                                    font: '12px -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Helvetica,Tahoma,Arial,Noto Sans,PingFang SC,Microsoft YaHei,Hiragino Sans GB,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji',
                                    color: '#585c63',
                                    content: '=',
                                }),
                                slot,
                            ],
                            links: [],
                        }
                    }),
                ],
                links: []
            }
        });
        slot.parent = this;
    }
}

export default Assignment;
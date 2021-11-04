import { Group, Point, Text } from 'JFlow';

class Start extends Group{
    constructor(configs) {
        super({
            ...configs,
            borderColor: 'transparent',
            borderWidth: 0,
            hoverStyle: 'translate',
            hasShrink: false,
            lock: true,
            data: {
                instances: [
                    new Point({
                        anchor: [0, 24],
                        color: '#99dbc5',
                        radius: 11,
                    }),
                    new Text({
                        anchor: [0, 0],
                        font: '12px -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Helvetica,Tahoma,Arial,Noto Sans,PingFang SC,Microsoft YaHei,Hiragino Sans GB,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji',
                        color: '#585c63',
                        content: '开始',
                    })
                ],
                links: []
            }
        })
    }
}

export default Start;
import { Group, Rectangle, Text } from 'JFlow';

class End extends Group{
    constructor(configs) {
        super({
            ...configs,
            borderColor: 'transparent',
            borderWidth: 0,
            hoverStyle: 'transparent',
            hasShrink: false,
            lock: true,
            data: {
                instances: [
                    new Rectangle({
                        anchor: [0, 24],
                        color: '#faaaaa',
                        width: 20,
                        height: 20,
                        borderRadius: 2,
                    }),
                    new Text({
                        anchor: [0, 0],
                        font: '12px -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Helvetica,Tahoma,Arial,Noto Sans,PingFang SC,Microsoft YaHei,Hiragino Sans GB,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji',
                        color: '#585c63',
                        content: '结束',
                    })
                ],
                links: []
            }
        })
    }
}

export default End;
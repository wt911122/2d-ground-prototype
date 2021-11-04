const path = require('path');
module.exports = {
    chainWebpack(config) {
        config.resolve.alias
            .set('JFlow', path.resolve(__dirname, '../../src/flow/index.js'));
    }
}
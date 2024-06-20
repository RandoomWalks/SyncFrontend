// tests/setupTests.js
require('fake-indexeddb/auto');
require('core-js/actual/structured-clone');
const { TextEncoder, TextDecoder } = require('util');

global.TextDecoder = TextDecoder;
global.TextEncoder = TextEncoder;

global.Worker = class {
    constructor(stringUrl) {
        this.url = stringUrl;
        this.onmessage = () => { };
        this.onmessageerror = () => { };
    }
    postMessage(msg) {
        const { action, data, clientId } = msg;
        switch (action) {
            case 'addItem':
            case 'fetchData':
            case 'getItemByClientId':
            case 'viewDoc':
                this.onmessage({ data: { action, data: `Simulated response for ${action}` } });
                break;
            default:
                this.onmessage({ data: { action: 'error', data: 'Unknown action' } });
                break;
        }
    }
    terminate() { }
};

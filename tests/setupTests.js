// tests/setupTests.js
require('fake-indexeddb/auto');
require('core-js/actual/structured-clone');
const {TextEncoder, TextDecoder} = require('util');

global.TextDecoder=TextDecoder;
global.TextEncoder=TextEncoder;


global.Worker = class {
    constructor(stringUrl) {
        this.url = stringUrl;
        this.onmessage = () => { };
    }
    postMessage(msg) {
        this.onmessage({ data: msg });
    }
    terminate() { }
};

// tests/integration/setupTests.js
require('fake-indexeddb/auto');
require('core-js/actual/structured-clone');
const { TextEncoder, TextDecoder } = require('util');

global.TextDecoder = TextDecoder;
global.TextEncoder = TextEncoder;

// NOT WORKING
// For now, you can modify your integration tests to use a mock worker implementation instead of relying on the custom Jest environment. This way, you can continue being productive and write your tests without being blocked by the environment setup.



const JSDOMEnvironment = require('jest-environment-jsdom');
console.log('JSDOMEnvironment:', JSDOMEnvironment);

class JSDOMEnvironmentWithWorkers extends JSDOMEnvironment {
  constructor(config, context) {
    super(config, context);
    console.log('Custom JSDOMEnvironment initialized');
  }

  async setup() {
    console.log('Setting up custom JSDOM environment with workers...');
    await super.setup();
  }

  async teardown() {
    console.log('Tearing down custom JSDOM environment with workers...');
    await super.teardown();
  }

  runScript(script) {
    console.log('Running script in custom JSDOM environment with workers...');
    return super.runScript(script);
  }
}

module.exports = JSDOMEnvironmentWithWorkers;


// const JSDOMEnvironment = require('jest-environment-jsdom');
// console.log('JSDOMEnvironment:', JSDOMEnvironment); // Should be a function (class)

// const EventEmitter = require('events');

// class WorkerThreadPolyfill {
//   constructor(stringUrl) {
//     this.url = stringUrl;
//     this.onmessage = null;
//     this.onerror = null;
//     this.eventEmitter = new EventEmitter();

//     // Simulate worker thread initialization
//     setTimeout(() => {
//       this.eventEmitter.emit('message', { data: `Worker thread ${stringUrl} initialized` });
//     }, 0);
//   }

//   postMessage(msg) {
//     // Simulate worker thread message processing
//     setTimeout(() => {
//       if (typeof this.onmessage === 'function') {
//         this.onmessage({ data: `Worker received message: ${JSON.stringify(msg)}` });
//       }
//     }, 0);
//   }

//   terminate() {
//     // Simulate worker thread termination
//     setTimeout(() => {
//       this.eventEmitter.emit('exit');
//     }, 0);
//   }

//   addEventListener(event, callback) {
//     if (event === 'message') {
//       this.onmessage = callback;
//     } else if (event === 'error') {
//       this.onerror = callback;
//     }
//   }

//   removeEventListener(event, callback) {
//     if (event === 'message' && this.onmessage === callback) {
//       this.onmessage = null;
//     } else if (event === 'error' && this.onerror === callback) {
//       this.onerror = null;
//     }
//   }

//   dispatchEvent(event) {
//     if (event.type === 'message' && typeof this.onmessage === 'function') {
//       this.onmessage(event);
//     } else if (event.type === 'error' && typeof this.onerror === 'function') {
//       this.onerror(event);
//     }
//   }
// }

// // Custom Jest environment with enhanced Web Worker polyfill
// class JSDOMEnvironmentWithWorkers extends JSDOMEnvironment {
//   constructor(config, context) {
//     super(config, context);
//     this.global.Worker = require('worker_threads').Worker;
//   }

//   async setup() {
//     console.log('Setting up custom JSDOM environment with workers...');
//     await super.setup();
//   }

//   async teardown() {
//     console.log('Tearing down custom JSDOM environment with workers...');
//     await super.teardown();
//   }

//   runScript(script) {
//     console.log('Running script in custom JSDOM environment with workers...');
//     return super.runScript(script);
//   }
// }

// module.exports = JSDOMEnvironmentWithWorkers;
// tests/integration/workerIntegration.test.js
describe('Worker Integration', () => {
    let worker;
    let mockWorker;
  
    beforeEach(() => {
      // Create a mock worker
      mockWorker = {
        postMessage: jest.fn(),
        onmessage: null,
        onerror: null,
        terminate: jest.fn(),
      };
  
      // Override the global Worker with the mock
      global.Worker = jest.fn(() => mockWorker);
  
      // Initialize the worker
      worker = new Worker('../../src/worker.js');
    });
  
    afterEach(() => {
      // Clean up the worker and restore the original Worker
      worker.terminate();
      global.Worker = Worker;
    });
  
    test('should handle addItem action', (done) => {
      // Set up the onmessage handler
      worker.onmessage = (event) => {
        expect(event.data.action).toBe('message');
        expect(event.data.data).toBe('Item added successfully');
        done();
      };
  
      // Prepare the message to send to the worker
      const message = {
        action: 'addItem',
        data: {
          id: 1,
          type: 'insert',
          position: 0,
          clientId: 'client1',
          text: 'Hello',
          timestamp: new Date().toISOString(),
        },
      };
  
      // Send the message to the worker
      worker.postMessage(message);
    });
  
    test('should handle fetchData action', (done) => {
      // Set up the onmessage handler
      worker.onmessage = (event) => {
        expect(event.data.action).toBe('displayData');
        expect(event.data.data).toEqual([
          {
            id: 1,
            type: 'insert',
            position: 0,
            clientId: 'client1',
            text: 'Hello',
            timestamp: expect.any(String),
          },
        ]);
        done();
      };
  
      // Send the fetchData action to the worker
      worker.postMessage({ action: 'fetchData' });
    });
  
    test('should handle unknown action', (done) => {
      // Set up the onmessage handler
      worker.onmessage = (event) => {
        expect(event.data.action).toBe('error');
        expect(event.data.data).toBe('Unknown action');
        done();
      };
  
      // Send an unknown action to the worker
      worker.postMessage({ action: 'unknownAction' });
    });
  });
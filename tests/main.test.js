import { JSDOM } from 'jsdom';
import { openDB, addItem, fetchData, getItemsByClientId, viewDoc } from '../src/worker';

jest.mock('../src/worker', () => ({
    openDB: jest.fn(() => Promise.resolve()),
    addItem: jest.fn(() => Promise.resolve('Item added successfully')),
    fetchData: jest.fn(() => Promise.resolve([])),
    getItemsByClientId: jest.fn(() => Promise.resolve([])),
    viewDoc: jest.fn(() => Promise.resolve(''))
}));

describe('Main script interactions', () => {
    let dom;
    let document;

    beforeAll(() => {
        dom = new JSDOM(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>IndexedDB with Web Worker Demo</title>
      </head>
      <body>
          <div class="container">
              <header>
                  <h1>IndexedDB with Web Worker Demo</h1>
              </header>
              <main>
                  <section class="form-section">
                      <h2>Add New Item</h2>
                      <form id="addItemForm">
                          <div class="form-group">
                              <label for="clientId">Client ID:</label>
                              <input type="text" id="clientId" name="clientId" required>
                          </div>
                          <div class="form-group">
                              <label for="type">Change Type:</label>
                              <select id="type" name="type" required>
                                  <option value="insert">Insert</option>
                                  <option value="delete">Delete</option>
                              </select>
                          </div>
                          <div class="form-group">
                              <label for="position">Position:</label>
                              <input type="number" id="position" name="position" required>
                          </div>
                          <div class="form-group">
                              <label for="text">Text (only for insert):</label>
                              <input type="text" id="text" name="text">
                          </div>
                          <div class="form-group">
                              <label for="length">Length (only for delete):</label>
                              <input type="number" id="length" name="length">
                          </div>
                          <button type="submit">Add New Item</button>
                      </form>
                  </section>
                  <section class="fetch-section">
                      <h2>Fetch Data</h2>
                      <button id="fetchDataButton">Fetch Data</button>
                      <div id="dataDisplay"></div>
                  </section>
                  <section class="get-item-section">
                      <h2>Get Item by Client ID</h2>
                      <div class="form-group">
                          <label for="clientIdInput">Client ID:</label>
                          <input type="text" id="clientIdInput" name="clientIdInput" required>
                      </div>
                      <button id="getItemButton">Get Item</button>
                      <div id="message"></div>
                  </section>
                  <section class="current-doc-section">
                      <h2>Current Document</h2>
                      <button id="viewDocButton">View Current Document</button>
                      <div id="docDisplay"></div>
                  </section>
              </main>
          </div>
      </body>
      </html>
    `, { runScripts: 'dangerously', resources: 'usable' });
        document = dom.window.document;
        // Require main.js after setting up the DOM
        // This step is crucial for testing purposes because main.js likely contains the application logic you want to test. By requiring it after setting up the JSDOM, you ensure that any initialization or event listeners defined in main.js are applied to the simulated DOM.


        require('../src/main');
    });

    it('should add an item when form is submitted', async () => {
        const addItemForm = document.getElementById('addItemForm');
        const clientId = document.getElementById('clientId');
        const type = document.getElementById('type');
        const position = document.getElementById('position');
        const text = document.getElementById('text');
        const length = document.getElementById('length');

        clientId.value = 'client1';
        type.value = 'insert';
        position.value = 0;
        text.value = 'Hello, world!';
        length.value = 0;

        addItemForm.dispatchEvent(new dom.window.Event('submit'));

        const changeDto = {
            id: expect.any(Number),
            type: 'insert',
            position: 0,
            vectorClock: {},
            clientId: 'client1',
            text: 'Hello, world!',
            timestamp: expect.any(String)
        };

        await new Promise(resolve => setTimeout(resolve, 1000));
        expect(addItem).toHaveBeenCalledWith(changeDto);
    });

    it('should fetch data when fetch data button is clicked', async () => {
        const fetchDataButton = document.getElementById('fetchDataButton');
        fetchDataButton.click();

        await new Promise(resolve => setTimeout(resolve, 1000));
        expect(fetchData).toHaveBeenCalled();
    });

    it('should get item by client ID when get item button is clicked', async () => {
        const clientIdInput = document.getElementById('clientIdInput');
        const getItemButton = document.getElementById('getItemButton');

        clientIdInput.value = 'client1';
        getItemButton.click();

        await new Promise(resolve => setTimeout(resolve, 1000));
        expect(getItemsByClientId).toHaveBeenCalledWith('client1');
    });

    it('should view the current document when view doc button is clicked', async () => {
        const viewDocButton = document.getElementById('viewDocButton');
        viewDocButton.click();

        await new Promise(resolve => setTimeout(resolve, 1000));
        expect(viewDoc).toHaveBeenCalled();
    });
});

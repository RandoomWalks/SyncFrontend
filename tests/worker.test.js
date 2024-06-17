import { openDB, addItem, fetchData, getItemsByClientId, viewDoc } from '../src/worker';

describe('IndexedDB operations', () => {
    beforeAll(async () => {
        await openDB();
    });

    it('should add an item to the database', async () => {
        const item = {
            id: 1,
            type: 'insert',
            position: 0,
            vectorClock: {},
            clientId: 'client1',
            text: 'Hello, world!',
            timestamp: new Date().toISOString()
        };
        await expect(addItem(item)).resolves.toBe('Item added successfully');
    });

    it('should fetch all data from the database', async () => {
        const data = await fetchData();
        expect(data.length).toBeGreaterThan(0);
    });

    it('should get items by client ID', async () => {
        const clientId = 'client1';
        const items = await getItemsByClientId(clientId);
        expect(items.length).toBeGreaterThan(0);
    });

    it('should view the current document', async () => {
        const document = await viewDoc();
        expect(document).toBeDefined();
    });
});
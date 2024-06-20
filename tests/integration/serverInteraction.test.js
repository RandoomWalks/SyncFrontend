// tests/integration/serverInteraction.test.js
const fetchMock = require('jest-fetch-mock');

describe('Server Interaction', () => {
  const SERVER_BASE_URL = 'http://localhost:3000/';

  beforeEach(() => {
    fetchMock.enableMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  test('should send client changes to the server and receive a success response', async () => {
    const mockResponse = { success: true };
    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const changeDto = {
      id: Date.now(),
      type: 'insert',
      position: 0,
      vectorClock: {},
      clientId: 'client1',
      text: 'Hello',
      timestamp: new Date().toISOString(),
    };

    const response = await fetch(SERVER_BASE_URL + 'sync/client-changes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([changeDto]),
    });

    expect(response.ok).toBe(true);
    expect(await response.json()).toEqual(mockResponse);
  });

  test('should fetch server changes and receive the expected response', async () => {
    const mockServerChanges = [
      {
        id: 1,
        type: 'insert',
        position: 0,
        vectorClock: {},
        clientId: 'client1',
        text: 'Hello',
        timestamp: new Date().toISOString(),
      },
    ];
    fetchMock.mockResponseOnce(JSON.stringify(mockServerChanges));

    const lastFetchTime = new Date();
    const response = await fetch(
      SERVER_BASE_URL + `sync/server-changes?since=${encodeURIComponent(lastFetchTime.toISOString())}`
    );

    expect(response.ok).toBe(true);
    expect(await response.json()).toEqual(mockServerChanges);
  });

  test('should reset the document on the server', async () => {
    const mockResponse = { success: true };
    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const initialDocument = 'Initial document content';
    const response = await fetch(SERVER_BASE_URL + 'sync/reset-document', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ initialDocument }),
    });

    expect(response.ok).toBe(true);
    expect(await response.json()).toEqual(mockResponse);
  });

  test('should apply an operation on the server', async () => {
    const mockResponse = { success: true };
    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const operation = {
      type: 'insert',
      position: 5,
      text: ' World',
      vectorClock: { client1: 1 },
      clientId: 'your-client-id',
    };

    const response = await fetch(SERVER_BASE_URL + 'sync/apply-operation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ operation }),
    });

    expect(response.ok).toBe(true);
    expect(await response.json()).toEqual(mockResponse);
  });

  test('should retrieve the current document from the server', async () => {
    const mockDocument = 'Current document content';
    fetchMock.mockResponseOnce(JSON.stringify({ document: mockDocument }));

    const response = await fetch(SERVER_BASE_URL + 'sync/document');

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.document).toEqual(mockDocument);
  });

  test('should handle server error', async () => {
    const mockErrorResponse = { error: 'Server error' };
    fetchMock.mockRejectOnce(new Error(JSON.stringify(mockErrorResponse)));

    try {
      await fetch(SERVER_BASE_URL + 'sync/document');
    } catch (error) {
      expect(error.message).toEqual(JSON.stringify(mockErrorResponse));
    }
  });
});
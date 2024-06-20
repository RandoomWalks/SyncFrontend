/// <reference types="cypress" />

describe('Frontend CRDT/CRUD Operations', () => {
    const SERVER_BASE_URL = 'http://localhost:3000/';
    const clientId = 'test-client';
    const addItem = (item) => {
      return fetch(SERVER_BASE_URL + 'sync/client-changes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([item]),
      });
    };
  
    before(() => {
      // Visit the application before running tests
      cy.visit('/index.html'); // Adjust the path to your index.html

    //   cy.visit('/');
    });
  
    it('should add a new item and display it', () => {
      const changeDto = {
        id: Date.now(),
        type: 'insert',
        position: 0,
        vectorClock: {},
        clientId,
        text: 'Hello, Cypress!',
        timestamp: new Date().toISOString(),
      };
  
      cy.get('#clientId').type(clientId);
      cy.get('#type').select('insert');
      cy.get('#position').type('0');
      cy.get('#text').type('Hello, Cypress!');
      cy.get('#addItemForm').submit();
  
      cy.get('#message').should('contain', 'Client change submitted successfully');
      cy.get('#fetchDataButton').click();
      cy.get('#dataDisplay').should('contain', 'Hello, Cypress!');
    });
  
    it('should fetch all data and display it', () => {
      cy.get('#fetchDataButton').click();
      cy.get('#dataDisplay').should('be.visible');
    });
  
    it('should get an item by Client ID and display it', () => {
      cy.get('#clientIdInput').type(clientId);
      cy.get('#getItemButton').click();
      cy.get('#message').should('contain', 'Hello, Cypress!');
    });
  
    it('should view the current document correctly', () => {
      cy.get('#viewDocButton').click();
      cy.get('#docDisplay').should('contain', 'Hello, Cypress!');
    });
  
    it('should reset the document and verify it is empty', () => {
      cy.get('#resetDocumentButton').click();
      cy.window().then((win) => {
        cy.stub(win, 'prompt').returns('Initial document content');
      });
      cy.get('#resetDocumentButton').click();
      cy.get('#docDisplay').should('contain', 'Initial document content');
    });
  
    it('should apply an operation and verify the document content', () => {
      const operation = {
        type: 'insert',
        position: 5,
        text: ' World',
        vectorClock: { client1: 1 },
        clientId,
      };
  
      cy.get('#applyOperationButton').click();
      addItem(operation);
  
      cy.get('#viewDocButton').click();
      cy.get('#docDisplay').should('contain', 'Hello World');
    });
  
    it('should get the current document', () => {
      cy.get('#getDocumentButton').click();
      cy.get('#docDisplay').should('contain', 'Hello World');
    });
  });
  
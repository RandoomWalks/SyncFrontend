/// <reference types="cypress" />

describe('IndexedDB with Web Worker Demo', () => {
    beforeEach(() => {
      cy.visit('/index.html'); // Adjust the path to your index.html
    });
  
    it('should add a new item and display it', () => {
        
      cy.get('#clientId').type('client1');
      cy.get('#type').select('insert');
      cy.get('#position').type('0');
      cy.get('#text').type('Hello, Worker!');
      cy.get('#addItemForm').submit();
  
      cy.get('#message').should('contain', 'Item added successfully');


      cy.get('#fetchDataButton').click();
      cy.get('#dataDisplay').should('contain', 'Hello, Worker!');

    //   cy.pause();

    });
  
    it('should fetch all data and display it', () => {
      cy.get('#fetchDataButton').click();
      cy.get('#dataDisplay').should('be.visible');
    });
  
    it('should get an item by Client ID and display it', () => {
      cy.get('#clientIdInput').type('client1');
      cy.get('#getItemButton').click();
      cy.get('#message').should('contain', 'Hello, Worker!');
    });
  
    it('should view the current document correctly', () => {
      cy.get('#viewDocButton').click();
      cy.get('#docDisplay').should('contain', 'Hello, Worker!');
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
      cy.get('#applyOperationButton').click();
      cy.get('#viewDocButton').click();
      cy.get('#docDisplay').should('contain', 'Hello, Worker! World');
    });
  
    it('should get the current document', () => {
      cy.get('#getDocumentButton').click();
      cy.get('#docDisplay').should('contain', 'Hello, Worker! World');
    });
  });
  
describe('Add Item Form', () => {
    beforeEach(() => {
      cy.visit('/');
    });
  
    it('should allow adding a new item', () => {
      cy.get('select[name="type"]').select('insert');
      cy.get('input[name="position"]').type('1');
      cy.get('input[name="text"]').type('Hello');
      cy.get('button[type="submit"]').click();
  
      cy.get('#fetchDataButton').click();
      cy.get('#dataDisplay').should('contain', 'Hello');
    });
  
    it('should fetch item by client ID', () => {
      cy.get('input[name="clientIdInput"]').type('123');
      cy.get('#getItemButton').click();
      cy.get('#message').should('contain', 'No item found for client ID 123');
    });
  
    it('should view the current document', () => {
      cy.get('#viewDocButton').click();
      cy.get('#docDisplay').should('contain', 'Current document state');
    });
  });
  
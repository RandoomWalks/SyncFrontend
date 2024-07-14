describe('Collaborative Editing', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it('should allow a single user to make edits', () => {
    cy.get('#editor').type('Hello, World!');
    cy.get('#editor').should('have.value', 'Hello, World!');
  });

  it('should sync changes between two clients', () => {
    cy.window().then((win) => {
      const client1 = win.open('/', 'client1');
      const client2 = win.open('/', 'client2');

      cy.wrap(client1).within(() => {
        cy.get('#editor').type('Hello from client 1');
        cy.get('#syncButton').click();
      });

      cy.wrap(client2).within(() => {
        cy.get('#fetchChangesButton').click();
        cy.get('#editor', { timeout: 10000 }).should('have.value', 'Hello from client 1');
        cy.get('#editor').type(', and hello from client 2');
        cy.get('#syncButton').click();
      });

      cy.wrap(client1).within(() => {
        cy.get('#fetchChangesButton').click();
        cy.get('#editor', { timeout: 10000 }).should('have.value', 'Hello from client 1, and hello from client 2');
      });
    });
  });

  it('should handle concurrent edits', () => {
    cy.window().then((win) => {
      const client1 = win.open('/', 'client1');
      const client2 = win.open('/', 'client2');

      cy.wrap(client1).within(() => {
        cy.get('#editor').type('ABC');
        cy.get('#syncButton').click();
      });

      cy.wrap(client2).within(() => {
        cy.get('#editor').type('123');
        cy.get('#syncButton').click();
      });

      cy.wrap(client1).within(() => {
        cy.get('#fetchChangesButton').click();
        cy.get('#editor', { timeout: 10000 }).invoke('val').then((text1) => {
          cy.wrap(client2).within(() => {
            cy.get('#fetchChangesButton').click();
            cy.get('#editor', { timeout: 10000 }).should('have.value', text1);
          });
        });
      });
    });
  });

  it('should handle large documents', () => {
    const largeText = 'A'.repeat(10000);
    cy.get('#editor').type(largeText, { delay: 0 });
    cy.get('#editor').should('have.value', largeText);
    cy.get('#syncButton').click();
    cy.reload();
    cy.get('#fetchChangesButton').click();
    cy.get('#editor', { timeout: 20000 }).should('have.value', largeText);
  });

  it('should persist changes after page reload', () => {
    cy.get('#editor').type('Persistent text');
    cy.get('#syncButton').click();
    cy.reload();
    cy.get('#fetchChangesButton').click();
    cy.get('#editor', { timeout: 10000 }).should('have.value', 'Persistent text');
  });

  it('should handle delete operations', () => {
    cy.get('#editor').type('Hello, World!');
    cy.get('#syncButton').click();
    cy.get('#editor').type('{selectall}{backspace}');
    cy.get('#syncButton').click();
    cy.get('#editor').should('have.value', '');
  });

  it('should handle insert operations at different positions', () => {
    cy.get('#editor').type('AC');
    cy.get('#syncButton').click();
    cy.get('#editor').type('{leftArrow}B');
    cy.get('#syncButton').click();
    cy.get('#editor').should('have.value', 'ABC');
  });

  it('should handle rapid successive edits', () => {
    for (let i = 0; i < 10; i++) {
      cy.get('#editor').type(`Edit ${i}`);
      cy.get('#syncButton').click();
    }
    cy.get('#editor').invoke('val').should('include', 'Edit 9');
  });

  it('should handle network disconnection and reconnection', () => {
    cy.get('#editor').type('Initial text');
    cy.get('#syncButton').click();
    cy.intercept('POST', '/sync/client-changes', (req) => {
      req.reply({ forceNetworkError: true });
    }).as('syncAttempt');
    cy.get('#editor').type(' while offline');
    cy.get('#syncButton').click();
    cy.wait('@syncAttempt');
    cy.intercept('POST', '/sync/client-changes').as('syncSuccess');
    cy.get('#syncButton').click();
    cy.wait('@syncSuccess');
    cy.get('#editor').should('have.value', 'Initial text while offline');
  });

  it('should handle conflicting edits', () => {
    cy.window().then((win) => {
      const client1 = win.open('/', 'client1');
      const client2 = win.open('/', 'client2');

      cy.wrap(client1).within(() => {
        cy.get('#editor').type('Client 1 edit');
        cy.get('#syncButton').click();
      });

      cy.wrap(client2).within(() => {
        cy.get('#editor').type('Client 2 edit');
        cy.get('#syncButton').click();
      });

      cy.wrap(client1).within(() => {
        cy.get('#fetchChangesButton').click();
        cy.get('#editor', { timeout: 10000 }).invoke('val').then((text1) => {
          cy.wrap(client2).within(() => {
            cy.get('#fetchChangesButton').click();
            cy.get('#editor', { timeout: 10000 }).should('have.value', text1);
          });
        });
      });
    });
  });

  it('should handle undo/redo operations', () => {
    cy.get('#editor').type('Hello');
    cy.get('#syncButton').click();
    cy.get('#editor').type('{ctrl+z}');
    cy.get('#syncButton').click();
    cy.get('#editor').should('have.value', '');
    cy.get('#editor').type('{ctrl+y}');
    cy.get('#syncButton').click();
    cy.get('#editor').should('have.value', 'Hello');
  });

  it('should display correct debug information', () => {
    cy.get('#editor').type('Test debug');
    cy.get('#syncButton').click();
    cy.get('#showDebugInfo').click();
    cy.get('#debugInfo').should('be.visible');
    cy.get('#debugInfo').invoke('text').then((debugText) => {
      expect(debugText).to.include('clientId');
      expect(debugText).to.include('vectorClock');
      expect(debugText).to.include('pendingOperations');
    });
  });
});
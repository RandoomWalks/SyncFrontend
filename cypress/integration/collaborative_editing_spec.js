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

  // it.only('should sync changes between two clients', () => {
  //     // Show iframes for the test
  //     cy.get('#client1').invoke('removeClass', 'hidden').invoke('addClass', 'visible');
  //     cy.get('#client2').invoke('removeClass', 'hidden').invoke('addClass', 'visible');
  
  //     // Access client iframes
  //     cy.get('#client1').then(($iframe1) => {
  //       const client1 = $iframe1.contents().find('body');
  
  //       cy.wrap(client1).find('#text').type('Hello from client 1', { force: true });
  //       cy.wrap(client1).find('#addItemForm').submit();
  //     });
  
  //     // Wait for sync
  //     cy.wait(1000);
  
  //     cy.get('#client2').then(($iframe2) => {
  //       const client2 = $iframe2.contents().find('body');
  
  //       cy.wrap(client2).find('#fetchDataButton').click();
  //       cy.wrap(client2).find('#dataDisplay').should('contain', 'Hello from client 1');
  //       cy.wrap(client2).find('#text').type(', and hello from client 2', { force: true });
  //       cy.wrap(client2).find('#addItemForm').submit();
  //     });
  
  //     // Wait for sync
  //     cy.wait(1000);
  
  //     cy.get('#client1').then(($iframe1) => {
  //       const client1 = $iframe1.contents().find('body');
  
  //       cy.wrap(client1).find('#fetchDataButton').click();
  //       cy.wrap(client1).find('#dataDisplay').should('contain', 'Hello from client 1, and hello from client 2');
  //     });
  //   });

  it('should sync changes between two clients', () => {
    cy.window().then((win) => {
      const client1 = win.open('/', 'client1');
      const client2 = win.open('/', 'client2');

      cy.wrap(client1).within(() => {
        cy.get('#editor').type('Hello from client 1');
        cy.get('#syncButton').click();
        cy.wait(1000); // Ensure sync completes
      });

      cy.wrap(client2).within(() => {
        cy.get('#fetchChangesButton').click();
        cy.wait(1000); // Ensure fetch completes
        cy.get('#editor', { timeout: 10000 }).should('have.value', 'Hello from client 1');
        cy.get('#editor').type(', and hello from client 2');
        cy.get('#syncButton').click();
        cy.wait(1000); // Ensure sync completes
      });

      cy.wrap(client1).within(() => {
        cy.get('#fetchChangesButton').click();
        cy.wait(1000); // Ensure fetch completes
        cy.get('#editor', { timeout: 10000 }).should('have.value', 'Hello from client 1, and hello from client 2');
      });
    });
  });

  // it.only('should sync changes between two clients', () => {
  //   cy.window().then((win) => {
  //     const client1 = win.open('/', 'client1');
  //     const client2 = win.open('/', 'client2');

  //     cy.wrap(client1).within(() => {
  //       cy.get('#editor').type('Hello from client 1');
  //       cy.get('#syncButton').click();
  //     });

  //     cy.wrap(client2).within(() => {
  //       cy.get('#fetchChangesButton').click();
  //       cy.get('#editor', { timeout: 10000 }).should('have.value', 'Hello from client 1');
  //       cy.get('#editor').type(', and hello from client 2');
  //       cy.get('#syncButton').click();
  //     });

  //     cy.wrap(client1).within(() => {
  //       cy.get('#fetchChangesButton').click();
  //       cy.get('#editor', { timeout: 10000 }).should('have.value', 'Hello from client 1, and hello from client 2');
  //     });
  //   });
  // });

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

  // it('should handle large documents', () => {
  //   const largeText = 'A'.repeat(10000);
  //   cy.get('#editor').type(largeText, { delay: 0 });
  //   cy.get('#editor').should('have.value', largeText);
  //   cy.get('#syncButton').click();
  //   cy.reload();
  //   cy.get('#fetchChangesButton').click();
  //   cy.get('#editor', { timeout: 20000 }).should('have.value', largeText);
  // });

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

  it('should clear the database when requested', () => {
    cy.get('#editor').type('Content to be cleared');
    cy.get('#syncButton').click();
    cy.get('#clearDbButton').click();
    cy.get('#fetchChangesButton').click();
    cy.get('#editor', { timeout: 10000 }).should('have.value', '');
  });

  it('should reset the document with initial content', () => {
    cy.get('#editor').type('Old content');
    cy.get('#syncButton').click();
    cy.get('#initialContentInput').type('New initial content');
    cy.get('#resetDocumentButton').click();
    cy.get('#fetchChangesButton').click();
    cy.get('#editor', { timeout: 10000 }).should('have.value', 'New initial content');
  });

  it('should handle rapid database clear and reset operations', () => {
    for (let i = 0; i < 5; i++) {
      cy.get('#editor').type(`Content ${i}`);
      cy.get('#syncButton').click();
      cy.get('#clearDbButton').click();
      cy.get('#initialContentInput').type(`Initial ${i}`);
      cy.get('#resetDocumentButton').click();
      cy.get('#fetchChangesButton').click();
      cy.get('#editor', { timeout: 10000 }).should('have.value', `Initial ${i}`);
    }
  });

  it('should maintain consistency after clearing and resetting with concurrent edits', () => {
    cy.window().then((win) => {
      const client1 = win.open('/', 'client1');
      const client2 = win.open('/', 'client2');

      cy.wrap(client1).within(() => {
        cy.get('#clearDbButton').click();
        cy.get('#initialContentInput').type('Initial state');
        cy.get('#resetDocumentButton').click();
      });

      cy.wrap(client2).within(() => {
        cy.get('#fetchChangesButton').click();
        cy.get('#editor', { timeout: 10000 }).should('have.value', 'Initial state');
        cy.get('#editor').type(' - Client 2 edit');
        cy.get('#syncButton').click();
      });

      cy.wrap(client1).within(() => {
        cy.get('#fetchChangesButton').click();
        cy.get('#editor', { timeout: 10000 }).should('have.value', 'Initial state - Client 2 edit');
      });
    });
  });

});
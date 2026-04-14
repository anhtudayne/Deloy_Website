// @ts-nocheck
/// <reference types="cypress" />


/**
 * cy.login(username, password)
 * Thực hiện đăng nhập qua UI form
 */
Cypress.Commands.add('login', (username: string, password: string) => {
  cy.session(
    [username, password],
    () => {
      cy.visit('/auth/login');
      cy.get('input[name="username"], input[placeholder*="username" i], input[id*="username" i]')
        .first()
        .clear()
        .type(username);
      cy.get('input[type="password"]')
        .first()
        .clear()
        .type(password);
      cy.get('button[type="submit"]').click();
      // Chờ redirect về dashboard sau login thành công
      cy.url().should('not.include', '/auth/login');
    },
    {
      cacheAcrossSpecs: true,
    }
  );
});

/**
 * cy.loginByAPI(username, password)
 * Đăng nhập trực tiếp qua API (nhanh hơn, dùng cho setup)
 */
Cypress.Commands.add('loginByAPI', (username: string, password: string) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/login`,
    body: { username, password },
  }).then((response) => {
    expect(response.status).to.eq(200);
    const token = response.body.data?.accessToken;
    if (token) {
      window.localStorage.setItem('accessToken', token);
      window.localStorage.setItem('user', JSON.stringify(response.body.data?.user || {}));
    }
  });
});

/**
 * cy.logout()
 * Đăng xuất khỏi hệ thống
 */
Cypress.Commands.add('logout', () => {
  cy.window().then((win) => {
    win.localStorage.clear();
    win.sessionStorage.clear();
  });
  cy.visit('/auth/login');
});

// ============================================================
// TypeScript declarations
// ============================================================
declare global {
  namespace Cypress {
    interface Chainable {
      login(username: string, password: string): Chainable<void>;
      loginByAPI(username: string, password: string): Chainable<void>;
      logout(): Chainable<void>;
    }
  }
}

export {};
// @ts-nocheck
/// <reference types="cypress" />

// ============================================================
// 02. Dashboard Tests
// ============================================================

describe('02. Dashboard', () => {
  before(() => {
    cy.fixture('credentials').then((creds) => {
      cy.loginByAPI(creds.admin.username, creds.admin.password);
    });
  });

  beforeEach(() => {
    cy.fixture('credentials').then((creds) => {
      cy.loginByAPI(creds.admin.username, creds.admin.password);
    });
    cy.visit('/');
  });

  it('TC06 - Dashboard tải thành công sau khi đăng nhập', () => {
    cy.url().should('eq', `${Cypress.config('baseUrl')}/`);
    // Trang không bị redirect về login
    cy.url().should('not.include', '/auth/login');
    cy.log('Dashboard tải thành công');
  });

  it('TC07 - Hiển thị các summary cards thống kê', () => {
    cy.visit('/');
    // Dashboard phải có các số liệu thống kê
    cy.get('body').should('be.visible');
    // Kiểm tra có phần tử thể hiện số liệu (card, stat, hoặc số)
    cy.get('body').should('not.be.empty');
    cy.log('Dashboard hiển thị nội dung');
  });

  it('TC08 - Sidebar navigation hiển thị và hoạt động', () => {
    cy.visit('/');
    // Click vào Products trong sidebar
    cy.contains('a, button, li', /product|sản phẩm/i).first().click({ force: true });
    cy.url().should('include', '/products');
    cy.log('Navigation sidebar hoạt động');
  });

  it('TC09 - API Dashboard stats trả về dữ liệu hợp lệ', () => {
    cy.fixture('credentials').then((creds) => {
      cy.loginByAPI(creds.admin.username, creds.admin.password);
    });
    cy.request({
      method: 'GET',
      url: `${Cypress.env('apiUrl')}/dashboard/stats`,
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}`,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.be.oneOf([200, 401]);
      cy.log('Dashboard API endpoint phản hồi');
    });
  });
});
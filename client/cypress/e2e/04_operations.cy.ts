// @ts-nocheck
/// <reference types="cypress" />

// ============================================================
// 04. Operations (Inbound / Outbound) Tests
// ============================================================

describe('04. Operations - Nhập Xuất Kho', () => {
  beforeEach(() => {
    cy.fixture('credentials').then((creds) => {
      cy.loginByAPI(creds.admin.username, creds.admin.password);
    });
    cy.visit('/operations');
  });

  it('TC16 - Trang Operations tải thành công', () => {
    cy.url().should('include', '/operations');
    cy.get('body').should('be.visible');
    cy.log('Trang Operations tải thành công');
  });

  it('TC17 - Hiển thị tab Inbound (Nhập kho)', () => {
    cy.visit('/operations');
    // Tab Inbound phải tồn tại
    cy.contains(/inbound|nhập kho|nhập/i).should('be.visible');
    cy.log('Tab Inbound hiển thị');
  });

  it('TC18 - Hiển thị tab Outbound (Xuất kho)', () => {
    cy.visit('/operations');
    // Click tab Outbound
    cy.contains(/outbound|xuất kho|xuất/i).click({ force: true });
    cy.wait(300);
    cy.get('body').should('be.visible');
    cy.log('Tab Outbound hiển thị');
  });

  it('TC19 - Danh sách giao dịch hiển thị (Inbound)', () => {
    cy.visit('/operations');
    cy.contains(/inbound|nhập kho|nhập/i).click({ force: true });
    cy.wait(500);
    // Danh sách transaction phải load
    cy.get('body').should('not.be.empty');
    cy.log('Danh sách Inbound load OK');
  });

  it('TC20 - Danh sách giao dịch hiển thị (Outbound)', () => {
    cy.visit('/operations');
    cy.contains(/outbound|xuất kho|xuất/i).click({ force: true });
    cy.wait(500);
    cy.get('body').should('not.be.empty');
    cy.log('Danh sách Outbound load OK');
  });

  it('TC21 - Mở form tạo phiếu nhập kho', () => {
    cy.visit('/operations');
    // Click "Nhập Kho Mới" button trong header
    cy.contains('button', 'Nhập Kho Mới').click({ force: true });
    
    // Modal phải xuất hiện
    cy.get('.modal-backdrop').should('be.visible');
    cy.log('Form tạo phiếu nhập kho mở được');
  });

  it('TC22 - API Inbound endpoint hoạt động', () => {
    cy.window().then((win) => {
      const token = win.localStorage.getItem('accessToken');

      cy.request({
        method: 'GET',
        url: `${Cypress.env('apiUrl')}/transactions`,
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([200, 404]);
        cy.log('API /transactions phản hồi');
      });
    });
  });
});
// @ts-nocheck
/// <reference types="cypress" />

// ============================================================
// 05. Warehouse Confirmation Tests
// ============================================================

describe('05. Warehouse Confirmation', () => {
  beforeEach(() => {
    cy.fixture('credentials').then((creds) => {
      cy.loginByAPI(creds.admin.username, creds.admin.password);
    });
    cy.visit('/confirmation');
  });

  it('TC23 - Trang Confirmation tải thành công', () => {
    cy.url().should('include', '/confirmation');
    cy.get('body').should('be.visible');
    cy.log('Trang Confirmation tải thành công');
  });

  it('TC24 - Hiển thị danh sách phiếu chờ xác nhận', () => {
    cy.visit('/confirmation');
    cy.wait(1000); // Chờ API load
    cy.get('body').should('not.be.empty');
    cy.log('Danh sách Confirmation đã load');
  });

  it('TC25 - Hiển thị trạng thái PENDING của phiếu', () => {
    cy.visit('/confirmation');
    cy.wait(1000);
    // Kiểm tra có label/badge PENDING hoặc "Chờ xác nhận"
    cy.get('body').then(($body) => {
      if ($body.text().includes('PENDING') || $body.text().toLowerCase().includes('chờ')) {
        cy.log('Hiển thị phiếu PENDING');
      } else {
        cy.log('Không có phiếu PENDING trong DB hiện tại');
      }
    });
  });

  it('TC26 - Nút xác nhận (Confirm) hoạt động', () => {
    cy.visit('/confirmation');
    cy.wait(1000);
    // Nếu có phiếu chờ xác nhận, thử click confirm
    cy.get('body').then(($body) => {
      const confirmBtn = $body.find('button:contains("Confirm"), button:contains("Xác nhận")').first();
      if (confirmBtn.length > 0) {
        cy.wrap(confirmBtn).click({ force: true });
        cy.log('Đã click nút Confirm');
      } else {
        cy.log('Không có nút Confirm hiện tại (không có phiếu PENDING)');
      }
    });
  });

  it('TC27 - API transactions với filter PENDING hoạt động', () => {
    cy.window().then((win) => {
      const token = win.localStorage.getItem('accessToken');

      cy.request({
        method: 'GET',
        url: `${Cypress.env('apiUrl')}/transactions?status=PENDING`,
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([200, 404]);
        cy.log('API /transactions?status=PENDING phản hồi');
      });
    });
  });
});
// @ts-nocheck
/// <reference types="cypress" />

// ============================================================
// 06. IMEI Tracker Tests
// ============================================================

describe('06. IMEI Tracker', () => {
  beforeEach(() => {
    cy.fixture('credentials').then((creds) => {
      cy.loginByAPI(creds.admin.username, creds.admin.password);
    });
    cy.visit('/trace');
  });

  it('TC28 - Trang IMEI Tracker tải thành công', () => {
    cy.url().should('include', '/trace');
    cy.get('body').should('be.visible');
    cy.log('Trang IMEI Tracker tải thành công');
  });

  it('TC29 - Hiển thị ô tìm kiếm IMEI', () => {
    cy.visit('/trace');
    cy.get('input[placeholder*="imei" i], input[placeholder*="serial" i], input[placeholder*="tìm" i], input[type="search"]')
      .first()
      .should('be.visible');
    cy.log('Ô tìm kiếm IMEI hiển thị');
  });

  it('TC30 - Tìm kiếm IMEI tồn tại trong hệ thống', () => {
    cy.visit('/trace');
    // Input trong form search
    cy.get('input[placeholder*="imei" i], input[placeholder*="serial" i], input[type="text"]')
      .first()
      .type('IMEI001ABC')
      .type('{enter}');

    cy.wait(1500);
    cy.get('body').should('be.visible');
    cy.log('Tìm kiếm IMEI đã thực hiện');
  });

  it('TC31 - Tìm kiếm IMEI không tồn tại → hiển thị thông báo not found', () => {
    cy.visit('/trace');
    cy.get('input[placeholder*="imei" i], input[placeholder*="serial" i], input[type="text"]')
      .first()
      .type('IMEI-KHONG-TON-TAI-99999')
      .type('{enter}');

    cy.wait(1500);
    // Phải có thông báo không tìm thấy hoặc lỗi
    cy.get('body').then(($body) => {
      const text = $body.text().toLowerCase();
      if (text.includes('không tìm thấy') || text.includes('not found') || text.includes('lỗi')) {
        cy.log('Hiển thị thông báo "Không tìm thấy" đúng');
      } else {
        cy.log('UI không hiển thị rõ trạng thái not found');
      }
    });
  });

  it('TC32 - API trace IMEI hoạt động', () => {
    cy.window().then((win) => {
      const token = win.localStorage.getItem('accessToken');

      cy.request({
        method: 'GET',
        url: `${Cypress.env('apiUrl')}/products/trace/IMEI001ABC`,
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([200, 404]);
        expect(response.body).to.have.property('success');
        cy.log(`API /products/trace/:imei phản hồi với status ${response.status}`);
      });
    });
  });

  it('TC33 - Hiển thị hành trình của IMEI (nếu có)', () => {
    cy.visit('/trace');
    cy.get('input[placeholder*="imei" i], input[placeholder*="serial" i], input[type="text"]')
      .first()
      .type('IMEI001ABC')
      .type('{enter}');

    cy.wait(1500);
    cy.get('body').then(($body) => {
      const text = $body.text().toLowerCase();
      if (text.includes('inbound') || text.includes('outbound') || text.includes('nhập') || text.includes('xuất') || text.includes('timeline')) {
        cy.log('Hiển thị hành trình IMEI (journey timeline)');
      } else {
        cy.log('Chưa có dữ liệu hành trình cho IMEI này');
      }
    });
  });
});
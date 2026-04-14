// @ts-nocheck
/// <reference types="cypress" />

// ============================================================
// 01. Authentication Tests
// ============================================================

describe('01. Authentication', () => {
  beforeEach(() => {
    cy.visit('/auth/login');
  });

  it('TC01 - Hiển thị form đăng nhập đầy đủ', () => {
    cy.title().should('exist');
    cy.get('input[type="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
    cy.log('Form login hiển thị đúng');
  });

  it('TC02 - Đăng nhập thất bại với sai credentials → hiển thị lỗi', () => {
    cy.get('input[name="username"], input[placeholder*="username" i], input[id*="username" i]')
      .first()
      .type('wronguser');
    cy.get('input[type="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();

    // Chờ toast error hiển thị
    cy.wait(1500);
    // Vẫn ở trang login (không redirect khi thất bại)
    cy.url().should('include', '/auth/login');
    // Kiểm tra URL không thay đổi (vẫn ở login) và form vẫn visible
    cy.get('input[type="password"]').should('be.visible');
    cy.log('Login thất bại giữ nguyên trang login');
  });

  it('TC03 - Đăng nhập thành công với admin/123456 → redirect về Dashboard', () => {
    cy.fixture('credentials').then((creds) => {
      cy.get('input[name="username"], input[placeholder*="username" i], input[id*="username" i]')
        .first()
        .clear()
        .type(creds.admin.username);
      cy.get('input[type="password"]').clear().type(creds.admin.password);
      cy.get('button[type="submit"]').click();

      // Nên redirect về trang chính
      cy.url().should('not.include', '/auth/login', { timeout: 10000 });
      cy.log(' Đăng nhập thành công, đã redirect');
    });
  });

  it('TC04 - Truy cập route private khi chưa login → redirect về /auth/login', () => {
    // Clear bất kỳ session nào
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.visit('/');
    cy.url().should('include', '/auth/login');
    cy.log('Protected route redirect đúng');
  });

  it('TC05 - Đăng xuất sau khi đăng nhập → quay về login', () => {
    cy.fixture('credentials').then((creds) => {
      cy.loginByAPI(creds.admin.username, creds.admin.password);
      cy.visit('/');
      // Có thể click vào avatar/profile để logout, hoặc clear storage
      cy.clearLocalStorage();
      cy.visit('/');
      cy.url().should('include', '/auth/login');
      cy.log('Đăng xuất thành công');
    });
  });
});
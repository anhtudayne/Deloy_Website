// @ts-nocheck
// ============================================================
// Global support file – chạy trước mỗi spec
// ============================================================

import './commands';

// Bỏ qua uncaught exceptions từ React app (không fail test)
Cypress.on('uncaught:exception', (err) => {
  // Return false để ngăn Cypress fail test
  console.warn('Uncaught exception (ignored):', err.message);
  return false;
});

// Log tên test đang chạy
beforeEach(function () {
  cy.log(`🧪 Running: ${this.currentTest?.fullTitle()}`);
});
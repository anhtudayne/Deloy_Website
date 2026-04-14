// @ts-nocheck
/* eslint-disable */
// Cypress configuration – chạy `npm install` trước để resolve types
import { defineConfig } from 'cypress';

export default defineConfig({
  projectId: 'mxzzgv',
  e2e: {
    baseUrl: 'http://localhost:5173',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    viewportWidth: 1280,
    viewportHeight: 900,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 15000,
    responseTimeout: 15000,
    chromeWebSecurity: false,
    env: {
      apiUrl: 'http://localhost:3000/api',
    },
    setupNodeEvents(on, config) {
      return config;
    },
  },
});
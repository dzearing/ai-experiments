import '@testing-library/jest-dom';

// Mock window.history methods
const originalPushState = window.history.pushState;
const originalReplaceState = window.history.replaceState;

beforeEach(() => {
  // Reset URL to root before each test
  window.history.pushState({}, '', '/');
});

afterEach(() => {
  // Restore original methods
  window.history.pushState = originalPushState;
  window.history.replaceState = originalReplaceState;
});

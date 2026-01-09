# Testing Guide - Phase 4

This guide explains how to run tests for the RCA Agent webview application.

## Setup

### Install Dependencies

```bash
cd vscode-extension/webview
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/jest jest-environment-jsdom jest ts-jest identity-obj-proxy
```

### Test Scripts

```bash
# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run accessibility-specific tests
npm run test:a11y
```

## Test Structure

```
src/
├── __tests__/
│   ├── components/       # Component tests
│   │   └── EmptyState.test.tsx
│   ├── lib/              # Utility function tests
│   │   └── accessibility.test.ts
│   └── views/            # View component tests (to be added)
├── __mocks__/            # Mock files
│   └── fileMock.js
└── setupTests.ts         # Global test configuration
```

## Writing Tests

### Component Tests

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();
    
    render(<MyComponent onClick={handleClick} />);
    
    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

### Accessibility Tests

```typescript
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';

it('has no accessibility violations', async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Keyboard Navigation Tests

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

it('supports keyboard navigation', async () => {
  const user = userEvent.setup();
  render(<MyList items={items} />);
  
  const firstItem = screen.getAllByRole('button')[0];
  firstItem.focus();
  
  await user.keyboard('{ArrowDown}');
  
  expect(screen.getAllByRole('button')[1]).toHaveFocus();
});
```

## Coverage Goals

- **Overall**: 70% minimum (configured in jest.config.js)
- **Critical Components**: 80%+ coverage
- **Utility Functions**: 90%+ coverage

## Running Specific Tests

```bash
# Run tests for a specific file
npm test EmptyState.test.tsx

# Run tests matching a pattern
npm test -- --testNamePattern="accessibility"

# Run tests for changed files only
npm test -- --onlyChanged
```

## Debugging Tests

```bash
# Run tests with debugging enabled
node --inspect-brk node_modules/.bin/jest --runInBand

# Then open chrome://inspect in Chrome
```

## Common Issues

### VS Code API Mock

The VS Code API is automatically mocked in setupTests.ts:

```typescript
global.acquireVsCodeApi = () => ({
  postMessage: jest.fn(),
  setState: jest.fn(),
  getState: jest.fn(),
});
```

### CSS/Asset Imports

CSS and asset imports are mocked using identity-obj-proxy and fileMock.js.

### Async Components

Use `findBy*` queries for async content:

```typescript
const element = await screen.findByText('Async Content');
```

## CI/CD Integration

Tests should be run in CI pipeline before deployment:

```yaml
# .github/workflows/test.yml
- name: Run Tests
  run: |
    cd vscode-extension/webview
    npm test -- --coverage
```

## Next Steps

1. Add tests for all view components (Dashboard, ErrorQueue, etc.)
2. Add tests for custom hooks (useDashboardData, useErrorQueue, etc.)
3. Add integration tests for multi-component workflows
4. Set up automated accessibility testing with jest-axe
5. Configure code coverage reporting in CI

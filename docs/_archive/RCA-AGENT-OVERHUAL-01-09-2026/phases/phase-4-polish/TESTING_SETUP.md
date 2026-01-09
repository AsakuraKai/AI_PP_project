# Phase 4 - Testing Setup & Strategy

**Created:** January 9, 2026  
**Phase:** Polish & Launch (Week 4)  
**Target:** >80% code coverage, WCAG 2.1 AA compliance

---

## Testing Infrastructure

### Framework Stack

**Unit & Integration Tests:**
- **Jest** 29.5.0 (already installed in root)
- **React Testing Library** (to be installed)
- **@testing-library/jest-dom** (to be installed)
- **@testing-library/user-event** (to be installed)

**E2E Tests:**
- **Playwright** or **VS Code Extension Testing**
- Focus on critical workflows

**Accessibility Tests:**
- **axe-core** / **jest-axe** for automated a11y testing
- Manual testing with NVDA/JAWS screen readers
- Keyboard-only navigation testing

---

## Installation Steps

```bash
cd vscode-extension/webview

# Install testing dependencies
npm install --save-dev \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  @types/jest \
  jest-environment-jsdom \
  jest-axe

# Optional: Playwright for E2E
npm install --save-dev @playwright/test
```

---

## Jest Configuration

### Create `jest.config.js` in webview/

```javascript
/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.{ts,tsx}',
    '**/*.{spec,test}.{ts,tsx}'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx'
      }
    }]
  }
};
```

### Create `src/setupTests.ts`

```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from '@jest/globals';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock VS Code API
global.acquireVsCodeApi = () => ({
  postMessage: jest.fn(),
  setState: jest.fn(),
  getState: jest.fn()
});

// Mock window.matchMedia for reduced motion
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
```

### Update `package.json` scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:a11y": "jest --testMatch='**/*.a11y.test.tsx'"
  }
}
```

---

## Test Structure

```
vscode-extension/webview/
├── src/
│   ├── __tests__/
│   │   ├── components/
│   │   │   ├── Sidebar.test.tsx
│   │   │   ├── StatsCard.test.tsx
│   │   │   ├── EmptyState.test.tsx
│   │   │   └── ui/
│   │   │       ├── button.test.tsx
│   │   │       └── skeleton.test.tsx
│   │   ├── views/
│   │   │   ├── Dashboard.test.tsx
│   │   │   ├── Dashboard.a11y.test.tsx
│   │   │   ├── ErrorQueue.test.tsx
│   │   │   ├── Analyze.test.tsx
│   │   │   ├── History.test.tsx
│   │   │   ├── AgentState.test.tsx
│   │   │   ├── FixManager.test.tsx
│   │   │   └── Metrics.test.tsx
│   │   ├── hooks/
│   │   │   ├── useDashboardData.test.ts
│   │   │   ├── useErrorQueue.test.ts
│   │   │   └── useVSCode.test.ts
│   │   └── lib/
│   │       ├── accessibility.test.tsx
│   │       └── utils.test.ts
│   └── setupTests.ts
```

---

## Testing Patterns

### 1. Component Rendering Tests

```typescript
// Dashboard.test.tsx
import { render, screen } from '@testing-library/react';
import { Dashboard } from '@/views/Dashboard';

describe('Dashboard', () => {
  it('renders without crashing', () => {
    render(<Dashboard />);
    expect(screen.getByText('RCA Agent Dashboard')).toBeInTheDocument();
  });

  it('shows loading skeletons during initial load', () => {
    render(<Dashboard />);
    expect(screen.getAllByRole('status')).toHaveLength(4); // 4 stat cards
  });

  it('displays stats after loading', async () => {
    render(<Dashboard />);
    
    // Wait for data to load
    const pendingErrors = await screen.findByText(/Pending Errors/);
    expect(pendingErrors).toBeInTheDocument();
  });
});
```

### 2. User Interaction Tests

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorQueue } from '@/views/ErrorQueue';

describe('ErrorQueue', () => {
  it('allows selecting errors via checkbox', async () => {
    const user = userEvent.setup();
    render(<ErrorQueue />);
    
    const checkbox = screen.getByRole('checkbox', { name: /select error/ });
    await user.click(checkbox);
    
    expect(checkbox).toBeChecked();
  });

  it('filters errors by status', async () => {
    const user = userEvent.setup();
    render(<ErrorQueue />);
    
    const statusFilter = screen.getByRole('combobox', { name: /status/ });
    await user.selectOptions(statusFilter, 'pending');
    
    expect(screen.queryByText(/completed/i)).not.toBeInTheDocument();
  });
});
```

### 3. Keyboard Navigation Tests

```typescript
describe('ErrorQueue Keyboard Navigation', () => {
  it('navigates rows with arrow keys', async () => {
    const user = userEvent.setup();
    render(<ErrorQueue />);
    
    const firstRow = screen.getAllByRole('row')[1]; // Skip header
    firstRow.focus();
    
    await user.keyboard('{ArrowDown}');
    
    const secondRow = screen.getAllByRole('row')[2];
    expect(secondRow).toHaveFocus();
  });

  it('selects row with Enter key', async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();
    render(<ErrorQueue onSelect={onSelect} />);
    
    const firstRow = screen.getAllByRole('row')[1];
    firstRow.focus();
    
    await user.keyboard('{Enter}');
    
    expect(onSelect).toHaveBeenCalled();
  });
});
```

### 4. Accessibility Tests

```typescript
// Dashboard.a11y.test.tsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Dashboard } from '@/views/Dashboard';

expect.extend(toHaveNoViolations);

describe('Dashboard Accessibility', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(<Dashboard />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has proper ARIA labels on buttons', () => {
    render(<Dashboard />);
    
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    expect(refreshButton).toHaveAccessibleName();
  });

  it('announces loading state to screen readers', () => {
    render(<Dashboard />);
    
    const liveRegion = screen.getByRole('status', { name: /loading/i });
    expect(liveRegion).toBeInTheDocument();
  });
});
```

### 5. Hook Tests

```typescript
// useDashboardData.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useDashboardData } from '@/hooks/useDashboardData';

describe('useDashboardData', () => {
  it('loads dashboard data on mount', async () => {
    const { result } = renderHook(() => useDashboardData());
    
    expect(result.current.loading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.stats.pendingErrors).toBeGreaterThanOrEqual(0);
  });

  it('refreshes data when refreshData is called', async () => {
    const { result } = renderHook(() => useDashboardData());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    result.current.refreshData();
    
    expect(result.current.loading).toBe(true);
  });
});
```

### 6. Empty State Tests

```typescript
describe('Dashboard Empty States', () => {
  it('shows empty activity state when no recent activity', () => {
    render(<Dashboard />);
    
    expect(screen.getByText(/No Recent Activity/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /scan workspace/i })).toBeInTheDocument();
  });

  it('shows success state when all errors cleared', () => {
    // Mock stats with 0 pending errors
    render(<Dashboard />);
    
    const pendingCard = screen.getByText(/Pending Errors/i).closest('[role="status"]');
    expect(pendingCard).toHaveTextContent('All clear!');
  });
});
```

---

## Test Coverage Goals

### By Component Type

| Component Type | Target Coverage | Priority |
|---------------|----------------|----------|
| Views | 90% | P0 |
| Hooks | 85% | P0 |
| Components | 80% | P1 |
| Utils | 95% | P0 |
| UI Components | 70% | P2 |

### Critical Paths (Must be 100%)

1. **Error Analysis Workflow**
   - Error Queue → Select → Analyze → View Results
   
2. **Fix Application**
   - FixManager → Preview → Apply → Undo
   
3. **Dashboard Actions**
   - Analyze All → Scan Workspace → View Activity

4. **Keyboard Navigation**
   - Tab through all interactive elements
   - Arrow key navigation in lists
   - Enter/Space to activate

---

## Accessibility Testing Checklist

### Automated Tests (jest-axe)
- [ ] All views pass axe checks
- [ ] No color contrast violations
- [ ] All images have alt text
- [ ] All forms have labels

### Keyboard Navigation
- [ ] Tab order is logical
- [ ] All interactive elements reachable
- [ ] Enter/Space activates buttons
- [ ] Arrow keys navigate lists
- [ ] Escape closes modals/dialogs

### Screen Reader Testing
- [ ] Headings are hierarchical (h1 → h2 → h3)
- [ ] Landmarks properly defined (main, nav, complementary)
- [ ] Dynamic content announces (aria-live)
- [ ] Button labels are descriptive
- [ ] Form errors announce to screen reader

### Manual Testing
- [ ] Test with NVDA (Windows)
- [ ] Test with JAWS (Windows)
- [ ] Test with VoiceOver (macOS)
- [ ] Test high contrast mode
- [ ] Test with reduced motion

---

## Performance Testing

### Metrics to Measure
- Initial load time: < 1s
- View switch time: < 200ms
- Error queue (100+ items): 60fps scrolling
- Memory usage: < 50MB
- Bundle size: < 500KB

### Testing Tools
```bash
# Build analysis
npm run build
npx vite-bundle-analyzer dist/stats.html

# Performance profiling
# Use Chrome DevTools Performance tab
# Check for memory leaks in Components tab
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/webview-tests.yml
name: Webview Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd vscode-extension/webview
          npm ci
      
      - name: Run tests
        run: |
          cd vscode-extension/webview
          npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./vscode-extension/webview/coverage/lcov.info
```

---

## Next Steps

1. **Install dependencies**
   ```bash
   cd vscode-extension/webview
   npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-axe jest-environment-jsdom
   ```

2. **Create test files**
   - Start with Dashboard.test.tsx
   - Then hooks tests
   - Then remaining views

3. **Run tests**
   ```bash
   npm test
   npm run test:coverage
   ```

4. **Fix failing tests**
   - Iterate until all tests pass
   - Ensure >80% coverage

5. **Accessibility audit**
   - Run automated axe tests
   - Manual screen reader testing
   - Keyboard-only navigation

---

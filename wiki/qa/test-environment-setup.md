# Test Environment Setup

> **Stakeholder Tags**: QA Engineers, Development Team, DevOps Engineers, Test Leads

## Overview

This document provides comprehensive instructions for setting up testing environments for the NogadaCarGuard application, including local development testing, CI/CD integration, and test data management.

## Current State Assessment

⚠️ **Current Status**: The project has **NO testing framework configured**. This document will guide you through the complete setup process.

## Prerequisites

### System Requirements
- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **Git**: Latest version
- **Browser**: Chrome/Chromium (for Playwright)

### Development Environment
- **IDE**: VS Code (recommended) with testing extensions
- **Terminal**: Command line access
- **Memory**: Minimum 8GB RAM (16GB recommended)

## 1. Testing Framework Installation

### Step 1: Install Vitest for Unit Testing

```bash
# Install Vitest and testing utilities
npm install -D vitest @vitest/ui @vitest/coverage-v8

# Install React Testing Library
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event

# Install additional testing utilities
npm install -D jsdom happy-dom
```

### Step 2: Configure Vitest

Create `vitest.config.ts` in the project root:

```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/',
        'build/'
      ],
      thresholds: {
        global: {
          branches: 75,
          functions: 85,
          lines: 80,
          statements: 80
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
})
```

### Step 3: Create Test Setup File

Create `src/test/setup.ts`:

```typescript
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, afterAll } from 'vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock IntersectionObserver
beforeAll(() => {
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    observe() {
      return null
    }
    disconnect() {
      return null
    }
    unobserve() {
      return null
    }
  }

  // Mock ResizeObserver
  global.ResizeObserver = class ResizeObserver {
    constructor() {}
    observe() {
      return null
    }
    disconnect() {
      return null
    }
    unobserve() {
      return null
    }
  }

  // Mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
    }),
  })
})
```

### Step 4: Install Playwright for E2E Testing

```bash
# Install Playwright
npm install -D @playwright/test

# Install browsers (will download browser binaries)
npx playwright install
```

### Step 5: Configure Playwright

Create `playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  }
})
```

## 2. Project Structure Setup

### Create Testing Directory Structure

```bash
# Create test directories
mkdir -p src/test
mkdir -p tests/e2e
mkdir -p tests/integration
mkdir -p tests/fixtures
mkdir -p tests/utils

# Create initial test files
touch src/test/setup.ts
touch tests/utils/test-helpers.ts
touch tests/fixtures/mock-data.ts
```

### Example Directory Structure

```
NogadaCarGuard/
├── src/
│   ├── components/
│   │   ├── __tests__/              # Component unit tests
│   │   └── ui/
│   ├── hooks/
│   │   └── __tests__/              # Hook unit tests
│   ├── lib/
│   │   └── __tests__/              # Utility unit tests
│   └── test/
│       ├── setup.ts                # Test setup and global mocks
│       └── utils.ts                # Test utility functions
├── tests/
│   ├── e2e/                        # End-to-end tests
│   │   ├── admin/
│   │   ├── car-guard/
│   │   ├── customer/
│   │   └── shared/
│   ├── integration/                # Integration tests
│   ├── fixtures/                   # Test data and fixtures
│   ├── utils/                      # Test utilities
│   └── visual/                     # Visual regression tests
└── test-results/                   # Test output and reports
```

## 3. Mock Service Worker (MSW) Setup

### Install MSW

```bash
npm install -D msw
```

### Create API Mocks

Create `src/test/mocks/handlers.ts`:

```typescript
import { rest } from 'msw'
import { mockGuards, mockCustomers, mockTips } from '../../data/mockData'

export const handlers = [
  // Authentication endpoints
  rest.post('/api/auth/login', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        user: mockGuards[0],
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token'
      })
    )
  }),

  // Tips endpoints
  rest.get('/api/tips', (req, res, ctx) => {
    const guardId = req.url.searchParams.get('guardId')
    const filteredTips = guardId 
      ? mockTips.filter(tip => tip.guardId === guardId)
      : mockTips
    
    return res(ctx.status(200), ctx.json(filteredTips))
  }),

  rest.post('/api/tips', async (req, res, ctx) => {
    const tipData = await req.json()
    const newTip = {
      id: `tip-${Date.now()}`,
      ...tipData,
      timestamp: new Date().toISOString(),
      status: 'completed'
    }
    
    return res(ctx.status(201), ctx.json(newTip))
  }),

  // Guards endpoints
  rest.get('/api/guards', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockGuards))
  }),

  rest.get('/api/guards/:id', (req, res, ctx) => {
    const { id } = req.params
    const guard = mockGuards.find(g => g.id === id)
    
    if (!guard) {
      return res(ctx.status(404), ctx.json({ error: 'Guard not found' }))
    }
    
    return res(ctx.status(200), ctx.json(guard))
  }),

  // Error simulation
  rest.get('/api/error', (req, res, ctx) => {
    return res(
      ctx.status(500),
      ctx.json({ error: 'Internal server error' })
    )
  }),
]
```

### Setup MSW Server

Create `src/test/mocks/server.ts`:

```typescript
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)
```

### Update Test Setup

Update `src/test/setup.ts`:

```typescript
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, afterAll } from 'vitest'
import { server } from './mocks/server'

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers()
  cleanup()
})

// Close server after all tests
afterAll(() => server.close())

// ... rest of setup code
```

## 4. Test Utilities and Helpers

### Create Test Utils

Create `tests/utils/test-helpers.ts`:

```typescript
import { render, RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </BrowserRouter>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

// Helper functions
export const waitForLoadingToFinish = () =>
  waitForElementToBeRemoved(
    () => [...document.querySelectorAll('[data-testid*="loading"]')],
    { timeout: 4000 }
  )

export const createMockRouter = (initialRoute = '/') => ({
  push: vi.fn(),
  replace: vi.fn(),
  go: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  location: { pathname: initialRoute },
})
```

### Create Page Object Model for E2E Tests

Create `tests/e2e/pages/BasePage.ts`:

```typescript
import { Page, Locator } from '@playwright/test'

export abstract class BasePage {
  protected page: Page

  constructor(page: Page) {
    this.page = page
  }

  // Common selectors
  protected getByTestId(testId: string): Locator {
    return this.page.getByTestId(testId)
  }

  protected getByRole(role: string, options?: { name?: string }): Locator {
    return this.page.getByRole(role, options)
  }

  // Common actions
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle')
  }

  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ 
      path: `test-results/${name}.png`,
      fullPage: true 
    })
  }
}
```

Create `tests/e2e/pages/CarGuardPage.ts`:

```typescript
import { expect, Page } from '@playwright/test'
import { BasePage } from './BasePage'

export class CarGuardPage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  // Locators
  get loginButton() { return this.getByTestId('login-button') }
  get emailInput() { return this.getByTestId('email-input') }
  get passwordInput() { return this.getByTestId('password-input') }
  get dashboard() { return this.getByTestId('dashboard') }
  get qrCode() { return this.getByTestId('qr-code') }
  get balanceElement() { return this.getByTestId('balance') }
  get payoutButton() { return this.getByTestId('payout-button') }
  get successMessage() { return this.getByTestId('success-message') }

  // Actions
  async login(email: string, password: string): Promise<void> {
    await this.page.goto('/car-guard/login')
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.loginButton.click()
    await this.waitForPageLoad()
  }

  async getBalance(): Promise<number> {
    const balanceText = await this.balanceElement.textContent()
    const balance = balanceText?.replace(/[^\d.]/g, '') || '0'
    return parseFloat(balance)
  }

  async requestPayout(amount: number): Promise<void> {
    await this.page.goto('/car-guard/payouts')
    await this.getByTestId('payout-amount-input').fill(amount.toString())
    await this.payoutButton.click()
  }

  async simulateTipReception(amount: number): Promise<void> {
    // Simulate API call for tip reception
    await this.page.evaluate((tipAmount) => {
      window.dispatchEvent(new CustomEvent('tip-received', {
        detail: { amount: tipAmount }
      }))
    }, amount)
  }
}
```

## 5. Environment Configuration

### Environment Variables

Create `.env.test`:

```bash
# Test Environment Configuration
NODE_ENV=test
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME=NogadaCarGuard Test
VITE_ENABLE_MOCK=true

# Test Database
DATABASE_URL=postgresql://test:test@localhost:5432/nogada_test

# Test Payment Gateway
PAYMENT_GATEWAY_URL=https://sandbox.paymentgateway.com
PAYMENT_GATEWAY_KEY=test_key_123

# Test Notifications
NOTIFICATION_SERVICE_URL=https://test.notifications.com
NOTIFICATION_API_KEY=test_notification_key
```

### Update package.json Scripts

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "dev": "vite --host :: --port 8080",
    "build": "vite build",
    "build:dev": "vite build --mode development",
    "lint": "eslint .",
    "preview": "vite preview",
    
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch",
    
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:report": "playwright show-report",
    
    "test:all": "npm run test:run && npm run test:e2e",
    "test:ci": "npm run test:coverage && npm run test:e2e"
  }
}
```

## 6. CI/CD Integration

### GitHub Actions Workflow

Create `.github/workflows/test.yml`:

```yaml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

env:
  NODE_VERSION: '18'

jobs:
  unit-tests:
    name: Unit & Integration Tests
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run linting
        run: npm run lint
        
      - name: Run unit tests
        run: npm run test:coverage
        
      - name: Upload coverage reports
        uses: codecov/codecov-action@v4
        with:
          file: ./coverage/coverage-final.json
          fail_ci_if_error: true
          
      - name: Archive coverage artifacts
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/

  e2e-tests:
    name: End-to-End Tests
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
        
      - name: Build application
        run: npm run build
        
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          BASE_URL: http://localhost:4173
          
      - name: Upload Playwright report
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7

  visual-tests:
    name: Visual Regression Tests
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build Storybook
        run: npm run build-storybook
        
      - name: Publish to Chromatic
        uses: chromaui/action@v1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
          buildScriptName: build-storybook
```

### Azure DevOps Pipeline

Create `azure-pipelines.yml`:

```yaml
trigger:
  branches:
    include:
      - main
      - develop

pool:
  vmImage: 'ubuntu-latest'

variables:
  nodeVersion: '18.x'

stages:
- stage: Test
  displayName: 'Test Stage'
  jobs:
  - job: UnitTests
    displayName: 'Unit Tests'
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: $(nodeVersion)
      displayName: 'Install Node.js'
      
    - task: Npm@1
      inputs:
        command: 'ci'
      displayName: 'Install dependencies'
      
    - task: Npm@1
      inputs:
        command: 'custom'
        customCommand: 'run test:coverage'
      displayName: 'Run tests with coverage'
      
    - task: PublishTestResults@2
      inputs:
        testResultsFormat: 'JUnit'
        testResultsFiles: 'junit.xml'
        mergeTestResults: true
      displayName: 'Publish test results'
      
    - task: PublishCodeCoverageResults@1
      inputs:
        codeCoverageTool: 'Cobertura'
        summaryFileLocation: 'coverage/cobertura-coverage.xml'
        reportDirectory: 'coverage'
      displayName: 'Publish coverage results'

  - job: E2ETests
    displayName: 'E2E Tests'
    dependsOn: UnitTests
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: $(nodeVersion)
      displayName: 'Install Node.js'
      
    - task: Npm@1
      inputs:
        command: 'ci'
      displayName: 'Install dependencies'
      
    - script: npx playwright install --with-deps
      displayName: 'Install Playwright browsers'
      
    - task: Npm@1
      inputs:
        command: 'custom'
        customCommand: 'run test:e2e'
      displayName: 'Run E2E tests'
      
    - task: PublishTestResults@2
      condition: always()
      inputs:
        testResultsFormat: 'JUnit'
        testResultsFiles: 'test-results/results.xml'
      displayName: 'Publish E2E test results'
      
    - task: PublishBuildArtifacts@1
      condition: failed()
      inputs:
        pathtoPublish: 'test-results'
        artifactName: 'playwright-results'
      displayName: 'Upload test artifacts'
```

## 7. Database Testing Setup

### Test Database Configuration

Create `tests/fixtures/database.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

export class TestDatabase {
  private prisma: PrismaClient

  constructor() {
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/nogada_test'
        }
      }
    })
  }

  async setup(): Promise<void> {
    // Run migrations
    await this.prisma.$executeRaw`CREATE SCHEMA IF NOT EXISTS test`
    
    // Seed test data
    await this.seedTestData()
  }

  async teardown(): Promise<void> {
    // Clean up test data
    await this.prisma.$executeRaw`TRUNCATE TABLE "tips" CASCADE`
    await this.prisma.$executeRaw`TRUNCATE TABLE "guards" CASCADE`
    await this.prisma.$executeRaw`TRUNCATE TABLE "customers" CASCADE`
    
    await this.prisma.$disconnect()
  }

  private async seedTestData(): Promise<void> {
    // Insert test guards
    await this.prisma.guard.createMany({
      data: [
        {
          id: 'test-guard-1',
          name: 'Test Guard 1',
          email: 'guard1@test.com',
          phone: '+27123456789'
        }
      ]
    })
  }
}
```

## 8. Performance Testing Setup

### Lighthouse CI Configuration

Create `lighthouse.config.js`:

```javascript
module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,
      startServerCommand: 'npm run preview',
      startServerReadyPattern: 'Local:',
      url: [
        'http://localhost:4173/',
        'http://localhost:4173/car-guard',
        'http://localhost:4173/customer',
        'http://localhost:4173/admin'
      ]
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.8 }]
      }
    },
    upload: {
      target: 'filesystem',
      outputDir: './lighthouse-results'
    }
  }
}
```

## 9. IDE Setup and Extensions

### VS Code Extensions

Create `.vscode/extensions.json`:

```json
{
  "recommendations": [
    "ms-playwright.playwright",
    "vitest.explorer",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "usernamehw.errorlens",
    "ms-vscode.test-adapter-converter",
    "hbenl.vscode-test-explorer"
  ]
}
```

### VS Code Settings

Create `.vscode/settings.json`:

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "testing.automaticallyOpenPeekView": "failureInVisibleDocument",
  "playwright.reuseBrowser": true,
  "playwright.showTrace": true,
  "vitest.enable": true,
  "vitest.commandLine": "npm run test"
}
```

## 10. Docker Test Environment

### Docker Compose for Testing

Create `docker-compose.test.yml`:

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.test
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=test
      - DATABASE_URL=postgresql://test:test@db:5432/nogada_test
    depends_on:
      - db
      - redis

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=nogada_test
      - POSTGRES_USER=test
      - POSTGRES_PASSWORD=test
    volumes:
      - test_db_data:/var/lib/postgresql/data
    ports:
      - "5433:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6380:6379"

volumes:
  test_db_data:
```

### Dockerfile for Testing

Create `Dockerfile.test`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Install Playwright browsers
RUN npx playwright install --with-deps

# Build application
RUN npm run build

# Expose port
EXPOSE 8080

# Start application
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "8080"]
```

## Quick Start Guide

### 1. Initial Setup
```bash
# Clone the repository
git clone <repository-url>
cd NogadaCarGuard

# Install dependencies
npm install

# Install testing dependencies
npm run setup:tests  # (create this script)
```

### 2. Run Tests Locally
```bash
# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e

# Run all tests
npm run test:all
```

### 3. Debug Tests
```bash
# Debug unit tests
npm run test:ui

# Debug E2E tests
npm run test:e2e:debug
```

## Troubleshooting

### Common Issues

#### Playwright Installation Issues
```bash
# Clear Playwright cache
npx playwright install --force

# Install system dependencies (Linux)
npx playwright install-deps
```

#### Vitest Configuration Issues
```bash
# Clear Vitest cache
npx vitest --run --reporter=verbose --clearCache
```

#### Mock Service Worker Issues
```bash
# Ensure MSW is properly initialized
# Check browser console for MSW warnings
# Verify handlers are correctly defined
```

---

**Document Information**
- **Created**: 2025-08-25
- **Last Updated**: 2025-08-25
- **Version**: 1.0
- **Authors**: QA Team
- **Review Schedule**: Monthly
- **Related Documents**: [Testing Strategies](testing-strategies.md), [Bug Tracking](bug-tracking.md)
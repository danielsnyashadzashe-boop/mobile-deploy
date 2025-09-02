# Local Development Setup Guide

## Overview

This guide walks you through setting up the **NogadaCarGuard** multi-portal tipping application on your local development machine. The application consists of three integrated portals: Car Guard App, Customer Portal, and Admin Application.

**Stakeholder Relevance:** 👨‍💻 Frontend Dev, 🌐 Full-Stack Dev, 🛠️ Senior Dev, 👩‍💻 Junior Dev, 🏗️ DevOps Engineer

---

## Prerequisites

### Required Software

| Software | Minimum Version | Recommended Version | Purpose |
|----------|-----------------|--------------------|---------| 
| **Node.js** | 18.0.0 | 20.x LTS | JavaScript runtime |
| **npm** | 9.0.0 | 10.x | Package manager |
| **Git** | 2.30.0 | Latest | Version control |
| **VS Code** | 1.70.0 | Latest | IDE (recommended) |

### System Requirements

- **OS**: Windows 10+, macOS 12+, or Ubuntu 20.04+
- **RAM**: Minimum 8GB (16GB recommended)
- **Storage**: 2GB free space
- **Network**: Stable internet connection for package downloads

---

## Installation Steps

### 1. Repository Setup

```bash
# Clone the repository
git clone https://dev.azure.com/ionic-innovations/NogadaCarGuard/_git/NogadaCarGuard
cd NogadaCarGuard

# Verify you're on the main branch
git branch
# Should show: * main

# Check repository status
git status
```

### 2. Node.js and npm Verification

```bash
# Check Node.js version
node --version
# Should output: v18.x.x or higher

# Check npm version  
npm --version
# Should output: 9.x.x or higher

# Update npm if needed
npm install -g npm@latest
```

### 3. Package Installation

```bash
# Install all dependencies
npm install

# Verify critical packages are installed
npm list react react-dom typescript vite
```

**Expected installation output:**
```
added 1247 packages, and audited 1248 packages in 45s
found 0 vulnerabilities
```

### 4. Development Server Setup

```bash
# Start the development server
npm run dev

# Expected output:
# ➜  Local:   http://localhost:8080/
# ➜  Network: http://[your-ip]:8080/
# ➜  ready in 1.2s
```

The development server will:
- Run on port **8080**
- Bind to all network interfaces (`host: "::"`)
- Enable hot module replacement (HMR)
- Use SWC for fast TypeScript compilation

---

## Project Structure Overview

```
C:\IonicProjects\NogadaCarGuard\
├── src/                          # Application source code
│   ├── components/               # Component library
│   │   ├── admin/               # Admin portal components
│   │   ├── car-guard/           # Car guard app components  
│   │   ├── customer/            # Customer portal components
│   │   ├── shared/              # Cross-portal components
│   │   └── ui/                  # shadcn/ui base components (50+ components)
│   ├── pages/                   # Page components by portal
│   │   ├── admin/               # Admin application pages
│   │   ├── car-guard/           # Car guard app pages
│   │   └── customer/            # Customer portal pages
│   ├── data/                    # Mock data and TypeScript interfaces
│   ├── hooks/                   # Custom React hooks
│   └── lib/                     # Utility functions
├── public/                      # Static assets
├── wiki/                        # Documentation
└── Configuration files
```

---

## Development Environment Configuration

### VS Code Setup

#### Required Extensions

Install these VS Code extensions for optimal development experience:

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next", 
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json"
  ]
}
```

#### VS Code Settings

Create `.vscode/settings.json`:

```json
{
  "typescript.suggest.autoImports": true,
  "typescript.updateImportsOnFileMove.enabled": "always",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "tailwindCSS.experimental.classRegex": [
    "cn\\(([^)]*)\\)"
  ],
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  }
}
```

### Environment Variables

Create `.env.local` for local development:

```bash
# Development environment variables
VITE_APP_NAME=NogadaCarGuard
VITE_APP_VERSION=1.0.0
VITE_DEVELOPMENT_MODE=true

# API Configuration (when backend is ready)
VITE_API_BASE_URL=http://localhost:3001/api
VITE_WEBSOCKET_URL=ws://localhost:3001

# Mock Data Configuration
VITE_USE_MOCK_DATA=true
VITE_MOCK_DELAY=500

# Portal Configuration
VITE_CAR_GUARD_PATH=/car-guard
VITE_CUSTOMER_PATH=/customer  
VITE_ADMIN_PATH=/admin
```

### TypeScript Configuration

The project uses a relaxed TypeScript configuration for rapid development:

**Key Settings in `tsconfig.json`:**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]           // Path alias for clean imports
    },
    "noImplicitAny": false,        // Allows implicit any types
    "noUnusedParameters": false,   // Allows unused parameters
    "skipLibCheck": true,          // Skips type checking of declaration files
    "allowJs": true,               // Allows JavaScript files
    "noUnusedLocals": false,       // Allows unused local variables
    "strictNullChecks": false      // Relaxed null checking
  }
}
```

---

## Development Commands

### Primary Commands

```bash
# Start development server (port 8080, all interfaces)
npm run dev

# Build for production
npm run build

# Build for development environment  
npm run build:dev

# Run ESLint
npm run lint

# Preview production build
npm run preview
```

### Advanced Development

```bash
# Clear node_modules and reinstall (if issues occur)
rm -rf node_modules package-lock.json
npm install

# Check for outdated packages
npm outdated

# Update packages (be cautious in active development)
npm update

# Install new package
npm install package-name
npm install -D @types/package-name  # TypeScript types
```

---

## Portal Access

Once the development server is running, access the three portals:

### Application Selector
- **URL**: http://localhost:8080/
- **Purpose**: Landing page for portal selection
- **Component**: `src/pages/AppSelector.tsx`

### Car Guard App
- **URL**: http://localhost:8080/car-guard
- **Login**: Use any guard ID from mock data (e.g., "CG001")
- **Features**: QR code display, balance view, tip history, payouts
- **Layout**: Bottom navigation for mobile-friendly experience

```typescript
// Sample mock guard IDs for testing
const testGuardIds = ['CG001', 'CG002', 'CG003', 'CG004'];
```

### Customer Portal  
- **URL**: http://localhost:8080/customer
- **Registration**: Available at `/customer/register`
- **Features**: Guard tipping, transaction history, wallet management
- **Layout**: Top navigation with responsive design

### Admin Application
- **URL**: http://localhost:8080/admin
- **Login**: Admin credentials (mock authentication)
- **Features**: Dashboard analytics, location/guard/manager management
- **Layout**: Sidebar navigation with comprehensive admin tools

---

## Development Workflow

### Branch Management

```bash
# Create feature branch
git checkout -b feature/portal-enhancement

# Make changes, then commit
git add .
git commit -m "feat(car-guard): add enhanced QR code display"

# Push branch
git push -u origin feature/portal-enhancement
```

### Hot Reloading

The Vite development server provides instant hot reloading:

- **Component changes**: Preserves state, updates UI immediately
- **Style changes**: CSS updates without page reload
- **Type errors**: Displayed in browser and terminal
- **Console errors**: Check browser DevTools for runtime issues

### Testing Changes

```bash
# Test on mobile devices (development server binds to all interfaces)
# Access from mobile device on same network:
http://[your-computer-ip]:8080

# Example mobile testing URLs:
http://192.168.1.100:8080/car-guard      # Car guard mobile app
http://192.168.1.100:8080/customer       # Customer portal
```

---

## Common Development Tasks

### Adding a New Component

```bash
# 1. Create component file
touch src/components/car-guard/NewFeature.tsx

# 2. Add to the component with proper imports
```

```typescript
// src/components/car-guard/NewFeature.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface NewFeatureProps {
  title: string;
  onAction?: () => void;
}

export function NewFeature({ title, onAction }: NewFeatureProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-tippa-dark">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={onAction}
          className="bg-tippa-primary text-tippa-dark hover:bg-tippa-secondary"
        >
          Action Button
        </Button>
      </CardContent>
    </Card>
  );
}
```

### Adding a New Page

```bash
# 1. Create page file
touch src/pages/car-guard/NewPage.tsx
```

```typescript
// src/pages/car-guard/NewPage.tsx
import React from 'react';
import { NewFeature } from '@/components/car-guard/NewFeature';

export function NewPage() {
  return (
    <div className="min-h-screen bg-tippa-light p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-tippa-dark mb-6">
          New Page
        </h1>
        <NewFeature 
          title="Feature Title"
          onAction={() => console.log('Action clicked')}
        />
      </div>
    </div>
  );
}
```

### Working with Mock Data

```typescript
// Import mock data and helpers
import { 
  mockCarGuards, 
  getTipsByGuardId, 
  formatCurrency 
} from '@/data/mockData';

// Use in component
export function GuardBalance({ guardId }: { guardId: string }) {
  const guard = mockCarGuards.find(g => g.id === guardId);
  const tips = getTipsByGuardId(guardId);
  
  return (
    <div>
      <h2>Balance: {formatCurrency(guard?.balance || 0)}</h2>
      <p>Total Tips: {tips.length}</p>
    </div>
  );
}
```

---

## Debugging and Troubleshooting

### Common Issues

#### Port 8080 Already in Use
```bash
# Kill process using port 8080
# Windows:
netstat -ano | findstr :8080
taskkill /PID [process_id] /F

# macOS/Linux:
lsof -ti:8080 | xargs kill -9

# Alternative: Use different port
# In vite.config.ts, change port to 8081
```

#### Node Module Issues
```bash
# Clear package cache
npm cache clean --force

# Delete and reinstall node_modules
rm -rf node_modules package-lock.json
npm install
```

#### TypeScript Errors
```bash
# Check TypeScript compilation
npx tsc --noEmit

# Restart TypeScript service in VS Code:
# Ctrl+Shift+P -> "TypeScript: Restart TS Server"
```

#### Import Path Issues
```bash
# Verify path alias is working
# ✅ Good: import { Button } from '@/components/ui/button';
# ❌ Bad: import { Button } from '../../../components/ui/button';

# Check tsconfig.json paths configuration
```

### Development Tools

#### Browser DevTools Setup
- **React Developer Tools**: Install browser extension
- **Network Tab**: Monitor API calls (when backend is connected)
- **Console**: Check for JavaScript errors and warnings
- **Application Tab**: Check Local Storage and Session Storage

#### Performance Monitoring
```typescript
// Add performance measurements
console.time('Component Render');
// Component logic
console.timeEnd('Component Render');

// Monitor bundle size
npm run build
# Check dist/ folder size
```

---

## Database Setup (Future)

### Local Database Requirements

When the backend API is implemented, you'll need:

```bash
# Database setup (placeholder for future implementation)
# PostgreSQL for production data
# Redis for caching and sessions

# Connection strings will be added to .env.local:
DATABASE_URL=postgresql://user:password@localhost:5432/nogada_carguard
REDIS_URL=redis://localhost:6379
```

---

## Mobile Development Testing

### Device Testing Setup

```bash
# Ensure development server is accessible on network
# vite.config.ts already configured with host: "::"

# Find your computer's IP address
# Windows:
ipconfig | findstr "IPv4"

# macOS/Linux:  
ifconfig | grep "inet "

# Access from mobile device:
http://[your-ip]:8080/car-guard
```

### Responsive Testing

```bash
# Use browser DevTools device emulation:
# F12 -> Toggle Device Toolbar
# Test common devices:
# - iPhone 12 Pro (390x844)
# - Samsung Galaxy S21 (384x854)  
# - iPad (768x1024)
```

---

## Integration Testing

### Component Testing Setup

```bash
# Future testing setup (when tests are added)
npm install -D @testing-library/react @testing-library/jest-dom vitest

# Test file structure
src/
├── components/
│   ├── __tests__/
│   │   ├── AdminDashboard.test.tsx
│   │   ├── CarGuardLogin.test.tsx
│   │   └── CustomerTipping.test.tsx
```

---

## Production Build Verification

### Build Testing

```bash
# Create production build
npm run build

# Serve production build locally
npm run preview

# Expected output:
# ➜  Local:   http://localhost:4173/
# ➜  Network: use --host to expose

# Test all portals in production mode:
# http://localhost:4173/
# http://localhost:4173/car-guard
# http://localhost:4173/customer  
# http://localhost:4173/admin
```

### Build Analysis

```bash
# Check build output
ls -la dist/

# Expected structure:
dist/
├── assets/
│   ├── index-[hash].js      # Main application bundle
│   ├── index-[hash].css     # Compiled styles
│   └── [component]-[hash].js # Code-split components
├── favicon.ico
└── index.html
```

---

## Additional Resources

### Documentation Links
- **Project Wiki**: `/wiki/` directory
- **Component Documentation**: `/wiki/developers/development-standards.md`
- **API Documentation**: `/wiki/developers/api-documentation.md`

### External Resources
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Vite Documentation](https://vitejs.dev/)
- [shadcn/ui Components](https://ui.shadcn.com/)

### Getting Help

1. **Check existing documentation** in `/wiki/` folder
2. **Review mock data** in `src/data/mockData.ts`
3. **Examine existing components** for patterns
4. **Consult the development team** for complex issues

---

## Conclusion

You now have a complete local development environment for the NogadaCarGuard multi-portal application. The setup includes:

- ✅ All three portals (Car Guard, Customer, Admin) running locally
- ✅ Hot reloading and fast development workflow  
- ✅ TypeScript support with relaxed configuration
- ✅ Mock data for realistic development testing
- ✅ Mobile-friendly testing on network devices
- ✅ Production build verification

Start developing by exploring the existing components and pages, then reference the development standards document for coding conventions.

---

**Document Information:**
- **Version:** 1.0
- **Last Updated:** 2025-01-25
- **Maintainer:** Development Team
- **Review Cycle:** As needed for environment changes
- **Related Documents:** 
  - `/wiki/developers/development-standards.md`
  - `/wiki/developers/api-documentation.md`
  - `/CLAUDE.md` (project overview)
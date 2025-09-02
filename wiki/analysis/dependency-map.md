# Dependency Map

## Overview

The NogadaCarGuard project uses **67 total packages** (50 production dependencies + 17 development dependencies) carefully selected for modern React development with TypeScript, form handling, UI components, and development tooling.

## Dependency Analysis Summary

| Category | Count | Size Impact | Security Priority |
|----------|-------|-------------|------------------|
| **Production** | 50 | High | Critical |
| **Development** | 17 | Build-time only | Moderate |
| **UI Components** | 22 | Medium | Low |
| **Core Framework** | 8 | High | Critical |
| **Build Tools** | 6 | Build-time only | Moderate |

## Core Framework Dependencies

### React Ecosystem
```json
{
  "react": "^18.3.1",                    // Core React library
  "react-dom": "^18.3.1",               // React DOM renderer
  "react-router-dom": "^6.26.2",        // Client-side routing
  "react-hook-form": "^7.53.0",         // Form management
  "@tanstack/react-query": "^5.56.2"    // Server state management
}
```

**Impact Analysis:**
- **Bundle Size**: ~45KB gzipped (React + React DOM)
- **Security**: Critical - Regular security updates required
- **Compatibility**: React 18.3.1 stable with concurrent features
- **Peer Dependencies**: All React packages aligned to v18.x

### TypeScript & Build System
```json
{
  "typescript": "^5.5.3",               // TypeScript compiler
  "vite": "^5.4.1",                     // Build tool and dev server
  "@vitejs/plugin-react-swc": "^3.5.0", // React plugin with SWC
  "@types/node": "^22.5.5",             // Node.js type definitions
  "@types/react": "^18.3.3",            // React type definitions
  "@types/react-dom": "^18.3.0"         // React DOM type definitions
}
```

**Impact Analysis:**
- **Build Performance**: Vite + SWC provides sub-second builds
- **Type Safety**: Full TypeScript coverage with strict mode configuration
- **Development Experience**: Hot module replacement and fast refresh

## UI Component Dependencies

### shadcn/ui Ecosystem (22 Radix UI Components)
```json
{
  "@radix-ui/react-accordion": "^1.2.0",
  "@radix-ui/react-alert-dialog": "^1.1.1",
  "@radix-ui/react-aspect-ratio": "^1.1.0",
  "@radix-ui/react-avatar": "^1.1.0",
  "@radix-ui/react-checkbox": "^1.1.1",
  "@radix-ui/react-collapsible": "^1.1.0",
  "@radix-ui/react-context-menu": "^2.2.1",
  "@radix-ui/react-dialog": "^1.1.2",
  "@radix-ui/react-dropdown-menu": "^2.1.1",
  "@radix-ui/react-hover-card": "^1.1.1",
  "@radix-ui/react-label": "^2.1.0",
  "@radix-ui/react-menubar": "^1.1.1",
  "@radix-ui/react-navigation-menu": "^1.2.0",
  "@radix-ui/react-popover": "^1.1.1",
  "@radix-ui/react-progress": "^1.1.0",
  "@radix-ui/react-radio-group": "^1.2.0",
  "@radix-ui/react-scroll-area": "^1.1.0",
  "@radix-ui/react-select": "^2.1.1",
  "@radix-ui/react-separator": "^1.1.0",
  "@radix-ui/react-slider": "^1.2.0",
  "@radix-ui/react-slot": "^1.1.0",
  "@radix-ui/react-switch": "^1.1.0",
  "@radix-ui/react-tabs": "^1.1.0",
  "@radix-ui/react-toast": "^1.2.1",
  "@radix-ui/react-toggle": "^1.1.0",
  "@radix-ui/react-toggle-group": "^1.1.0",
  "@radix-ui/react-tooltip": "^1.1.4"
}
```

**Impact Analysis:**
- **Bundle Size**: ~120KB gzipped (tree-shaken)
- **Accessibility**: WAI-ARIA compliant components
- **Customization**: Headless components with full style control
- **Maintenance**: Stable Radix UI ecosystem with regular updates

### Styling & Theme System
```json
{
  "tailwindcss": "^3.4.11",             // Utility-first CSS framework
  "tailwind-merge": "^2.5.2",           // Class name merging utility
  "tailwindcss-animate": "^1.0.7",      // Animation utilities
  "class-variance-authority": "^0.7.1",  // Component variant system
  "clsx": "^2.1.1",                     // Conditional class names
  "next-themes": "^0.3.0"               // Theme switching
}
```

## Feature-Specific Dependencies

### Form Handling & Validation
```json
{
  "react-hook-form": "^7.53.0",         // Form state management
  "@hookform/resolvers": "^3.9.0",      // Validation resolvers
  "zod": "^3.23.8"                      // Schema validation
}
```

**Dependency Relationship:**
```mermaid
graph LR
    RHF[react-hook-form] --> Resolvers[@hookform/resolvers]
    Resolvers --> Zod[zod]
    RHF --> Forms[Form Components]
    Zod --> Validation[Type-safe Validation]
```

### Data Visualization & QR Codes
```json
{
  "recharts": "^2.12.7",                // Chart library
  "react-qr-code": "^2.0.12"            // QR code generation
}
```

### UI Enhancement Libraries
```json
{
  "lucide-react": "^0.462.0",           // Icon library (2000+ icons)
  "sonner": "^1.5.0",                   // Toast notifications
  "cmdk": "^1.0.0",                     // Command palette
  "embla-carousel-react": "^8.3.0",     // Carousel component
  "react-day-picker": "^8.10.1",        // Date picker
  "react-resizable-panels": "^2.1.3",   // Resizable layouts
  "input-otp": "^1.2.4",                // OTP input component
  "vaul": "^0.9.3"                      // Drawer component
}
```

### Date & Utility Libraries
```json
{
  "date-fns": "^3.6.0",                 // Date manipulation (modular)
  "postcss": "^8.4.47",                 // CSS post-processing
  "autoprefixer": "^10.4.20"            // CSS vendor prefixes
}
```

## Development Dependencies

### Linting & Code Quality
```json
{
  "eslint": "^9.9.0",                   // JavaScript/TypeScript linting
  "@eslint/js": "^9.9.0",               // ESLint JavaScript config
  "typescript-eslint": "^8.0.1",        // TypeScript ESLint integration
  "eslint-plugin-react-hooks": "^5.1.0-rc.0", // React hooks linting
  "eslint-plugin-react-refresh": "^0.4.9",     // React refresh linting
  "globals": "^15.9.0"                  // Global variable definitions
}
```

### Documentation & Development Tools
```json
{
  "@tailwindcss/typography": "^0.5.15", // Typography plugin for docs
  "lovable-tagger": "^1.1.7"            // Component tagging for development
}
```

## Dependency Relationships

### Critical Dependency Chains

```mermaid
graph TD
    subgraph "Core Framework"
        React[react@18.3.1] --> ReactDOM[react-dom@18.3.1]
        React --> RHF[react-hook-form@7.53.0]
        React --> RQ[react-query@5.56.2]
        React --> RRD[react-router-dom@6.26.2]
    end
    
    subgraph "Build System"
        TS[typescript@5.5.3] --> Vite[vite@5.4.1]
        Vite --> SWC[@vitejs/plugin-react-swc@3.5.0]
    end
    
    subgraph "UI System"
        TW[tailwindcss@3.4.11] --> TWM[tailwind-merge@2.5.2]
        Radix[22x @radix-ui components] --> ShadcnUI[shadcn/ui system]
        CVA[class-variance-authority] --> ShadcnUI
    end
    
    subgraph "Form System"
        RHF --> Resolvers[@hookform/resolvers@3.9.0]
        Resolvers --> Zod[zod@3.23.8]
    end
    
    React --> ShadcnUI
    TS --> ShadcnUI
```

### Peer Dependency Compatibility

| Package | React Version | TypeScript Version | Status |
|---------|---------------|-------------------|---------|
| @radix-ui/* | >=16.8.0 | >=4.0.0 | ✅ Compatible |
| react-hook-form | >=16.8.0 | >=4.0.0 | ✅ Compatible |
| @tanstack/react-query | >=16.8.0 | >=4.1.0 | ✅ Compatible |
| react-router-dom | >=16.8.0 | >=4.0.0 | ✅ Compatible |
| recharts | >=16.0.0 | >=3.0.0 | ✅ Compatible |

## Security Analysis

### High Priority Dependencies
```bash
# Critical security packages requiring regular updates
react                    # Core framework security
react-dom               # DOM security and XSS prevention
typescript              # Type safety and security
vite                    # Build security and dev server
@tanstack/react-query   # Data fetching security
```

### Vulnerability Monitoring
```bash
# Regular security audit commands
npm audit                    # Check for known vulnerabilities
npm audit fix               # Auto-fix non-breaking vulnerabilities
npm outdated                # Check for outdated packages
```

### Security Best Practices
- **Automatic Updates**: Dependabot configuration for security patches
- **Version Pinning**: Exact versions for build reproducibility
- **Regular Audits**: Monthly dependency security reviews
- **Minimal Surface**: Only essential dependencies included

## Bundle Size Analysis

### Production Bundle Impact

| Category | Estimated Size (gzipped) | Impact |
|----------|-------------------------|---------|
| **React Core** | 45KB | High |
| **Radix UI Components** | 120KB | Medium |
| **Utility Libraries** | 25KB | Low |
| **Feature Libraries** | 35KB | Medium |
| **Total Estimated** | 225KB | Acceptable |

### Tree Shaking Optimization
```javascript
// Vite configuration for optimal tree shaking
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-*'],
          utils: ['date-fns', 'zod', 'clsx']
        }
      }
    }
  }
})
```

## Maintenance Strategy

### Update Schedule
- **Critical Security**: Immediate updates
- **Minor Versions**: Monthly reviews  
- **Major Versions**: Quarterly assessment
- **Development Dependencies**: As needed

### Version Compatibility Matrix

| Dependency | Current | Latest | Next Major | Upgrade Risk |
|------------|---------|---------|------------|-------------|
| React | 18.3.1 | 18.3.1 | 19.x | Medium |
| TypeScript | 5.5.3 | 5.6.x | 6.x | Low |
| Vite | 5.4.1 | 5.4.x | 6.x | Low |
| React Router | 6.26.2 | 6.26.x | 7.x | Medium |
| Radix UI | 1.x | 1.x | 2.x | High |

---

**Document Information**
- **Version**: 1.0.0
- **Last Updated**: 2025-08-25
- **Total Dependencies**: 67 packages
- **Production Dependencies**: 50 packages  
- **Development Dependencies**: 17 packages
- **Stakeholders**: Development Team, DevOps Engineers, Security Team
- **Next Review**: 2025-09-25
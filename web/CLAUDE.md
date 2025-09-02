# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Nogada Tip Flow application - a multi-portal system for managing car guard tipping and payments. The application consists of three main portals:
- **Car Guard App**: Mobile-friendly interface for car guards to receive tips via QR codes and manage payouts
- **Customer Portal**: Interface for customers to tip car guards and view transaction history  
- **Admin Application**: Comprehensive dashboard for managing locations, guards, managers, transactions, and system administration

## Technology Stack

- **Framework**: React 18.3.1 with TypeScript 5.5.3
- **Build Tool**: Vite 5.4.1 with SWC for fast compilation
- **UI Components**: shadcn/ui (Radix UI primitives) - pre-configured components in `src/components/ui/`
- **Styling**: Tailwind CSS 3.4.11 with custom color theme (tippa palette)
- **Routing**: React Router v6.26.2 with nested route structure
- **State Management**: React Query (TanStack Query 5.56.2) for server state
- **Forms**: React Hook Form 7.53.0 with Zod 3.23.8 validation
- **QR Code**: react-qr-code 2.0.12 for QR code generation
- **Charts**: Recharts 2.12.7 for data visualization
- **Date Handling**: date-fns 3.6.0 for date manipulation

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (runs on port 8080, binds to all interfaces)
npm run dev

# Build for production
npm run build

# Build for development environment (includes development mode optimizations)
npm run build:dev

# Run ESLint (configured with TypeScript support)
npm run lint

# Preview production build
npm run preview
```

## Application Architecture

### Route Structure
The application uses a nested routing structure with three distinct app contexts:

- `/` - App selector landing page (AppSelector component)
- `/car-guard/*` - Car guard portal routes
  - `/car-guard` - Login page (default)
  - `/car-guard/dashboard` - Main dashboard with QR code and balance
  - `/car-guard/history` - Transaction history
  - `/car-guard/payouts` - Payout management
  - `/car-guard/profile` - Profile settings
- `/customer/*` - Customer portal routes
  - `/customer` - Login page (default)
  - `/customer/register` - Registration
  - `/customer/dashboard` - Customer dashboard
  - `/customer/tip/:guardId` - Tipping interface
  - `/customer/history` - Transaction history
  - `/customer/profile` - Profile management
- `/admin/*` - Admin application routes with nested administration section
  - `/admin` - Admin login (default)
  - `/admin/dashboard` - Admin dashboard with analytics
  - `/admin/locations` - Location management
  - `/admin/managers` - Manager management
  - `/admin/guards` - Guard management
  - `/admin/payouts` - Payout processing
  - `/admin/transactions` - Transaction monitoring
  - `/admin/reports` - Report generation
  - `/admin/administration/*` - Nested administration routes
    - `/admin/administration/roles` - Role management
    - `/admin/administration/users` - User management
    - `/admin/administration/saas` - SaaS settings
    - `/admin/administration/settings` - System settings

### Key Directories
- `src/components/` - Component organization by feature/portal
  - `admin/` - Admin-specific components (AdminHeader, AdminSidebar, StatsCard, FilterSection)
    - `charts/` - Chart components (TipVolumeChart, LocationPerformanceChart)
  - `car-guard/` - Car guard app components (QRCodeDisplay, BottomNavigation)
  - `customer/` - Customer portal components (CustomerNavigation)
  - `shared/` - Shared components across apps (NogadaLogo, TippaLogo)
  - `ui/` - shadcn/ui base components (50+ pre-configured components)
- `src/pages/` - Page components organized by portal
  - `admin/` - Admin page components
  - `car-guard/` - Car guard page components
  - `customer/` - Customer page components
- `src/data/` - Mock data and data structures
  - `mockData.ts` - Complete mock data with TypeScript interfaces and helper functions
- `src/hooks/` - Custom React hooks
  - `use-mobile.tsx` - Mobile detection hook
  - `use-toast.ts` - Toast notification hook
- `src/lib/` - Utility functions
  - `utils.ts` - Common utilities including `cn()` for className merging

### Path Aliases
- `@/` maps to `src/` directory for clean imports (configured in tsconfig.json and vite.config.ts)

## Data Models and Mock Data

The application uses TypeScript interfaces defined in `src/data/mockData.ts`:

- **CarGuard**: Guard profile with balance, QR code, location, and bank details
- **Customer**: Customer profile with wallet balance
- **Tip**: Tip transaction records
- **Payout**: Payout voucher records with status tracking
- **Location**: Location entities with guard counts
- **Manager**: Manager profiles linked to locations
- **Transaction**: Comprehensive transaction records supporting multiple types (tip, payout, airtime, electricity, etc.)

Helper functions available:
- `getTipsByGuardId()`, `getTipsByCustomerId()`
- `getPayoutsByGuardId()`, `getGuardsByManagerId()`
- `getGuardsByLocationId()`, `getManagersByLocationId()`
- `getTransactionsByGuardId()`
- `formatCurrency()`, `formatDate()`, `formatTime()`, `formatDateTime()`

## Key Architectural Patterns

1. **Multi-App Structure**: Three distinct applications sharing a common codebase with separate routing contexts via React Router Outlet pattern
2. **Component Organization**: Feature-based organization with portal-specific components and shared UI library
3. **Type Safety**: Full TypeScript implementation with interfaces for all data models (note: some type checking is relaxed in tsconfig.json)
4. **Form Handling**: Consistent React Hook Form + Zod pattern for form validation
5. **Responsive Design**: Mobile-first approach using Tailwind CSS with custom tippa color palette
6. **Mock Data Architecture**: Comprehensive mock data structure with relationships between entities for development
7. **Layout Pattern**: Admin app uses SidebarProvider pattern, car guard app uses BottomNavigation, customer portal uses top navigation

## Development Notes

- The development server binds to all interfaces (`host: "::"`) for network testing
- TypeScript is configured with relaxed settings (`noImplicitAny: false`, `strictNullChecks: false`)
- ESLint is configured but `@typescript-eslint/no-unused-vars` is disabled
- No test files currently exist in the project
- The project uses Lovable Tagger for component tracking in development mode
- Custom Tailwind theme includes `tippa` color palette for branding consistency
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NogadaCarGuard is a comprehensive car guard tipping platform with three integrated applications:
- **Web Portal**: Multi-portal React application featuring admin dashboard, customer portal, and car guard interface
- **Mobile App**: React Native (Expo SDK 53) application for car guards with QR code-based tipping
- **Backend**: API server (currently empty, to be implemented)

## Commands

### Web Application (./web)
```bash
cd web
npm install          # Install dependencies
npm run dev          # Start dev server (port 8080, binds to all interfaces)
npm run build        # Production build
npm run build:dev    # Development build with mode-specific optimizations
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

### Mobile Application (./mobile)
```bash
cd mobile
npm install          # Install dependencies
npm start            # Start Expo development server
npm run android      # Run on Android emulator
npm run ios          # Run on iOS simulator
npm run web          # Run in web browser
npm run lint         # Run ESLint via Expo CLI
npm run prebuild     # Generate native Android/iOS projects
```

## Architecture

### Repository Structure
```
NogadaCarGuard/
├── web/                    # Web application (React + Vite)
│   ├── src/
│   │   ├── components/     # UI components organized by portal
│   │   │   ├── admin/      # Admin-specific components
│   │   │   ├── car-guard/  # Car guard portal components
│   │   │   ├── customer/   # Customer portal components
│   │   │   ├── shared/     # Shared components (logos, etc.)
│   │   │   └── ui/         # shadcn/ui base components (50+)
│   │   ├── pages/          # Page components by portal
│   │   ├── data/           # Mock data and TypeScript interfaces
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utility functions
│   └── [config files]
├── mobile/                 # Mobile app (React Native + Expo)
│   ├── app/                # File-based routing (Expo Router)
│   │   ├── (auth)/         # Authentication flow
│   │   ├── (tabs)/         # Main app with bottom tabs
│   │   └── _layout.tsx     # Root layout
│   ├── types/              # TypeScript definitions
│   ├── data/               # Mock data
│   └── assets/             # Images and fonts
├── backend/                # Backend API (to be implemented)
└── wiki/                   # Project documentation

```

### Web Application Architecture
- **Framework**: React 18.3.1 with TypeScript 5.5.3
- **Build Tool**: Vite 5.4.1 with SWC for fast compilation
- **UI Library**: shadcn/ui (50+ pre-configured Radix UI primitives)
- **Styling**: Tailwind CSS 3.4.11 with custom tippa color palette
- **Routing**: React Router v6.26.2 with nested routes for three portals:
  - `/` - App selector landing page
  - `/car-guard/*` - Car guard mobile-friendly interface
  - `/customer/*` - Customer portal with tipping flow
  - `/admin/*` - Admin dashboard with nested administration section
- **State Management**: React Query (TanStack Query 5.56.2) for server state
- **Forms**: React Hook Form 7.53.0 with Zod 3.23.8 validation
- **Charts**: Recharts 2.12.7 for data visualization
- **QR Codes**: react-qr-code 2.0.12 for QR generation

### Mobile Application Architecture
- **Framework**: React Native 0.79.5 with Expo SDK 53
- **Navigation**: Expo Router 5.1.5 (file-based routing with typed routes)
- **Styling**: NativeWind 4.1.23 (Tailwind for React Native)
- **Components**: React Native QRCode SVG 6.3.0, Expo Vector Icons 14.0.0
- **State**: Local component state with AsyncStorage 2.1.2 for persistence
- **Forms**: React Hook Form 7.53.0 with Zod 3.23.8 validation
- **Animations**: React Native Reanimated 3.17.4
- **Gestures**: React Native Gesture Handler 2.24.0

### Shared Data Models (TypeScript)
Key interfaces used across applications (defined in respective `data/mockData.ts` files):
- `CarGuard`: Guard profile with balance, QR code, location, bank details
- `Customer`: Customer profile with wallet balance
- `Tip`: Transaction records with amounts and timestamps
- `Payout`: Payout voucher records with status tracking
- `Transaction`: Comprehensive transaction types (tip, payout, airtime, electricity, etc.)
- `Location`: Location entities with guard counts and coordinates
- `Manager`: Manager profiles linked to locations

Helper functions available in mock data:
- `getTipsByGuardId()`, `getTipsByCustomerId()`
- `getPayoutsByGuardId()`, `getGuardsByManagerId()`
- `getGuardsByLocationId()`, `getManagersByLocationId()`
- `getTransactionsByGuardId()`
- `formatCurrency()`, `formatDate()`, `formatTime()`, `formatDateTime()`

## Development Patterns

### Web Development
- Use existing shadcn/ui components from `src/components/ui/`
- Follow portal-specific component organization (admin/, car-guard/, customer/)
- Apply Tailwind classes with `tippa-*` color palette for brand consistency
- Use `cn()` utility from `lib/utils` for conditional class merging
- Path alias `@/` maps to `src/` directory
- Components use Lovable Tagger in development mode for tracking

### Mobile Development
- Use Expo Router for navigation (file-based routing in `app/` directory)
- Apply NativeWind classes for Tailwind-style styling
- Follow mobile-first design principles with proper touch targets
- Use platform-specific code when needed (Platform.OS checks)
- Path alias `@/*` maps to project root
- Safe area handling with react-native-safe-area-context

### Form Handling Pattern (Both Platforms)
```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: { email: "", password: "" }
});
```

## Important Configuration

### Web (vite.config.ts)
- Dev server runs on port 8080, binds to all interfaces (`host: "::"`)
- Path alias: `@` → `./src` for clean imports
- Uses SWC plugin for fast React compilation
- Lovable Tagger enabled in development mode
- Build outputs to `dist/` directory

### Mobile (app.json)
- Expo configuration with typed routes enabled via experiments
- App name: "Tippa CarGuard", slug: "tippa-carguard"
- Bundle identifiers: `com.nogada.tippa.carguard`
- Orientation locked to portrait
- Custom splash screen with tippa green (#10B981) background
- Plugins: expo-router, expo-font

### TypeScript Configuration
- **Web**: Relaxed settings (`noImplicitAny: false`, `strictNullChecks: false`)
- **Mobile**: Strict mode enabled for better type safety
- Both use path aliases for cleaner imports (@/ for web, @/* for mobile)

## Testing & Quality
- **Web**: ESLint configured, no test framework currently
- **Mobile**: ESLint via Expo CLI
- Run linting before commits: `npm run lint` in respective directories
- No automated tests currently implemented

## Route Structure

### Web Application Routes
Three distinct portals with separate authentication and navigation:
```
/ - App selector (choose portal)
/car-guard - Guard login
/car-guard/dashboard - Guard QR code and balance
/car-guard/history - Transaction history
/car-guard/payouts - Payout management
/car-guard/profile - Profile settings
/customer - Customer login
/customer/register - Registration
/customer/dashboard - Customer home
/customer/tip/:guardId - Tip a guard
/customer/history - Transaction history
/customer/profile - Profile management
/admin - Admin login
/admin/dashboard - Analytics dashboard
/admin/locations - Location management
/admin/managers - Manager management
/admin/guards - Guard management
/admin/payouts - Process payouts
/admin/transactions - Transaction monitoring
/admin/reports - Reports
/admin/administration/* - System administration
```

### Mobile Application Routes (File-based)
```
app/
├── (auth)/
│   ├── login.tsx - Guard login with ID/PIN
│   └── register.tsx - Registration
├── (tabs)/
│   ├── _layout.tsx - Tab navigator
│   ├── index.tsx - Dashboard with QR
│   ├── history.tsx - Transaction history
│   ├── payouts.tsx - Payout management
│   └── profile.tsx - Profile settings
└── _layout.tsx - Root stack navigator
```

## Key Architectural Decisions

1. **Multi-Portal Architecture**: Single codebase serving three distinct user types with separate UIs and flows
2. **Mock Data First**: Comprehensive mock data structure allows full UI development before backend implementation
3. **Component Library**: shadcn/ui provides 50+ pre-built, customizable components reducing development time
4. **File-based Routing (Mobile)**: Expo Router simplifies navigation with automatic route generation
5. **Tailwind Styling**: Consistent design system across web and mobile via Tailwind/NativeWind
6. **TypeScript**: Type safety with interfaces for all data models (relaxed on web for faster iteration)
7. **No Backend Dependency**: Both apps fully functional with mock data, backend can be added later

## Demo Credentials
- Guard Login: ID `NG001`, PIN `1234`
- Customer Login: Various test accounts in mock data
- Admin Login: Check mock data for admin credentials
- Comprehensive mock data with realistic transaction history
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NogadaCarGuard is a comprehensive car guard tipping platform with three integrated applications:
- **Web Portal**: React-based admin dashboard, customer portal, and car guard interface
- **Mobile App**: React Native (Expo) application for car guards
- **Backend**: API server (currently empty, to be implemented)

## Commands

### Web Application (./web)
```bash
cd web
npm install          # Install dependencies
npm run dev          # Start dev server (port 8080)
npm run build        # Production build
npm run build:dev    # Development build
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
npm run lint         # Run ESLint
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
- **Build Tool**: Vite 5.4.1 with SWC
- **UI Library**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS with custom tippa color palette
- **Routing**: React Router v6 with nested routes for three portals:
  - `/car-guard/*` - Car guard interface
  - `/customer/*` - Customer portal
  - `/admin/*` - Admin dashboard with nested administration section
- **State Management**: React Query (TanStack Query) for server state
- **Forms**: React Hook Form with Zod validation

### Mobile Application Architecture
- **Framework**: React Native 0.79.5 with Expo SDK 53
- **Navigation**: Expo Router (file-based routing)
- **Styling**: NativeWind (Tailwind for React Native)
- **Components**: React Native QRCode SVG, Expo Vector Icons
- **State**: Local component state with AsyncStorage for persistence
- **Forms**: React Hook Form with Zod validation

### Shared Data Models (TypeScript)
Key interfaces used across applications:
- `CarGuard`: Guard profile with balance, QR code, location
- `Customer`: Customer profile with wallet balance
- `Tip`: Transaction records
- `Payout`: Payout voucher records
- `Transaction`: Comprehensive transaction types (tip, payout, airtime, etc.)
- `Location`: Location entities with guard counts
- `Manager`: Manager profiles linked to locations

Helper functions available:
- `getTipsByGuardId()`, `getTipsByCustomerId()`
- `getPayoutsByGuardId()`, `getGuardsByManagerId()`
- `formatCurrency()`, `formatDate()`, `formatTime()`

## Development Patterns

### Web Development
- Use existing shadcn/ui components from `src/components/ui/`
- Follow portal-specific component organization
- Apply Tailwind classes with `tippa-*` color palette
- Use `cn()` utility for conditional classes
- Path alias `@/` maps to `src/` directory

### Mobile Development
- Use Expo Router for navigation (file-based routing)
- Apply NativeWind classes for styling
- Follow mobile-first design principles
- Use platform-specific code when needed
- Path alias `@/*` maps to project root

### Form Handling Pattern (Both Platforms)
```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
```

## Important Configuration

### Web (vite.config.ts)
- Dev server runs on port 8080, binds to all interfaces (`host: "::"`)
- Path alias: `@` → `./src`
- Uses SWC for fast compilation

### Mobile (app.json)
- Expo configuration with typed routes enabled
- Custom app icon and splash screen configured
- AsyncStorage for local data persistence

### TypeScript Configuration
- Web: Relaxed settings (`noImplicitAny: false`, `strictNullChecks: false`)
- Mobile: Strict mode enabled
- Both use path aliases for cleaner imports

## Testing & Quality
- **Web**: ESLint configured, no tests currently
- **Mobile**: ESLint via Expo CLI
- Run linting before commits: `npm run lint`
- No test framework currently configured

## Demo Credentials
- Guard ID: `NG001`, PIN: `1234`
- Comprehensive mock data available for all features
- Realistic transaction history and payout records
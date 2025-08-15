# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Nogada Tip Flow application - a multi-portal system for managing car guard tipping and payments. The application consists of three main portals:
- **Car Guard App**: Mobile-friendly interface for car guards to receive tips and manage payouts
- **Customer Portal**: Interface for customers to tip car guards and view transaction history  
- **Admin Application**: Comprehensive dashboard for managing locations, guards, managers, transactions, and system administration

## Technology Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **State Management**: React Query (TanStack Query)
- **Forms**: React Hook Form with Zod validation
- **QR Code**: react-qr-code for QR code generation
- **Charts**: Recharts for data visualization

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (runs on port 8080)
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

## Application Architecture

### Route Structure
- `/` - App selector landing page
- `/car-guard/*` - Car guard portal routes
- `/customer/*` - Customer portal routes  
- `/admin/*` - Admin application routes

### Key Directories
- `src/components/` - Reusable components organized by feature
  - `admin/` - Admin-specific components
  - `car-guard/` - Car guard app components
  - `customer/` - Customer portal components
  - `shared/` - Shared components across apps
  - `ui/` - shadcn/ui base components
- `src/pages/` - Page components for each route
- `src/data/` - Mock data and data structures
- `src/hooks/` - Custom React hooks
- `src/lib/` - Utility functions

### Path Aliases
- `@/` maps to `src/` directory for clean imports

## Key Architectural Patterns

1. **Multi-App Structure**: Three distinct applications (Car Guard, Customer, Admin) share a common codebase but have separate routing and features
2. **Component Organization**: Components are organized by feature/portal with shared UI components in a centralized location
3. **Type Safety**: Full TypeScript implementation with strict typing
4. **Form Handling**: Consistent use of React Hook Form with Zod schemas for validation
5. **Responsive Design**: Mobile-first approach using Tailwind CSS utilities
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React Native application built with Expo (SDK 52) and TypeScript for the Tippa CarGuard mobile app. The project uses Expo Router for file-based navigation, NativeWind for Tailwind CSS styling, and React 18.

## Key Commands

### Development
- `npm install` - Install dependencies
- `npm start` or `expo start` - Start the development server
- `npm run android` - Start on Android emulator
- `npm run ios` - Start on iOS simulator
- `npm run web` - Start in web browser

### Code Quality
- `npm run lint` or `expo lint` - Run ESLint to check code quality

## Architecture

### Routing
The app uses Expo Router with file-based routing. Routes are defined in the `app/` directory:
- `app/_layout.tsx` - Root layout component using Stack navigation
- `app/(auth)/` - Authentication flow (login, register)
- `app/(tabs)/` - Main app with bottom tabs (dashboard, history, payouts, profile)
- `app/index.tsx` - Entry point that redirects to login

### Styling
- **NativeWind**: Tailwind CSS for React Native styling
- **Custom Theme**: Tippa color palette defined in tailwind.config.js
- **Responsive**: Mobile-first design with proper touch targets
- **Typography**: System fonts with consistent text scaling

### Data Management
- **Mock Data**: Comprehensive mock data structure in `/data/mockData.ts`
- **Types**: TypeScript interfaces in `/types/index.ts`
- **AsyncStorage**: Local persistence for user preferences and app data
- **State**: Local component state with React hooks

### Key Components
- **QR Code**: React Native QRCode SVG for tip collection
- **Navigation**: Expo Router with tab navigation
- **Forms**: React Hook Form with validation
- **Modals**: Native modal components for actions
- **Lists**: Optimized FlatList for transaction history

## Configuration

### Core Files
- `app.json` - Expo configuration with app metadata, plugins, and typed routes enabled
- `babel.config.js` - Babel configuration with NativeWind and Reanimated plugins
- `metro.config.js` - Metro bundler with NativeWind support
- `tailwind.config.js` - Tailwind configuration with tippa theme colors
- `tsconfig.json` - TypeScript configuration with strict mode and path alias `@/*` for root imports
- `global.css` - Tailwind base styles
- `nativewind-env.d.ts` - NativeWind type definitions

### Dependencies
- **Core**: React Native 0.76.3, Expo ~52.0.11, TypeScript
- **Navigation**: Expo Router ~4.0.9
- **Styling**: NativeWind 2.0.11, Tailwind CSS 3.4.11
- **UI**: Expo Vector Icons, React Native QRCode SVG, React Native SVG
- **Forms**: React Hook Form 7.53.0, Zod 3.23.8
- **Storage**: AsyncStorage 2.0.0
- **Utilities**: Date-fns 3.6.0, Expo Haptics, Expo Linear Gradient

## Development Patterns

### File Structure
- Feature-based organization with pages in `app/` directory
- Shared types in `/types/index.ts`
- Mock data and utilities in `/data/mockData.ts`
- Assets organized in `/assets/images/` and `/assets/fonts/`

### Code Conventions
- TypeScript strict mode enabled
- Functional components with hooks
- Tailwind classes via NativeWind
- Consistent error handling and loading states
- Mobile-optimized touch interactions

### Navigation Patterns
- File-based routing with Expo Router
- Stack navigation for authentication flow
- Tab navigation for main app sections
- Modal presentations for actions and forms

## TypeScript
- Strict mode is enabled
- Path alias `@/*` maps to the project root for cleaner imports
- Custom types defined for all data models
- Typed routes are enabled via Expo Router

## Mobile-Specific Features
- Native navigation patterns
- Touch feedback with Expo Haptics
- Pull-to-refresh functionality
- Keyboard-avoiding views for forms
- Safe area handling
- Platform-specific styling where needed

## Demo Data
- Guard ID: NG001, PIN: 1234 for testing
- Comprehensive mock data for all features
- Realistic transaction history and payout records
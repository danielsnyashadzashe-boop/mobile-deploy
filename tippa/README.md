# Tippa CarGuard - React Native App

A React Native mobile application for car guards to manage tips, payouts, and transactions using Expo and NativeWind (Tailwind CSS).

## Features

- **Authentication**: Login and registration system for car guards
- **Dashboard**: QR code display for receiving tips, balance overview, and quick actions
- **Transaction History**: Comprehensive transaction tracking with filtering
- **Payouts**: Request payouts to bank accounts, cash, airtime, or electricity
- **Profile Management**: Personal information and banking details management
- **Native UI**: Fully native user interface with Tailwind CSS styling

## Technology Stack

- **React Native**: 0.76.3
- **Expo**: ~52.0.11 with Expo Router for navigation
- **NativeWind**: 2.0.11 for Tailwind CSS styling in React Native
- **TypeScript**: Full type safety
- **React Hook Form + Zod**: Form validation
- **AsyncStorage**: Local data persistence
- **Expo Vector Icons**: Icon library
- **React Native QRCode SVG**: QR code generation

## Setup Instructions

1. **Clone and Navigate**:
   ```bash
   cd tippa
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start Development Server**:
   ```bash
   npx expo start
   ```

4. **Run on Device/Simulator**:
   - iOS: `npm run ios` or press `i` in the terminal
   - Android: `npm run android` or press `a` in the terminal
   - Web: `npm run web` or press `w` in the terminal

## Project Structure

```
tippa/
├── app/                    # Expo Router pages
│   ├── (auth)/            # Authentication pages
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/            # Main app tabs
│   │   ├── dashboard.tsx  # QR code, balance, quick actions
│   │   ├── history.tsx    # Transaction history
│   │   ├── payouts.tsx    # Payout requests and history
│   │   └── profile.tsx    # Profile management
│   ├── _layout.tsx        # Root layout
│   └── index.tsx          # Entry point
├── data/                  # Mock data and utilities
│   └── mockData.ts
├── types/                 # TypeScript type definitions
│   └── index.ts
├── assets/               # Images and fonts
├── global.css           # Global Tailwind styles
└── app.json            # Expo configuration
```

## Key Features Implemented

### Authentication Flow
- Login with Guard ID and PIN
- Registration form with location selection
- Form validation with proper error handling

### Dashboard
- Real-time QR code for tip collection
- Balance display with earnings summary
- Quick action buttons for airtime, electricity, payouts
- Recent transactions overview

### Transaction History
- Comprehensive transaction list with filtering
- Visual transaction categorization
- Pull-to-refresh functionality
- Empty states and loading indicators

### Payout Management
- Multiple payout types (bank, cash, airtime, electricity)
- Payout request modal with validation
- Status tracking for pending requests
- Historical payout records

### Profile Management
- Editable personal information
- Banking details management
- Settings and preferences
- Logout functionality

## Configuration Files

- **app.json**: Expo configuration with app metadata and plugins
- **babel.config.js**: Babel configuration with NativeWind support
- **metro.config.js**: Metro bundler configuration for NativeWind
- **tailwind.config.js**: Tailwind configuration with custom tippa color theme
- **tsconfig.json**: TypeScript configuration with strict mode

## Demo Credentials

- **Guard ID**: NG001
- **PIN**: 1234

## Development Notes

1. **NativeWind Setup**: Pre-configured to work with Tailwind CSS classes in React Native
2. **Type Safety**: Full TypeScript implementation with custom types
3. **Mock Data**: Comprehensive mock data structure for development
4. **Responsive Design**: Mobile-first approach with proper touch targets
5. **Performance**: Optimized with FlatList for large data sets and proper re-rendering

## Building for Production

```bash
# Build for Android
npx expo build:android

# Build for iOS
npx expo build:ios

# Generate native projects
npx expo prebuild
```

## Migration Notes

This app was migrated from a React web application to React Native using:
- React Router → Expo Router
- HTML elements → React Native components
- CSS classes → NativeWind classes
- Web-specific components → React Native equivalents

The migration maintained all original functionality while adapting to native mobile patterns and interactions.
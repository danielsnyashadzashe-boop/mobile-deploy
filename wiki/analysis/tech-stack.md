# Technology Stack

## Technology Overview

NogadaCarGuard leverages a modern, production-ready technology stack centered around **React 18.3.1**, **TypeScript 5.5.3**, and **Vite 5.4.1** for optimal developer experience and application performance.

## Core Technologies

### Frontend Framework
```json
{
  "Framework": "React 18.3.1",
  "Language": "TypeScript 5.5.3", 
  "Build Tool": "Vite 5.4.1 with SWC",
  "Package Manager": "npm",
  "Module System": "ES Modules"
}
```

### Architecture Pattern
- **Multi-Portal SPA**: Single application serving three distinct user interfaces
- **Component-Driven Development**: Reusable components with shadcn/ui
- **Type-Safe Development**: Full TypeScript coverage with interfaces
- **Mock-First Development**: Comprehensive mock data for rapid prototyping

## Technology Stack Breakdown

### 🎯 Core Framework & Language

#### React 18.3.1
```typescript
// Key React 18 features used
import { useState, useEffect, Suspense, memo } from 'react'
import { createRoot } from 'react-dom/client'

// Concurrent features ready for production
const App = () => {
  return (
    <Suspense fallback={<Loading />}>
      <Router>
        {/* Application routes */}
      </Router>
    </Suspense>
  )
}
```

**React 18 Benefits:**
- **Concurrent Rendering**: Better user experience with non-blocking updates
- **Automatic Batching**: Improved performance with batched state updates
- **Suspense for Data Fetching**: Ready for async component loading
- **Strict Mode**: Development-time checks for best practices

#### TypeScript 5.5.3
```typescript
// Strong typing throughout the application
interface CarGuard {
  id: string
  name: string
  balance: number
  location: string
  qrCode: string
  // ... additional properties
}

// Generic utility types for data operations
type ApiResponse<T> = {
  data: T
  status: 'success' | 'error'
  message?: string
}
```

**TypeScript Configuration:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "node",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": false,
    "noImplicitAny": false,
    "strictNullChecks": false
  }
}
```

### 🛠 Build System & Development Tools

#### Vite 5.4.1 with SWC
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '::',  // Bind to all interfaces
    port: 8080
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
```

**Vite Benefits:**
- **Lightning Fast**: Sub-second cold starts and instant HMR
- **SWC Compilation**: Rust-based TypeScript/JavaScript compilation  
- **ES Module Native**: Modern module system with tree-shaking
- **Plugin Ecosystem**: Rich ecosystem with React optimizations

#### ESLint 9.9.0 + TypeScript ESLint 8.0.1
```javascript
// eslint.config.js
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    }
  }
)
```

### 🎨 UI & Styling Framework

#### Tailwind CSS 3.4.11
```typescript
// tailwind.config.js
import animate from 'tailwindcss-animate'

export default {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  prefix: '',
  theme: {
    extend: {
      colors: {
        tippa: {
          primary: 'hsl(210 100% 50%)',
          secondary: 'hsl(210 100% 90%)',
          // ... custom color palette
        }
      }
    }
  },
  plugins: [animate]
}
```

**Tailwind Benefits:**
- **Utility-First**: Rapid UI development with utility classes
- **Custom Theme**: tippa brand colors and design tokens
- **Responsive Design**: Mobile-first responsive utilities
- **Performance**: Purged CSS with only used classes in production

#### shadcn/ui Component System
```typescript
// Example shadcn/ui component usage
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form'

const Dashboard = () => (
  <Card>
    <CardHeader>
      <CardTitle>Car Guard Dashboard</CardTitle>
    </CardHeader>
    <CardContent>
      <Button variant="default" size="lg">
        Generate QR Code
      </Button>
    </CardContent>
  </Card>
)
```

**60+ Available Components:**
- **Forms**: Input, Select, Checkbox, Radio, Switch, Textarea
- **Layout**: Card, Sheet, Tabs, Accordion, Separator
- **Navigation**: Button, Dropdown, Breadcrumb, Pagination
- **Feedback**: Alert, Toast, Dialog, Tooltip, Progress
- **Data**: Table, Badge, Avatar, Calendar, Chart

### 🔄 State Management & Data Flow

#### TanStack Query 5.56.2 (React Query)
```typescript
// Query setup for server state management
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useCarGuards() {
  return useQuery({
    queryKey: ['carGuards'],
    queryFn: async () => {
      // Currently returns mock data, ready for API integration
      return mockCarGuards
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useCreateTip() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (tipData: CreateTipRequest) => {
      // API integration point
      return createTip(tipData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tips'] })
    }
  })
}
```

#### React Hook Form 7.53.0 + Zod 3.23.8
```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const loginSchema = z.object({
  guardId: z.string().min(1, 'Guard ID is required'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginForm() {
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      guardId: '',
      password: ''
    }
  })

  const onSubmit = (data: LoginFormData) => {
    // Type-safe form submission
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields */}
      </form>
    </Form>
  )
}
```

### 🧭 Routing & Navigation

#### React Router 6.26.2
```typescript
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppSelector />,
  },
  {
    path: '/car-guard',
    element: <CarGuardApp />,
    children: [
      { index: true, element: <CarGuardLogin /> },
      { path: 'dashboard', element: <CarGuardDashboard /> },
      { path: 'history', element: <CarGuardHistory /> },
      { path: 'payouts', element: <CarGuardPayouts /> },
      { path: 'profile', element: <CarGuardProfile /> }
    ]
  },
  {
    path: '/customer',
    element: <CustomerPortal />,
    children: [
      { index: true, element: <CustomerLogin /> },
      { path: 'register', element: <CustomerRegister /> },
      { path: 'dashboard', element: <CustomerDashboard /> },
      { path: 'tip/:guardId', element: <CustomerTipping /> },
      { path: 'history', element: <CustomerHistory /> },
      { path: 'profile', element: <CustomerProfile /> }
    ]
  },
  {
    path: '/admin',
    element: <AdminApp />,
    children: [
      { index: true, element: <AdminLogin /> },
      { path: 'dashboard', element: <AdminDashboard /> },
      // ... additional admin routes including nested administration routes
    ]
  },
  {
    path: '*',
    element: <NotFound />
  }
])

export default function App() {
  return <RouterProvider router={router} />
}
```

### 📊 Data Visualization & Special Components

#### Recharts 2.12.7
```typescript
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const TipVolumeChart = ({ data }: { data: ChartData[] }) => (
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="location" />
      <YAxis />
      <Tooltip formatter={(value) => [`R${value}`, 'Tips']} />
      <Bar dataKey="tips" fill="hsl(var(--primary))" />
    </BarChart>
  </ResponsiveContainer>
)
```

#### React QR Code 2.0.12
```typescript
import QRCode from 'react-qr-code'

const QRCodeDisplay = ({ guardId, qrCode }: { guardId: string, qrCode: string }) => (
  <div className="flex flex-col items-center space-y-4">
    <QRCode
      value={`https://nogada.app/tip/${guardId}?code=${qrCode}`}
      size={200}
      style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
    />
    <p className="text-sm text-muted-foreground">Scan to tip {guardId}</p>
  </div>
)
```

#### Lucide React 0.462.0
```typescript
import { 
  QrCode, 
  CreditCard, 
  History, 
  User, 
  Bell, 
  Settings,
  ChevronDown,
  Menu,
  X
} from 'lucide-react'

// 2000+ icons available with consistent styling
const NavigationIcon = ({ icon: Icon, label }: { icon: any, label: string }) => (
  <div className="flex items-center gap-2">
    <Icon size={20} />
    <span>{label}</span>
  </div>
)
```

### 🛠 Utility Libraries

#### Date-fns 3.6.0
```typescript
import { format, parseISO, isAfter, addDays } from 'date-fns'

// Modular date library (tree-shakeable)
export const formatDateTime = (dateString: string): string => {
  const date = parseISO(dateString)
  return format(date, 'MMM dd, yyyy HH:mm')
}

export const isPayoutExpired = (issueDate: string): boolean => {
  const expiry = addDays(parseISO(issueDate), 30) // 30 days expiry
  return isAfter(new Date(), expiry)
}
```

#### Class Variance Authority + clsx + tailwind-merge
```typescript
import { cva } from 'class-variance-authority'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Utility for conditional and merged class names
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Component variant system
const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline'
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
)
```

## Technology Stack Architecture

```mermaid
graph TB
    subgraph "Frontend Stack"
        React[React 18.3.1] --> TypeScript[TypeScript 5.5.3]
        React --> ReactDOM[React DOM 18.3.1]
        React --> ReactRouter[React Router 6.26.2]
        React --> ReactQuery[TanStack Query 5.56.2]
    end
    
    subgraph "UI & Styling"
        Tailwind[Tailwind CSS 3.4.11] --> ShadcnUI[shadcn/ui Components]
        RadixUI[22x Radix UI Primitives] --> ShadcnUI
        Lucide[Lucide React 0.462.0] --> ShadcnUI
        CVA[Class Variance Authority] --> ShadcnUI
    end
    
    subgraph "Form & Validation"
        ReactHookForm[React Hook Form 7.53.0] --> Zod[Zod 3.23.8]
        ReactHookForm --> HookFormResolvers[@hookform/resolvers 3.9.0]
    end
    
    subgraph "Build & Development"
        Vite[Vite 5.4.1] --> SWC[@vitejs/plugin-react-swc 3.5.0]
        ESLint[ESLint 9.9.0] --> TypeScriptESLint[typescript-eslint 8.0.1]
        Vite --> PostCSS[PostCSS 8.4.47]
        PostCSS --> Autoprefixer[Autoprefixer 10.4.20]
    end
    
    subgraph "Specialized Components"
        Recharts[Recharts 2.12.7] --> Charts[Data Visualization]
        ReactQRCode[React QR Code 2.0.12] --> QRCodes[QR Code Generation]
        DateFns[date-fns 3.6.0] --> DateUtils[Date Utilities]
        Sonner[Sonner 1.5.0] --> Notifications[Toast Notifications]
    end
    
    React --> ShadcnUI
    TypeScript --> ShadcnUI
    ReactHookForm --> React
    Vite --> React
```

## Development Environment

### Package Manager & Scripts
```json
{
  "scripts": {
    "dev": "vite",                    // Development server (port 8080, all interfaces)
    "build": "vite build",           // Production build
    "build:dev": "vite build --mode development",  // Development build
    "lint": "eslint .",              // Code linting
    "preview": "vite preview"        // Preview production build
  }
}
```

### Development Features
- **Hot Module Replacement**: Instant updates without losing state
- **TypeScript Integration**: Real-time type checking and IntelliSense
- **ESLint Integration**: Code quality enforcement
- **Path Aliases**: Clean imports with `@/` mapping to `src/`
- **Network Access**: Development server accessible on local network

### Production Build
```bash
# Build optimization
npm run build

# Output analysis
dist/
├── assets/
│   ├── index-[hash].js        # Main application bundle
│   ├── vendor-[hash].js       # Third-party dependencies
│   └── index-[hash].css       # Compiled styles
├── index.html                 # Entry point
└── ...static assets
```

## Technology Decision Rationale

### Why React 18.3.1?
- **Stability**: Mature ecosystem with extensive community support
- **Performance**: Concurrent features for better user experience  
- **Developer Experience**: Excellent tooling and debugging capabilities
- **Ecosystem**: Rich component libraries and development tools

### Why TypeScript 5.5.3?
- **Type Safety**: Catch errors at compile-time, not runtime
- **Developer Productivity**: IntelliSense, refactoring, and navigation
- **Code Quality**: Self-documenting code with interfaces and types
- **Team Collaboration**: Shared understanding through type definitions

### Why Vite 5.4.1?
- **Build Speed**: 10x faster than traditional bundlers
- **Modern Defaults**: ES modules, tree-shaking, and optimization out-of-the-box
- **Plugin Ecosystem**: Rich ecosystem with React optimizations
- **Development Experience**: Instant server start and HMR

### Why shadcn/ui?
- **Accessibility**: WAI-ARIA compliant components by default
- **Customization**: Full control over styling and behavior
- **Quality**: Battle-tested Radix UI primitives as foundation
- **Developer Experience**: Copy-paste component installation

## Version Compatibility Matrix

| Technology | Current Version | Stable Until | Next Major | Upgrade Risk |
|------------|----------------|--------------|------------|-------------|
| React | 18.3.1 | 2025+ | 19.x (2025) | Medium |
| TypeScript | 5.5.3 | 2024+ | 6.x (2025) | Low |
| Vite | 5.4.1 | 2024+ | 6.x (2025) | Low |
| React Router | 6.26.2 | 2024+ | 7.x (2025) | Medium |
| Tailwind CSS | 3.4.11 | 2024+ | 4.x (TBD) | High |
| shadcn/ui | 1.x | 2024+ | 2.x (TBD) | Medium |

---

**Document Information**
- **Version**: 1.0.0
- **Last Updated**: 2025-08-25
- **Technology Stack**: React 18 + TypeScript 5 + Vite 5
- **Component System**: shadcn/ui with 60+ components
- **Development Pattern**: Multi-portal SPA with mock-first development
- **Stakeholders**: Development Team, Technical Decision Makers, DevOps Engineers
- **Next Review**: 2025-09-25
# Development Standards

## Overview

This document outlines the coding conventions, best practices, and standards for the **NogadaCarGuard** project. These standards ensure code consistency, maintainability, and quality across the three-portal tipping application.

**Stakeholder Relevance:** 🛠️ Senior Dev, 👨‍💻 Frontend Dev, 🏗️ DevOps Engineer, 📊 Project Manager

---

## Technology Stack Standards

### Core Technologies
- **React 18.3.1** with functional components and hooks
- **TypeScript 5.5.3** with relaxed configuration for rapid development
- **Vite 5.4.1** with SWC for fast compilation and hot reload
- **Tailwind CSS 3.4.11** for utility-first styling
- **shadcn/ui** components for consistent UI patterns

### Required Dependencies
```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.26.2",
  "typescript": "^5.5.3",
  "@vitejs/plugin-react-swc": "^3.5.0",
  "tailwindcss": "^3.4.11"
}
```

---

## Code Organization Standards

### Directory Structure

```
src/
├── components/              # Component organization
│   ├── admin/              # Admin portal components
│   ├── car-guard/          # Car guard app components
│   ├── customer/           # Customer portal components
│   ├── shared/             # Cross-portal components
│   └── ui/                 # shadcn/ui base components
├── pages/                  # Page components by portal
│   ├── admin/
│   ├── car-guard/
│   └── customer/
├── data/                   # Mock data and interfaces
├── hooks/                  # Custom React hooks
└── lib/                    # Utility functions
```

### File Naming Conventions
- **Components**: PascalCase with descriptive names
  - `AdminDashboard.tsx`, `CarGuardLogin.tsx`, `CustomerTipping.tsx`
- **Hooks**: camelCase with `use` prefix
  - `use-mobile.tsx`, `use-toast.ts`
- **Utilities**: camelCase
  - `utils.ts`, `mockData.ts`
- **Pages**: PascalCase with portal prefix
  - `AdminPayouts.tsx`, `CarGuardProfile.tsx`

---

## TypeScript Standards

### Interface Definitions
All data models must be defined with TypeScript interfaces in `src/data/mockData.ts`:

```typescript
export interface CarGuard {
  id: string;
  name: string;
  guardId: string;
  location: string;
  locationId?: string;
  balance: number;
  minPayoutThreshold: number;
  qrCode: string;
  managerId?: string;
  phoneNumber?: string;
  bankName?: string;
  accountNumber?: string;
  bankDetails?: string;
}
```

### Component Props
Always define props interfaces:

```typescript
interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function AdminHeader({ title, subtitle, actions }: AdminHeaderProps) {
  // Component implementation
}
```

### Current TypeScript Configuration
The project uses relaxed TypeScript settings for rapid development:

```json
{
  "compilerOptions": {
    "noImplicitAny": false,
    "noUnusedParameters": false,
    "noUnusedLocals": false,
    "strictNullChecks": false,
    "skipLibCheck": true,
    "allowJs": true
  }
}
```

---

## React Component Standards

### Functional Components
Use functional components with hooks exclusively:

```typescript
import React from 'react';
import { useState, useEffect } from 'react';

export function CarGuardDashboard() {
  const [balance, setBalance] = useState(0);
  
  useEffect(() => {
    // Component logic
  }, []);

  return (
    <div className="p-4">
      {/* JSX content */}
    </div>
  );
}
```

### Component Structure
1. Import statements (React, third-party, local)
2. Interface definitions
3. Component function
4. Export statement

### Hook Usage
- Use custom hooks in `src/hooks/` for reusable logic
- Current custom hooks:
  - `use-mobile.tsx` - Mobile detection
  - `use-toast.ts` - Toast notifications

---

## Styling Standards

### Tailwind CSS Guidelines
Use Tailwind utility classes with the project's custom color palette:

```typescript
// Tippa brand colors
<div className="bg-tippa-primary text-tippa-accent">
  <h1 className="text-2xl font-bold text-tippa-dark">NogadaCarGuard</h1>
</div>

// Legacy nogada colors (backwards compatibility)
<button className="bg-nogada-primary hover:bg-nogada-secondary">
  Submit
</button>
```

### Custom Color Palette
```css
tippa: {
  primary: '#DEFF00',     // Bright lime-yellow green
  secondary: '#5B94D3',   // Blue
  accent: '#11468F',      // Dark blue for text/accents
  light: '#f0f8ff',       // Very light blue background
  dark: '#11468F',        // Dark blue for contrast
  neutral: '#6b7280',     // Gray for secondary text
  danger: '#B01519',      // Red for warnings/errors
}
```

### Responsive Design
Mobile-first approach with consistent breakpoints:

```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Responsive grid */}
</div>
```

---

## Component Library Standards

### shadcn/ui Components
Use pre-configured shadcn/ui components from `src/components/ui/`:

```typescript
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

// Consistent usage across portals
<Card className="w-full">
  <CardHeader>
    <CardTitle>Dashboard</CardTitle>
  </CardHeader>
  <CardContent>
    <Button variant="default" size="lg">
      Action Button
    </Button>
  </CardContent>
</Card>
```

### Form Standards
Use React Hook Form with Zod validation:

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const formSchema = z.object({
  amount: z.number().min(1, "Amount must be positive"),
  guardId: z.string().min(1, "Guard ID is required"),
});

export function TippingForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      guardId: "",
    },
  });

  return (
    <Form {...form}>
      {/* Form implementation */}
    </Form>
  );
}
```

---

## Routing Standards

### Multi-Portal Structure
Use React Router with nested routing for the three portals:

```typescript
// Main router structure
<Routes>
  <Route path="/" element={<AppSelector />} />
  <Route path="/car-guard/*" element={<CarGuardApp />} />
  <Route path="/customer/*" element={<CustomerPortal />} />
  <Route path="/admin/*" element={<AdminApp />} />
  <Route path="*" element={<NotFound />} />
</Routes>
```

### Route Organization
- `/car-guard/*` - Car guard mobile app routes
- `/customer/*` - Customer tipping portal routes  
- `/admin/*` - Admin dashboard routes with nested administration

---

## Import Standards

### Path Aliases
Use the configured `@/` alias for clean imports:

```typescript
// Preferred
import { Button } from "@/components/ui/button";
import { mockCarGuards } from "@/data/mockData";
import { cn } from "@/lib/utils";

// Avoid relative imports
import { Button } from "../../../components/ui/button";
```

### Import Order
1. React and React-related imports
2. Third-party library imports
3. Local component imports
4. Utility and data imports

```typescript
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { mockCarGuards, CarGuard } from "@/data/mockData";
import { cn } from "@/lib/utils";
```

---

## State Management Standards

### React Query for Server State
Use TanStack Query for data fetching and caching:

```typescript
import { useQuery } from '@tanstack/react-query';

export function useCarGuardData(guardId: string) {
  return useQuery({
    queryKey: ['carGuard', guardId],
    queryFn: () => fetchCarGuardData(guardId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
```

### Local State
Use useState for component-level state:

```typescript
const [isLoading, setIsLoading] = useState(false);
const [balance, setBalance] = useState(0);
```

---

## Error Handling Standards

### Component Error Boundaries
Implement error boundaries for portal sections:

```typescript
class AdminErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong in the admin portal.</div>;
    }
    return this.props.children;
  }
}
```

### Toast Notifications
Use the project's toast system for user feedback:

```typescript
import { useToast } from "@/hooks/use-toast";

export function PayoutForm() {
  const { toast } = useToast();

  const handleSubmit = async () => {
    try {
      // Process payout
      toast({
        title: "Success",
        description: "Payout processed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process payout",
        variant: "destructive",
      });
    }
  };
}
```

---

## Performance Standards

### Code Splitting
Implement route-based code splitting:

```typescript
import { lazy, Suspense } from 'react';

const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));

<Suspense fallback={<div>Loading...</div>}>
  <AdminDashboard />
</Suspense>
```

### Bundle Size Optimization
- Use tree-shaking compatible imports
- Avoid importing entire libraries when only specific functions are needed
- Utilize Vite's automatic code splitting

---

## Testing Standards

### Component Testing Structure
```typescript
// __tests__/CarGuardDashboard.test.tsx
import { render, screen } from '@testing-library/react';
import { CarGuardDashboard } from '@/pages/car-guard/CarGuardDashboard';

describe('CarGuardDashboard', () => {
  it('displays guard balance correctly', () => {
    render(<CarGuardDashboard />);
    expect(screen.getByText(/balance/i)).toBeInTheDocument();
  });
});
```

### Mock Data Testing
Use the centralized mock data for consistent testing:

```typescript
import { mockCarGuards, mockTips } from '@/data/mockData';

const testGuard = mockCarGuards[0];
const testTips = mockTips.filter(tip => tip.guardId === testGuard.id);
```

---

## Security Standards

### Input Validation
Always validate user inputs with Zod schemas:

```typescript
const payoutSchema = z.object({
  amount: z.number().min(1).max(10000),
  guardId: z.string().uuid(),
  voucherCode: z.string().min(6).max(20),
});
```

### Environment Variables
Store sensitive configuration in environment variables:

```typescript
// .env.local
VITE_API_BASE_URL=https://api.nogadacarguard.com
VITE_PAYMENT_PROVIDER_KEY=your-key-here
```

---

## Documentation Standards

### Component Documentation
Document complex components with JSDoc:

```typescript
/**
 * QR Code display component for car guards
 * @param guardId - Unique identifier for the car guard
 * @param size - QR code size in pixels (default: 200)
 * @param showLabel - Whether to show the guard ID label
 */
interface QRCodeDisplayProps {
  guardId: string;
  size?: number;
  showLabel?: boolean;
}

export function QRCodeDisplay({ guardId, size = 200, showLabel = true }: QRCodeDisplayProps) {
  // Component implementation
}
```

### README Updates
Keep the main README.md current with:
- Setup instructions
- Available scripts
- Environment requirements
- Portal-specific information

---

## Development Workflow

### Branch Naming
- `feature/portal-specific-feature`
- `bugfix/issue-description`
- `hotfix/critical-fix`

### Commit Message Format
```
feat(admin): add payout approval workflow
fix(car-guard): resolve QR code scanning issue
docs: update API documentation
style(customer): improve mobile responsive design
```

### Code Review Checklist
- [ ] TypeScript interfaces defined for new data structures
- [ ] Components follow the established naming conventions
- [ ] Tailwind classes use the tippa color palette
- [ ] Mobile responsiveness verified
- [ ] Error handling implemented
- [ ] Import paths use @/ alias
- [ ] Forms use React Hook Form + Zod validation

---

## Environment Configuration

### Development Server
```bash
# Start development server (port 8080, all interfaces)
npm run dev

# Server configuration in vite.config.ts
server: {
  host: "::",
  port: 8080,
}
```

### Build Commands
```bash
npm run build          # Production build
npm run build:dev      # Development build with dev optimizations
npm run lint           # ESLint with TypeScript support
npm run preview        # Preview production build
```

### ESLint Configuration
The project uses relaxed ESLint rules for rapid development:

```javascript
// eslint.config.js
rules: {
  "@typescript-eslint/no-unused-vars": "off",
  "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
}
```

---

## Conclusion

These development standards ensure consistency across the NogadaCarGuard multi-portal application. All team members should follow these conventions to maintain code quality and development velocity.

For questions about these standards, consult the senior development team or refer to the existing codebase for examples.

---

**Document Information:**
- **Version:** 1.0
- **Last Updated:** 2025-01-25
- **Maintainer:** Senior Development Team
- **Review Cycle:** Monthly
- **Related Documents:** 
  - `/wiki/developers/code-review.md`
  - `/wiki/developers/local-setup.md`
  - `/wiki/analysis/tech-stack.md`
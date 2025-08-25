# Best Practices Guide

This document outlines recommended approaches and standards for developing and maintaining the NogadaCarGuard application.

## Development Best Practices

### Code Organization and Architecture

#### Multi-Portal Structure
```
src/
├── components/
│   ├── admin/           # Admin-specific components
│   ├── car-guard/       # Car guard app components
│   ├── customer/        # Customer portal components
│   ├── shared/          # Cross-portal components
│   └── ui/              # shadcn/ui base components
├── pages/
│   ├── admin/           # Admin page components
│   ├── car-guard/       # Car guard pages
│   └── customer/        # Customer pages
└── data/                # Mock data and interfaces
```

**Best Practice**: Keep portal-specific code isolated while maximizing reuse of shared components and utilities.

#### Component Design Principles

**1. Single Responsibility**
```typescript
// Good: Focused component
const QRCodeDisplay = ({ guardId, amount }: QRCodeProps) => {
  return <QRCode value={`tip:${guardId}:${amount}`} />
}

// Avoid: Component doing too much
const GuardDashboard = () => {
  // Handles QR display, balance, history, profile...
}
```

**2. Proper Props Interface**
```typescript
interface ComponentProps {
  // Required props first
  id: string
  title: string
  // Optional props with defaults
  variant?: 'primary' | 'secondary'
  disabled?: boolean
  // Event handlers
  onSubmit?: (data: FormData) => void
}
```

**3. Forward Refs for UI Components**
```typescript
const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string }
>(({ className, variant = 'default', ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant }), className)}
      {...props}
    />
  )
})
```

### TypeScript Best Practices

#### Type Safety Guidelines
```typescript
// Define interfaces for all data structures
interface CarGuard {
  id: string
  name: string
  location: Location
  bankDetails?: BankDetails // Optional fields clearly marked
}

// Use discriminated unions for different states
type TransactionStatus = 'pending' | 'completed' | 'failed'
type Transaction = {
  id: string
  status: TransactionStatus
  amount: number
}

// Prefer type inference where possible
const guards = mockCarGuards.filter(guard => guard.isActive) // Type inferred
```

#### Handling Null/Undefined
```typescript
// Use optional chaining and nullish coalescing
const displayName = user?.profile?.displayName ?? 'Anonymous'

// Type guards for runtime checks
const isValidGuard = (guard: unknown): guard is CarGuard => {
  return typeof guard === 'object' && guard !== null && 'id' in guard
}
```

### React Patterns

#### State Management
```typescript
// Use React Query for server state
const { data: tips, isLoading } = useQuery({
  queryKey: ['tips', guardId],
  queryFn: () => getTipsByGuardId(guardId),
  staleTime: 5 * 60 * 1000, // 5 minutes
})

// Local state for UI state only
const [isModalOpen, setIsModalOpen] = useState(false)
const [formData, setFormData] = useState<FormData>({})
```

#### Custom Hooks
```typescript
// Extract reusable logic into custom hooks
const useGuardBalance = (guardId: string) => {
  return useQuery({
    queryKey: ['balance', guardId],
    queryFn: () => getGuardBalance(guardId),
    refetchInterval: 30000, // Refresh every 30 seconds
  })
}

// Use custom hooks for complex form logic
const useGuardForm = (initialData?: Partial<CarGuard>) => {
  const form = useForm<CarGuardFormData>({
    resolver: zodResolver(guardSchema),
    defaultValues: initialData,
  })
  
  return { form, handleSubmit: form.handleSubmit }
}
```

#### Error Boundaries
```typescript
class PortalErrorBoundary extends React.Component<
  { children: React.ReactNode; portalName: string },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Error in ${this.props.portalName}:`, error, errorInfo)
    // Log to error reporting service
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback portalName={this.props.portalName} />
    }

    return this.props.children
  }
}
```

### Form Handling Best Practices

#### React Hook Form + Zod Pattern
```typescript
const guardSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  location: z.string().min(1, 'Location is required'),
  bankAccount: z.string().regex(/^\d{10,12}$/, 'Invalid bank account number'),
})

type GuardFormData = z.infer<typeof guardSchema>

const GuardForm = () => {
  const form = useForm<GuardFormData>({
    resolver: zodResolver(guardSchema),
    defaultValues: {
      name: '',
      email: '',
      location: '',
      bankAccount: '',
    },
  })

  const onSubmit = async (data: GuardFormData) => {
    try {
      await createGuard(data)
      toast.success('Guard created successfully')
      form.reset()
    } catch (error) {
      toast.error('Failed to create guard')
    }
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

## Styling and UI Best Practices

### Tailwind CSS Guidelines

#### Component-First Approach
```typescript
// Create reusable component variants
const cardVariants = cva(
  'rounded-lg border bg-card text-card-foreground shadow-sm',
  {
    variants: {
      variant: {
        default: 'border-border',
        destructive: 'border-red-200 bg-red-50',
        success: 'border-green-200 bg-green-50',
      },
      size: {
        default: 'p-6',
        sm: 'p-4',
        lg: 'p-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)
```

#### Responsive Design
```typescript
// Mobile-first responsive classes
<div className="
  grid grid-cols-1 gap-4
  md:grid-cols-2 md:gap-6
  lg:grid-cols-3 lg:gap-8
">
  {/* Content */}
</div>

// Use custom breakpoints sparingly
<div className="
  w-full
  sm:w-auto sm:min-w-[200px]
  lg:w-64
">
```

#### Color Usage
```typescript
// Use semantic color tokens
<Button className="bg-primary text-primary-foreground hover:bg-primary/90">
  Primary Action
</Button>

// Use tippa palette for branding
<div className="bg-tippa-500 text-white">
  Brand Element
</div>
```

### shadcn/ui Component Usage

#### Consistent Component Usage
```typescript
// Always use the installed components
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Extend components properly
const LoadingButton = ({ loading, children, ...props }: LoadingButtonProps) => {
  return (
    <Button disabled={loading} {...props}>
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  )
}
```

#### Form Components
```typescript
// Use FormField pattern consistently
<FormField
  control={form.control}
  name="amount"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Tip Amount</FormLabel>
      <FormControl>
        <Input type="number" placeholder="0.00" {...field} />
      </FormControl>
      <FormDescription>
        Enter the amount you want to tip
      </FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>
```

## Data Management Best Practices

### Mock Data Structure
```typescript
// Maintain referential integrity
export const mockCarGuards: CarGuard[] = [
  {
    id: 'guard-1',
    locationId: 'loc-1', // Reference to location
    managerId: 'mgr-1',  // Reference to manager
    // ... other properties
  }
]

// Provide helper functions
export const getGuardsByLocation = (locationId: string): CarGuard[] => {
  return mockCarGuards.filter(guard => guard.locationId === locationId)
}
```

### Currency and Date Formatting
```typescript
// Use consistent formatting functions
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
  }).format(amount).replace('ZAR', 'R')
}

export const formatDateTime = (date: Date | string): string => {
  return format(new Date(date), 'dd MMM yyyy HH:mm')
}
```

### React Query Best Practices

#### Query Key Structure
```typescript
// Hierarchical query keys
const queryKeys = {
  guards: ['guards'] as const,
  guardList: (filters: GuardFilters) => ['guards', 'list', filters] as const,
  guard: (id: string) => ['guards', 'detail', id] as const,
  guardTips: (id: string) => ['guards', id, 'tips'] as const,
}

// Use in queries
const { data: guard } = useQuery({
  queryKey: queryKeys.guard(guardId),
  queryFn: () => getGuardById(guardId),
})
```

#### Mutation Patterns
```typescript
const createTipMutation = useMutation({
  mutationFn: createTip,
  onSuccess: (newTip) => {
    // Invalidate and refetch guard balance
    queryClient.invalidateQueries(['guards', newTip.guardId, 'balance'])
    
    // Optimistically update tips list
    queryClient.setQueryData(
      ['guards', newTip.guardId, 'tips'],
      (old: Tip[] = []) => [newTip, ...old]
    )
    
    toast.success('Tip sent successfully!')
  },
  onError: (error) => {
    toast.error('Failed to send tip')
    console.error('Tip creation failed:', error)
  },
})
```

## Performance Best Practices

### Component Optimization
```typescript
// Memoize expensive calculations
const expensiveValue = useMemo(() => {
  return complexCalculation(data)
}, [data])

// Memoize callback functions
const handleSubmit = useCallback((data: FormData) => {
  // Handle submission
}, [dependency])

// Memoize components that receive complex props
const ExpensiveComponent = React.memo(({ complexProp }) => {
  return <div>{/* Complex rendering */}</div>
}, (prevProps, nextProps) => {
  return JSON.stringify(prevProps) === JSON.stringify(nextProps)
})
```

### Code Splitting
```typescript
// Lazy load portal components
const CarGuardApp = lazy(() => import('./pages/car-guard/CarGuardApp'))
const CustomerApp = lazy(() => import('./pages/customer/CustomerApp'))
const AdminApp = lazy(() => import('./pages/admin/AdminApp'))

// Use in router with Suspense
<Route
  path="/car-guard/*"
  element={
    <Suspense fallback={<LoadingSpinner />}>
      <CarGuardApp />
    </Suspense>
  }
/>
```

### Bundle Optimization
```typescript
// Dynamic imports for large libraries
const loadChartLibrary = async () => {
  const { Chart } = await import('chart.js')
  return Chart
}

// Tree-shaking friendly imports
import { format, parseISO } from 'date-fns'
// Instead of: import * as dateFns from 'date-fns'
```

## Security Best Practices

### Input Validation
```typescript
// Always validate on both client and server
const tipSchema = z.object({
  amount: z.number().min(0.01).max(10000),
  guardId: z.string().uuid(),
  message: z.string().max(500).optional(),
})

// Sanitize user inputs
const sanitizedMessage = DOMPurify.sanitize(userInput)
```

### Authentication
```typescript
// Store tokens securely
const authToken = localStorage.getItem('auth_token')
if (authToken) {
  // Validate token before use
  const isValid = await validateToken(authToken)
  if (!isValid) {
    localStorage.removeItem('auth_token')
    redirectToLogin()
  }
}

// Implement proper logout
const logout = () => {
  localStorage.removeItem('auth_token')
  queryClient.clear() // Clear cached data
  navigate('/login')
}
```

### Data Protection
```typescript
// Don't log sensitive information
const logTransaction = (transaction: Transaction) => {
  console.log('Transaction created:', {
    id: transaction.id,
    type: transaction.type,
    timestamp: transaction.timestamp,
    // Don't log: amount, account details, personal info
  })
}

// Mask sensitive data in UI
const maskAccountNumber = (account: string) => {
  return account.replace(/(\d{4})\d+(\d{4})/, '$1****$2')
}
```

## Testing Best Practices

### Component Testing
```typescript
// Test component behavior, not implementation
describe('TipForm', () => {
  it('should submit valid tip data', async () => {
    const mockSubmit = vi.fn()
    render(<TipForm onSubmit={mockSubmit} />)
    
    await user.type(screen.getByLabelText(/amount/i), '10.50')
    await user.click(screen.getByRole('button', { name: /send tip/i }))
    
    expect(mockSubmit).toHaveBeenCalledWith({
      amount: 10.50,
      // ... other expected data
    })
  })
})
```

### Integration Testing
```typescript
// Test portal integration
describe('CarGuard Portal Integration', () => {
  it('should display guard dashboard after login', async () => {
    render(<CarGuardApp />)
    
    // Mock successful login
    mockLoginApi.mockResolvedValueOnce({ user: mockGuard })
    
    await user.type(screen.getByLabelText(/phone/i), '0123456789')
    await user.type(screen.getByLabelText(/pin/i), '1234')
    await user.click(screen.getByRole('button', { name: /login/i }))
    
    expect(await screen.findByText(/dashboard/i)).toBeInTheDocument()
  })
})
```

## Accessibility Best Practices

### Semantic HTML
```typescript
// Use proper heading hierarchy
<main>
  <h1>Car Guard Dashboard</h1>
  <section>
    <h2>Recent Tips</h2>
    <h3>Today's Earnings</h3>
  </section>
</main>

// Use semantic elements
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/dashboard">Dashboard</a></li>
    <li><a href="/history">History</a></li>
  </ul>
</nav>
```

### ARIA Labels
```typescript
// Descriptive labels
<Button
  aria-label={`Delete tip of ${formatCurrency(tip.amount)}`}
  onClick={() => deleteTip(tip.id)}
>
  <TrashIcon />
</Button>

// Live regions for dynamic content
<div aria-live="polite" aria-atomic="true">
  {notification && <p>{notification}</p>}
</div>
```

### Keyboard Navigation
```typescript
// Ensure focusable elements
<div
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick()
    }
  }}
  onClick={handleClick}
>
  Custom Button
</div>
```

## Documentation Best Practices

### Code Documentation
```typescript
/**
 * Formats a currency amount for display in the South African context
 * @param amount - The numeric amount to format
 * @param options - Optional formatting configuration
 * @returns Formatted currency string (e.g., "R 123.45")
 */
export const formatCurrency = (
  amount: number,
  options: CurrencyOptions = {}
): string => {
  // Implementation
}
```

### Component Documentation
```typescript
/**
 * QRCodeDisplay Component
 * 
 * Displays a QR code for tipping a specific car guard
 * 
 * @example
 * ```tsx
 * <QRCodeDisplay 
 *   guardId="guard-123" 
 *   amount={25.00}
 *   size={256}
 * />
 * ```
 */
interface QRCodeDisplayProps {
  /** Unique identifier for the car guard */
  guardId: string
  /** Tip amount to encode in QR code */
  amount: number
  /** Size of QR code in pixels (default: 200) */
  size?: number
}
```

### README and Setup Documentation
```markdown
## Quick Start

1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. Open http://localhost:8080

## Portal Access
- Car Guard: http://localhost:8080/car-guard
- Customer: http://localhost:8080/customer  
- Admin: http://localhost:8080/admin
```

## Monitoring and Logging

### Error Tracking
```typescript
// Structured error logging
const logError = (error: Error, context: Record<string, any>) => {
  console.error('Application Error:', {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    portal: context.portal,
    userId: context.userId,
    action: context.action,
  })
  
  // Send to error tracking service
  if (import.meta.env.PROD) {
    errorTrackingService.captureException(error, context)
  }
}
```

### Performance Monitoring
```typescript
// Track component render times
const usePerformanceMonitor = (componentName: string) => {
  useEffect(() => {
    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      if (renderTime > 100) { // Log slow renders
        console.warn(`Slow render: ${componentName} took ${renderTime}ms`)
      }
    }
  })
}
```

---

**Stakeholder Relevance:**
- **Developers**: Core development guidelines and patterns
- **Tech Leads**: Architecture decisions and code review standards
- **DevOps**: Performance and monitoring guidelines
- **QA**: Testing patterns and quality standards

**Document Information:**
- **Version**: 1.0
- **Last Updated**: August 2025
- **Next Review**: November 2025
- **Owner**: Development Team
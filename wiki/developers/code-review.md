# Code Review Process and Checklist

## Overview

This document establishes the code review process and standards for the **NogadaCarGuard** multi-portal tipping application. Code reviews ensure quality, consistency, and knowledge sharing across the three-portal system (Car Guard App, Customer Portal, and Admin Application).

**Stakeholder Relevance:** 🛠️ Senior Dev, 👨‍💻 Frontend Dev, 🌐 Full-Stack Dev, 📊 Project Manager, 🏗️ DevOps Engineer

---

## Code Review Process

### 1. Pre-Review Requirements

Before submitting a pull request for review:

#### Branch Preparation
```bash
# Ensure you're on the latest main branch
git checkout main
git pull origin main

# Create feature branch with descriptive name
git checkout -b feature/car-guard-enhanced-qr-display
git checkout -b bugfix/customer-tip-validation
git checkout -b hotfix/admin-dashboard-loading
```

#### Code Quality Checks
```bash
# Run linting (must pass)
npm run lint

# Build successfully (must complete)
npm run build

# Verify all portals work in development
npm run dev
# Test: http://localhost:8080/ (App Selector)
# Test: http://localhost:8080/car-guard (Car Guard App) 
# Test: http://localhost:8080/customer (Customer Portal)
# Test: http://localhost:8080/admin (Admin Application)
```

#### Commit Standards
```bash
# Use conventional commit format
git commit -m "feat(car-guard): add enhanced QR code with custom styling"
git commit -m "fix(customer): resolve tip validation for decimal amounts"  
git commit -m "refactor(admin): improve dashboard component structure"
git commit -m "docs: update API documentation for payout endpoints"
git commit -m "style(shared): apply tippa color palette to shared components"
```

### 2. Pull Request Creation

#### PR Title Format
```
[Portal] Brief Description

Examples:
[Car Guard] Enhanced QR code display with custom styling
[Customer] Fix tip validation for decimal amounts
[Admin] Improve dashboard loading performance  
[Shared] Update tippa color palette implementation
[Multi-Portal] Add responsive navigation improvements
```

#### PR Description Template

```markdown
## Summary
Brief description of changes and motivation.

## Portal(s) Affected
- [ ] Car Guard App (`/car-guard/*`)
- [ ] Customer Portal (`/customer/*`)
- [ ] Admin Application (`/admin/*`)  
- [ ] Shared Components (`/shared/*`)
- [ ] Infrastructure/Build

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Refactoring (no functional changes)

## Changes Made
- List specific changes
- Include component/file modifications
- Note any new dependencies

## Testing
- [ ] Tested in development environment
- [ ] Verified all affected portals work correctly
- [ ] Tested responsive design (mobile/desktop)
- [ ] Tested with mock data scenarios
- [ ] Browser testing (Chrome, Safari, Firefox)

## Screenshots/Videos
Include screenshots for UI changes, especially mobile views.

## Breaking Changes
List any breaking changes and migration steps.

## Related Issues
Closes #123
Fixes #456
```

### 3. Review Assignment

#### Automatic Assignment Rules
- **Car Guard App changes**: Frontend developers + Senior developer
- **Customer Portal changes**: Frontend developers + UX reviewer  
- **Admin Application changes**: Full-stack developers + Senior developer
- **Shared Components**: All frontend developers
- **Infrastructure/Build**: DevOps engineer + Senior developer
- **Documentation**: Technical writer + relevant developers

#### Manual Assignment
- Assign specific team members with domain expertise
- Include at least one senior developer for complex changes
- Add security reviewer for authentication/payment related changes

---

## Code Review Checklist

### General Code Quality

#### ✅ Code Structure & Organization
- [ ] Code follows established directory structure (`src/components/[portal]/`, `src/pages/[portal]/`)
- [ ] Components are properly organized by portal (admin, car-guard, customer, shared)
- [ ] File naming follows PascalCase convention for components
- [ ] Import statements use `@/` path alias instead of relative paths
- [ ] Components have clear, descriptive names

```typescript
// ✅ Good
import { Button } from '@/components/ui/button';
import { CarGuardDashboard } from '@/pages/car-guard/CarGuardDashboard';

// ❌ Bad  
import { Button } from '../../../components/ui/button';
import { Dashboard } from './Dashboard'; // Not descriptive enough
```

#### ✅ TypeScript Implementation
- [ ] All new interfaces defined with proper TypeScript types
- [ ] Component props have defined interfaces
- [ ] Mock data interfaces match actual usage patterns
- [ ] No TypeScript errors (run `npx tsc --noEmit`)
- [ ] Proper use of optional (`?`) and required properties

```typescript
// ✅ Good
interface CarGuardHeaderProps {
  guardName: string;
  balance: number;
  onPayoutRequest?: () => void;
}

// ❌ Bad
interface Props {
  data: any; // Avoid any type
  callback: Function; // Use specific function signature
}
```

### React Component Standards

#### ✅ Component Implementation
- [ ] Uses functional components with hooks (no class components)
- [ ] Proper useState and useEffect implementation
- [ ] Custom hooks used for reusable logic
- [ ] Component follows single responsibility principle
- [ ] Proper error boundaries implemented where needed

```typescript
// ✅ Good functional component
export function CarGuardBalance({ guardId }: { guardId: string }) {
  const [balance, setBalance] = useState<number>(0);
  
  useEffect(() => {
    const guard = mockCarGuards.find(g => g.id === guardId);
    setBalance(guard?.balance || 0);
  }, [guardId]);

  return (
    <div className="text-2xl font-bold text-tippa-dark">
      {formatCurrency(balance)}
    </div>
  );
}
```

#### ✅ Hook Usage
- [ ] Custom hooks follow `use` prefix convention
- [ ] Hooks used at top level (not inside loops or conditions)
- [ ] useEffect dependencies are properly specified
- [ ] Custom hooks extracted for reusable logic

```typescript
// ✅ Good custom hook
export function useGuardBalance(guardId: string) {
  const [balance, setBalance] = useState(0);
  
  useEffect(() => {
    const guard = mockCarGuards.find(g => g.id === guardId);
    setBalance(guard?.balance || 0);
  }, [guardId]);
  
  return balance;
}
```

### Styling and UI Standards

#### ✅ Tailwind CSS Implementation
- [ ] Uses tippa color palette for brand consistency
- [ ] Responsive design implemented (mobile-first approach)
- [ ] Consistent spacing and typography
- [ ] No custom CSS unless absolutely necessary
- [ ] shadcn/ui components used appropriately

```typescript
// ✅ Good Tailwind usage with tippa colors
<div className="bg-tippa-light min-h-screen p-4">
  <Card className="max-w-md mx-auto">
    <CardHeader className="bg-tippa-primary">
      <CardTitle className="text-tippa-dark text-xl">
        Car Guard Dashboard
      </CardTitle>
    </CardHeader>
    <CardContent className="p-6">
      <Button className="w-full bg-tippa-secondary hover:bg-tippa-accent text-white">
        Request Payout
      </Button>
    </CardContent>
  </Card>
</div>
```

#### ✅ Responsive Design
- [ ] Mobile-first responsive implementation
- [ ] Tested on multiple screen sizes
- [ ] Car Guard App optimized for mobile devices
- [ ] Customer Portal works on both mobile and desktop
- [ ] Admin Application optimized for desktop with mobile support

```typescript
// ✅ Good responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
  <Card className="w-full">
    <CardContent className="p-4 md:p-6">
      <h3 className="text-lg md:text-xl font-semibold">
        Mobile responsive title
      </h3>
    </CardContent>
  </Card>
</div>
```

### Portal-Specific Checks

#### ✅ Car Guard App Specific
- [ ] Mobile-optimized UI (touch-friendly buttons, readable text)
- [ ] QR code display functionality works correctly
- [ ] Bottom navigation properly implemented
- [ ] Balance display uses formatCurrency helper
- [ ] Payout thresholds properly validated

```typescript
// ✅ Car Guard specific validation
const canRequestPayout = guard.balance >= guard.minPayoutThreshold;

<Button 
  disabled={!canRequestPayout}
  className="w-full py-4 text-lg bg-tippa-primary text-tippa-dark"
>
  {canRequestPayout 
    ? `Request Payout (${formatCurrency(guard.balance)})` 
    : `Minimum ${formatCurrency(guard.minPayoutThreshold)} required`
  }
</Button>
```

#### ✅ Customer Portal Specific  
- [ ] Tip amount validation implemented correctly
- [ ] Customer wallet balance checked before tipping
- [ ] QR code scanning interface (future implementation ready)
- [ ] Transaction history properly displayed
- [ ] Registration and login flows complete

#### ✅ Admin Application Specific
- [ ] Dashboard analytics display correctly
- [ ] Data filtering and sorting functionality
- [ ] Bulk operations properly implemented
- [ ] Export functionality (when present)
- [ ] Proper permission checks (future implementation)
- [ ] Sidebar navigation works across all admin routes

### Data and API Integration

#### ✅ Mock Data Usage
- [ ] Uses centralized mock data from `src/data/mockData.ts`
- [ ] Helper functions used for data queries (`getTipsByGuardId`, etc.)
- [ ] Currency formatting uses `formatCurrency()` helper
- [ ] Date formatting uses `formatDate()`, `formatTime()` helpers
- [ ] No hardcoded data in components

```typescript
// ✅ Good mock data usage
import { getTipsByGuardId, formatCurrency, formatDateTime } from '@/data/mockData';

export function TipHistory({ guardId }: { guardId: string }) {
  const tips = getTipsByGuardId(guardId);
  
  return (
    <div className="space-y-2">
      {tips.map(tip => (
        <div key={tip.id} className="flex justify-between">
          <span>{formatDateTime(tip.timestamp)}</span>
          <span className="font-bold text-tippa-dark">
            {formatCurrency(tip.amount)}
          </span>
        </div>
      ))}
    </div>
  );
}
```

#### ✅ Form Handling
- [ ] React Hook Form used for form management
- [ ] Zod validation schemas implemented
- [ ] Proper error handling and display
- [ ] Loading states implemented
- [ ] Success/failure feedback provided

```typescript
// ✅ Good form implementation
const formSchema = z.object({
  amount: z.number().min(1, "Minimum tip is R 1.00").max(1000),
  guardId: z.string().min(1, "Guard ID is required"),
});

export function TipForm() {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // Process tip logic
      toast({ title: "Success", description: "Tip sent successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to send tip", variant: "destructive" });
    }
  };

  return <Form {...form}>...</Form>;
}
```

### Performance and Optimization

#### ✅ Performance Considerations
- [ ] No unnecessary re-renders (use React.memo if needed)
- [ ] Proper useEffect dependency arrays
- [ ] Large lists virtualized (if applicable)
- [ ] Images optimized and properly sized
- [ ] Bundle size impact considered for new dependencies

#### ✅ Code Organization
- [ ] Components are reasonably sized (< 200 lines ideally)
- [ ] Complex logic extracted to custom hooks
- [ ] Reusable components moved to appropriate shared folders
- [ ] No code duplication across portals

### Security and Validation

#### ✅ Input Validation
- [ ] All user inputs validated with Zod schemas
- [ ] Numeric inputs have proper min/max constraints
- [ ] String inputs sanitized appropriately
- [ ] File uploads (if any) properly validated

#### ✅ Error Handling
- [ ] Try-catch blocks around async operations
- [ ] User-friendly error messages
- [ ] Toast notifications for success/failure states
- [ ] No sensitive information exposed in error messages

### Testing and Quality Assurance

#### ✅ Manual Testing Required
- [ ] All affected portals tested in development mode
- [ ] Mobile responsiveness verified
- [ ] Browser compatibility tested (Chrome, Safari, Firefox)
- [ ] Error scenarios tested (network failures, invalid inputs)
- [ ] Loading states verified

#### ✅ Cross-Portal Impact
- [ ] Shared component changes tested across all portals
- [ ] No breaking changes to existing functionality
- [ ] Consistent behavior across portals
- [ ] No regression in other portal features

---

## Review Workflow

### 1. Initial Review (24-48 hours)

#### First Pass Checklist
- [ ] PR description complete and accurate
- [ ] Code builds successfully
- [ ] No obvious issues with structure or logic
- [ ] Follows established patterns and conventions

#### Reviewer Actions
```markdown
**Review Status**: Initial Review Complete

**Summary**: Code structure looks good, found minor issues with responsive design.

**Required Changes**:
- Fix mobile button sizing in CarGuardDashboard
- Add proper TypeScript interface for new props
- Use tippa-primary instead of hardcoded color

**Optional Suggestions**:
- Consider extracting balance logic to custom hook
- Add loading state for better UX

**Approval**: ❌ Requested Changes | ⏳ Pending Changes | ✅ Approved
```

### 2. Follow-up Review (Same Day)

#### After Changes Made
- [ ] All requested changes addressed
- [ ] New commits follow commit message standards
- [ ] Re-test functionality after changes
- [ ] Verify no new issues introduced

#### Final Approval Process
```markdown
**Review Status**: Final Approval

**Changes Verified**: All requested changes have been implemented correctly.

**Testing**: Retested in development environment, mobile responsiveness confirmed.

**Approval**: ✅ Approved for merge
```

### 3. Merge Process

#### Pre-Merge Verification
- [ ] All reviewers have approved
- [ ] CI/CD pipeline passes (when implemented)
- [ ] No merge conflicts with main branch
- [ ] Final manual testing complete

#### Merge Strategy
```bash
# Use squash and merge for feature branches
git checkout main
git merge --squash feature/car-guard-enhanced-qr-display
git commit -m "feat(car-guard): add enhanced QR code with custom styling

- Implement custom QR code styling with tippa colors
- Add responsive design for mobile and desktop
- Include error handling for invalid guard IDs
- Update mock data helper functions"

git push origin main
```

---

## Common Review Issues

### Frequently Found Problems

#### 1. Import Path Issues
```typescript
// ❌ Common mistake - relative imports
import { Button } from '../../../components/ui/button';

// ✅ Correct - use path alias  
import { Button } from '@/components/ui/button';
```

#### 2. Color Usage Issues
```typescript
// ❌ Wrong - hardcoded colors
<div className="bg-blue-500 text-white">

// ✅ Correct - tippa palette
<div className="bg-tippa-primary text-tippa-dark">
```

#### 3. Responsive Design Issues
```typescript
// ❌ Wrong - not mobile-first
<div className="text-xl md:text-base lg:text-lg">

// ✅ Correct - mobile-first approach  
<div className="text-base md:text-lg lg:text-xl">
```

#### 4. TypeScript Issues
```typescript
// ❌ Wrong - using any type
function processData(data: any) {

// ✅ Correct - proper typing
interface ProcessDataParams {
  guardId: string;
  amount: number;
}
function processData(data: ProcessDataParams) {
```

### Review Feedback Templates

#### Requesting Changes
```markdown
## Review Feedback

**Overall**: The implementation looks good but needs some adjustments before approval.

### Required Changes:
1. **Mobile Responsiveness**: The button sizes need adjustment for mobile devices
   ```typescript
   // Current:
   <Button className="px-4 py-2">
   
   // Suggested:
   <Button className="px-4 py-3 md:py-2 w-full md:w-auto">
   ```

2. **TypeScript Interface**: Add proper interface for component props
   ```typescript
   interface CarGuardBalanceProps {
     guardId: string;
     showPayoutButton?: boolean;
   }
   ```

3. **Color Palette**: Replace hardcoded colors with tippa palette

### Optional Suggestions:
- Consider extracting the balance calculation logic to a custom hook
- Add loading state for better user experience

Please address the required changes and I'll review again promptly.
```

#### Approving Changes
```markdown
## Review Approval ✅

**Summary**: Excellent implementation of the enhanced QR code feature!

**Highlights**:
- Clean code structure following our standards
- Proper mobile responsiveness
- Good use of tippa color palette
- Comprehensive error handling

**Testing**: Verified functionality across all screen sizes and browsers.

Approved for merge! 🚀
```

---

## Review Metrics and Goals

### Target Metrics
- **Review Response Time**: < 24 hours for initial review
- **Approval Time**: < 48 hours total
- **Revision Cycles**: < 3 rounds per PR
- **Bug Escape Rate**: < 5% of reviewed code has post-merge issues

### Quality Goals
- **Code Coverage**: Maintain consistent component structure
- **Performance**: No degradation in build times
- **Consistency**: 100% adherence to coding standards
- **Documentation**: All complex components documented

---

## Escalation Process

### When to Escalate

1. **Technical Disagreements**: Reviewers disagree on implementation approach
2. **Complex Changes**: Large refactoring or architectural changes
3. **Security Concerns**: Potential security vulnerabilities identified
4. **Performance Issues**: Changes that significantly impact performance

### Escalation Path

1. **Senior Developer**: Technical guidance and decision making
2. **Technical Lead**: Architectural decisions and complex trade-offs
3. **Project Manager**: Timeline and resource allocation concerns
4. **Security Team**: Security-related concerns

---

## Tools and Resources

### Required Tools
- **GitHub/Azure DevOps**: PR management and reviews
- **VS Code**: Recommended IDE with extensions
- **Browser DevTools**: Testing and debugging
- **Mobile Device/Emulator**: Mobile responsiveness testing

### Review Resources
- **Development Standards**: `/wiki/developers/development-standards.md`
- **API Documentation**: `/wiki/developers/api-documentation.md`
- **Project Overview**: `/CLAUDE.md`
- **Mock Data Reference**: `/src/data/mockData.ts`

---

## Conclusion

This code review process ensures high-quality, consistent code across the NogadaCarGuard multi-portal application. Following this process will:

- Maintain code quality and consistency
- Prevent bugs from reaching production  
- Share knowledge across the team
- Ensure compliance with project standards
- Improve overall development velocity

All team members should follow this process for every code change, regardless of size or complexity.

---

**Document Information:**
- **Version:** 1.0
- **Last Updated:** 2025-01-25
- **Maintainer:** Senior Development Team
- **Review Cycle:** Monthly or as needed for process improvements
- **Related Documents:** 
  - `/wiki/developers/development-standards.md`
  - `/wiki/developers/local-setup.md`
  - `/wiki/workflows/development-workflow.md`
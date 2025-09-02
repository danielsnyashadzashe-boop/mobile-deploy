# Troubleshooting Guide

This document provides solutions to common issues encountered in the NogadaCarGuard application development and deployment.

## Development Environment Issues

### Vite Development Server Issues

**Problem**: Development server fails to start or bind to network interfaces
```bash
Error: listen EADDRINUSE: address already in use :::8080
```

**Solution**:
```bash
# Check what's using port 8080
netstat -ano | findstr :8080
# Kill the process using the port
taskkill /PID <process_id> /F
# Or use a different port
npm run dev -- --port 3000
```

**Problem**: Hot Module Replacement (HMR) not working
**Solution**:
1. Check if the Vite config has correct HMR settings
2. Ensure file watchers aren't exceeded (increase if needed)
3. Clear browser cache and restart dev server
4. For WSL users, add `server: { watch: { usePolling: true } }` to vite.config.ts

### TypeScript Compilation Issues

**Problem**: TypeScript errors not being caught in development
**Solution**:
1. Check tsconfig.json - note that `noImplicitAny: false` and `strictNullChecks: false` are intentionally relaxed
2. Run type checking manually: `npx tsc --noEmit`
3. Enable strict mode gradually for better type safety

**Problem**: Path alias (@/) not resolving
**Solution**:
1. Verify tsconfig.json has correct paths configuration
2. Check vite.config.ts has matching alias configuration
3. Restart TypeScript service in IDE

### React Query (TanStack Query) Issues

**Problem**: Queries not invalidating properly
**Solution**:
```typescript
// Ensure query keys are consistent
const queryClient = useQueryClient()
queryClient.invalidateQueries(['tips', guardId])
```

**Problem**: Stale data showing in different portals
**Solution**:
1. Use proper query key structure: `['entity', 'action', ...params]`
2. Invalidate related queries when mutations occur
3. Check cache configuration in QueryClient setup

## Multi-Portal Architecture Issues

### Routing Problems

**Problem**: Wrong portal loading or routes conflicting
**Solution**:
1. Check route definitions in main routing setup
2. Ensure each portal's routes are properly nested under their base path
3. Verify React Router Outlet components are correctly placed
4. Clear browser history/cache if routes seem cached

**Problem**: Navigation between portals not working
**Solution**:
1. Use proper navigation paths: `/car-guard/`, `/customer/`, `/admin/`
2. Ensure AppSelector component links are correct
3. Check for any route guards that might be preventing navigation

### Component Isolation Issues

**Problem**: Styles bleeding between portals
**Solution**:
1. Use CSS-in-JS or scoped classes for portal-specific styles
2. Check Tailwind CSS classes for specificity conflicts
3. Ensure portal-specific components are properly organized

**Problem**: State sharing between portals when it shouldn't
**Solution**:
1. Check React Query cache keys for uniqueness
2. Ensure localStorage/sessionStorage keys are portal-specific
3. Use proper component boundaries

## shadcn/ui Component Issues

### Component Import Problems

**Problem**: shadcn/ui component not found
**Solution**:
```bash
# Check if component is installed
ls src/components/ui/
# Install missing component
npx shadcn-ui@latest add button
```

**Problem**: Component styles not applying
**Solution**:
1. Check if Tailwind CSS is properly configured
2. Verify component dependencies are installed
3. Ensure CSS imports are in correct order

### Form Component Issues

**Problem**: React Hook Form validation not working with shadcn/ui
**Solution**:
```typescript
// Ensure proper form field forwarding
const FormField = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return <input ref={ref} className={cn("...", className)} {...props} />
})
```

## Tailwind CSS Issues

### Custom Theme Problems

**Problem**: Tippa color palette not applying
**Solution**:
1. Check tailwind.config.js for correct color definitions
2. Verify CSS variables are defined in globals.css
3. Restart development server after config changes

**Problem**: Responsive design not working
**Solution**:
1. Check breakpoint usage: `sm:`, `md:`, `lg:`, `xl:`
2. Verify mobile-first approach is being followed
3. Test in browser dev tools with device simulation

## Data and State Management Issues

### Mock Data Problems

**Problem**: Mock data not loading or inconsistent
**Solution**:
1. Check `src/data/mockData.ts` for data integrity
2. Verify helper functions are returning expected data
3. Ensure relationships between entities are maintained

**Problem**: Currency formatting issues
**Solution**:
```typescript
// Use the provided formatCurrency helper
import { formatCurrency } from '@/data/mockData'
const formatted = formatCurrency(amount) // Returns R X.XX format
```

## Performance Issues

### Build Performance

**Problem**: Slow build times
**Solution**:
1. Check if SWC is properly configured in Vite
2. Review bundle size with `npm run build` and analyze
3. Consider code splitting for large components

**Problem**: Large bundle size
**Solution**:
1. Use dynamic imports for portal-specific code
2. Check for duplicate dependencies
3. Analyze with bundle analyzer tools

### Runtime Performance

**Problem**: Slow component rendering
**Solution**:
1. Use React.memo for expensive components
2. Optimize re-renders with useCallback/useMemo
3. Check for unnecessary effect dependencies

## QR Code Issues

**Problem**: QR codes not generating properly
**Solution**:
1. Check react-qr-code component props
2. Verify QR code data format is correct
3. Ensure proper error correction level is set

**Problem**: QR codes not scanning on mobile
**Solution**:
1. Increase QR code size for better readability
2. Check contrast and background colors
3. Test with different QR code scanning apps

## Chart and Data Visualization Issues

**Problem**: Recharts not rendering
**Solution**:
1. Check data format matches chart expectations
2. Ensure proper width/height are set
3. Verify responsive container is used

**Problem**: Charts not responsive
**Solution**:
```typescript
import { ResponsiveContainer } from 'recharts'
<ResponsiveContainer width="100%" height={400}>
  {/* Chart component */}
</ResponsiveContainer>
```

## Database Connection Issues (Future Implementation)

### Connection Problems

**Problem**: Database connection timeouts
**Solution**:
1. Check connection string configuration
2. Verify database server is accessible
3. Check firewall settings
4. Review connection pool settings

**Problem**: Query performance issues
**Solution**:
1. Add appropriate database indexes
2. Optimize complex queries
3. Implement query result caching
4. Use database query analysis tools

## Security Issues

### Authentication Problems

**Problem**: Login not persisting across sessions
**Solution**:
1. Check token storage implementation
2. Verify token refresh logic
3. Ensure secure cookie settings

**Problem**: CORS issues with API calls
**Solution**:
1. Configure proper CORS headers on backend
2. Check API endpoint configurations
3. Verify allowed origins list

## Mobile-Specific Issues

### Responsive Design Problems

**Problem**: Layout breaking on mobile devices
**Solution**:
1. Test with browser dev tools mobile simulation
2. Check touch targets are minimum 44px
3. Verify viewport meta tag is set

**Problem**: Touch interactions not working
**Solution**:
1. Ensure proper touch event handlers
2. Check for hover states that don't work on mobile
3. Test on actual devices, not just simulators

## Common Error Messages

### `Module not found` errors
- Check import paths use `@/` alias correctly
- Verify file extensions in imports
- Ensure components are exported properly

### `Cannot read property of undefined`
- Add proper type checking and default values
- Use optional chaining (`?.`) for nested properties
- Check if data is loaded before accessing

### `Hook called outside of component`
- Ensure hooks are only called at component top level
- Check custom hooks follow hooks rules
- Verify hook dependencies are correct

## Logging and Debugging

### Enable Debug Logging
```typescript
// In development
if (import.meta.env.DEV) {
  console.log('Debug info:', data)
}
```

### React Query Devtools
```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

// Add to app root in development
{import.meta.env.DEV && <ReactQueryDevtools />}
```

### Browser DevTools Tips
1. Use React Developer Tools extension
2. Enable "Preserve log" for network debugging
3. Use Performance tab for rendering issues
4. Check Application tab for storage issues

## Getting Help

### Internal Resources
1. Check existing code patterns in similar components
2. Review mockData.ts for data structure examples
3. Consult component documentation in shadcn/ui

### External Resources
1. Vite documentation: https://vitejs.dev/
2. React Query documentation: https://tanstack.com/query/
3. shadcn/ui documentation: https://ui.shadcn.com/
4. Tailwind CSS documentation: https://tailwindcss.com/

---

**Stakeholder Relevance:**
- **Developers**: Primary troubleshooting reference
- **DevOps**: Deployment and environment issues
- **QA/Testing**: Known issues and testing guidance
- **Support**: Common user-reported issues

**Document Information:**
- **Version**: 1.0
- **Last Updated**: August 2025
- **Next Review**: October 2025
- **Owner**: Development Team
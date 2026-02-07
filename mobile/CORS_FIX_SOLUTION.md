# CORS Fix Solution for Flash API Integration

## Problem Summary

The React Native mobile app was experiencing CORS (Cross-Origin Resource Sharing) errors when running in web development mode (localhost:8081) and trying to access the Flash API at `https://api-flashswitch-sandbox.flash-group.com`. This resulted in cascading authentication and network errors.

## Root Cause

1. **CORS Policy Violation**: The Flash API server doesn't include `Access-Control-Allow-Origin` headers allowing requests from `localhost:8081`
2. **Web Browser Enforcement**: When React Native runs in web mode, browsers enforce CORS policy
3. **Network Error Cascade**: CORS blocks led to authentication failures and API request failures

## Solution Overview

Implemented a comprehensive solution with multiple improvements:

### 1. Development Proxy for CORS (🚀 **Primary Fix**)
- **File**: `metro.config.web.js`
- **Solution**: Custom Metro configuration with proxy middleware for web development
- **How it works**: Intercepts API requests to `/api/flash/*` and forwards them to the Flash API with proper CORS headers

### 2. Environment-Specific Configuration
- **File**: `services/flash/utils/environment.ts`
- **Features**:
  - Automatic platform detection (web vs mobile)
  - Environment-based API URL routing
  - Enhanced logging configuration
  - Request timeout management

### 3. Advanced Retry Logic with Exponential Backoff
- **File**: `services/flash/utils/retryHelper.ts`
- **Features**:
  - Exponential backoff with jitter
  - Smart retry conditions (don't retry 4xx errors except 429)
  - Circuit breaker pattern to prevent cascading failures
  - Configurable retry parameters per environment

### 4. Enhanced API Service
- **Files**: `services/flash/api/baseApi.ts`, `services/flash/auth/authService.ts`
- **Improvements**:
  - Environment-aware base URL configuration
  - Integrated retry logic with circuit breaker
  - Enhanced error handling and logging
  - Better timeout management

## Technical Implementation

### Metro Proxy Configuration

```javascript
// metro.config.web.js
if (req.url.startsWith('/api/flash/')) {
  const proxy = createProxyMiddleware({
    target: 'https://api-flashswitch-sandbox.flash-group.com',
    changeOrigin: true,
    pathRewrite: {
      '^/api/flash': '', // Remove /api/flash prefix
    },
  });
  return proxy(req, res, next);
}
```

### Environment-Based URL Routing

```typescript
// In web development: /api/flash (goes through proxy)
// In mobile/production: https://api-flashswitch-sandbox.flash-group.com (direct)
export function getApiBaseUrl(): string {
  const env = getCurrentEnvironment();
  const isWeb = Platform.OS === 'web';

  if (env === 'development' && isWeb) {
    return '/api/flash'; // Use proxy
  }
  return FLASH_ENVIRONMENTS.sandbox.baseUrl; // Direct API
}
```

### Retry Logic with Circuit Breaker

```typescript
// Exponential backoff with jitter
return await withRetry(makeRequestFn, {
  maxAttempts: envConfig.maxRetries,
  initialDelay: envConfig.retryDelay,
  shouldRetry: (error) => this.isRetryableError(error),
});
```

## Files Modified/Created

### New Files
- ✅ `metro.config.web.js` - Proxy configuration for web development
- ✅ `services/flash/utils/environment.ts` - Environment detection and configuration
- ✅ `services/flash/utils/retryHelper.ts` - Advanced retry logic and circuit breaker

### Modified Files
- ✅ `services/flash/api/baseApi.ts` - Updated to use environment config and retry logic
- ✅ `services/flash/auth/authService.ts` - Updated authentication service with better error handling
- ✅ `package.json` - Added `http-proxy-middleware` development dependency

## Installation Requirements

```bash
# Already installed
npm install --save-dev http-proxy-middleware
```

## How It Works

### Web Development Mode (localhost:8081)
1. API requests go to `/api/flash/*` (local proxy endpoint)
2. Metro proxy middleware intercepts these requests
3. Forwards to Flash API with `changeOrigin: true` (fixes CORS)
4. Returns response to the web app without CORS issues

### Mobile Mode (iOS/Android)
1. API requests go directly to `https://api-flashswitch-sandbox.flash-group.com`
2. No CORS issues since mobile apps don't enforce browser CORS policies
3. Native networking handles the requests

## Environment Configuration

### Development
- **Max Retries**: 3
- **Retry Delay**: 1000ms (with exponential backoff)
- **Timeout**: 60 seconds (longer for debugging)
- **Logging**: Debug level with detailed request/response logs

### Production
- **Max Retries**: 2
- **Retry Delay**: 3000ms (with exponential backoff)
- **Timeout**: 30 seconds
- **Logging**: Error level only

## Error Handling Improvements

### Smart Retry Logic
- ✅ **Network errors** (no response) → Retry with exponential backoff
- ✅ **Server errors** (5xx) → Retry with exponential backoff
- ✅ **Rate limiting** (429) → Retry with exponential backoff
- ❌ **Client errors** (4xx except 429) → Don't retry
- ❌ **Authentication errors** (401/403) → Don't retry

### Circuit Breaker Pattern
- Opens circuit after 5 consecutive failures
- Prevents cascading failures to Flash API
- Auto-recovery after timeout period

## Testing the Fix

### 1. Start Development Server
```bash
cd mobile
npm start
# Then press 'w' for web
```

### 2. Check Network Tab
- Open browser DevTools → Network tab
- Look for `/api/flash/oauth/token` requests
- Should see successful requests without CORS errors

### 3. Monitor Console
- Enhanced logging shows proxy activity
- Retry attempts are logged with delays
- Circuit breaker state changes are logged

## Benefits of This Solution

### ✅ **Immediate Benefits**
- **Fixes CORS errors** in web development mode
- **Maintains mobile compatibility** - no changes needed for iOS/Android
- **Better error handling** with smart retry logic
- **Improved debugging** with enhanced logging

### ✅ **Long-term Benefits**
- **Environment-aware configuration** for different deployment scenarios
- **Circuit breaker protection** prevents API overload
- **Exponential backoff** reduces server load during outages
- **Maintainable architecture** with separation of concerns

### ✅ **Development Experience**
- **Faster iteration** - no need to test only on mobile devices
- **Better debugging** - enhanced logging and error messages
- **Consistent behavior** across web and mobile platforms

## Alternative Solutions Considered

### ❌ **Browser CORS Extensions**
- **Why not**: Security risk, affects all browsing, not team-friendly

### ❌ **CORS Proxy Services**
- **Why not**: External dependency, potential security/privacy concerns

### ❌ **Direct Flash API Configuration**
- **Why not**: We don't control the Flash API server

### ✅ **Development Proxy** (Chosen Solution)
- **Why chosen**: Standard industry practice, secure, team-friendly, no external dependencies

## Future Improvements

1. **Production Web Deployment**: Consider backend proxy for production web builds
2. **Request Caching**: Add intelligent caching for token requests
3. **Offline Support**: Add offline token storage and retry queue
4. **Monitoring**: Add API performance monitoring and alerting

## Troubleshooting

### If CORS errors persist:
1. Check that `metro.config.web.js` is being used
2. Restart the Expo development server
3. Clear browser cache and reload
4. Check browser DevTools Network tab for proxy requests

### If authentication still fails:
1. Check that credentials are properly stored in localStorage (web)
2. Verify the proxy is forwarding Authorization headers
3. Check Flash API documentation for any changes

This solution provides a robust, production-ready approach to handling CORS issues while maintaining excellent developer experience across all platforms.
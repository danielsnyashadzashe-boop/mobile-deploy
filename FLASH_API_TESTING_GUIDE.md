# Flash Partner API v4 Testing Guide

## Overview

This guide provides comprehensive testing instructions for the Flash Partner API v4 integration in the NogadaCarGuard mobile application. The integration is currently configured for the **sandbox environment** with QA credentials for safe testing.

## 🧪 Testing Environment

### Current Configuration
- **Environment:** Sandbox (Testing)
- **Base URL:** `https://api-flashswitch-sandbox.flash-group.com`
- **Account:** `8058-7467-3755-5732`
- **Status:** ✅ Ready for Testing

### QA Test Data

#### Test Meter Numbers (Electricity)
Use these validated meter numbers for electricity purchase testing:
```
04004444884
75835368301
```

#### Test Phone Numbers (Airtime)
```
0812345678
0723456789  
0834567890
```

#### Test Amounts
- **Valid Range:** R5.00 - R5,000.00
- **Suggested Test Amounts:** R20, R50, R100, R200
- **Quick Selection:** Available in UI for faster testing

## 🚀 Getting Started

### Prerequisites
1. **React Native Development Environment** set up
2. **Expo CLI** installed
3. **Mobile device** or simulator for testing
4. **Network connectivity** for API calls

### Setup Instructions
1. **Navigate to project:**
   ```bash
   cd mobile
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   # or
   expo start
   ```

4. **Run on device:**
   ```bash
   npm run android  # For Android
   npm run ios      # For iOS
   ```

## 🔧 Testing Scenarios

### 1. Authentication Testing

#### Test Case 1.1: Initial Authentication
**Objective:** Verify Flash API authentication initializes correctly

**Steps:**
1. Open the mobile app
2. Navigate to **Payouts** tab
3. Tap **"Request Payout"**
4. Select **"Electricity"** 
5. Modal should open (authentication happens automatically in background)

**Expected Results:**
- ✅ Modal opens without errors
- ✅ Authentication completes automatically
- ✅ No credential-related error messages

**Troubleshooting:**
- If authentication fails, check network connectivity
- Verify sandbox URL is accessible
- Check debug console for specific errors

#### Test Case 1.2: Token Refresh
**Objective:** Verify automatic token refresh functionality

**Steps:**
1. Use the app for extended period (>30 minutes)
2. Attempt electricity purchase
3. Monitor network requests in debug mode

**Expected Results:**
- ✅ Token refreshes automatically before expiration
- ✅ API calls continue without interruption
- ✅ No authentication errors during extended use

### 2. Electricity Purchase Testing

#### Test Case 2.1: Successful Electricity Purchase
**Objective:** Complete end-to-end electricity purchase flow

**Steps:**
1. Navigate to **Payouts** → **Request Payout** → **Electricity**
2. Enter test meter number: `04004444884`
3. Wait for meter validation (should show green checkmark)
4. Select amount: **R50.00**
5. Add reference: "Test Purchase"
6. Tap **"Continue"**
7. Review details on confirmation screen
8. Tap **"Confirm Purchase"**
9. Wait for purchase completion

**Expected Results:**
- ✅ Meter lookup shows valid customer details
- ✅ Purchase completes successfully
- ✅ 20-digit electricity token displayed prominently
- ✅ Transaction ID generated
- ✅ Units issued amount shown
- ✅ Receipt can be shared
- ✅ Token can be copied to clipboard

**Test Data Validation:**
- Customer name should be displayed
- Municipality should be shown
- Token format: `1234 5678 9012 3456 7890` (formatted with spaces)

#### Test Case 2.2: Invalid Meter Number
**Objective:** Test meter validation error handling

**Steps:**
1. Open electricity purchase modal
2. Enter invalid meter: `12345678901`
3. Observe validation result

**Expected Results:**
- ✅ Red error message displayed
- ✅ "Invalid Meter" status shown
- ✅ Continue button remains disabled
- ✅ Clear error message provided

#### Test Case 2.3: Insufficient Balance
**Objective:** Test balance validation

**Steps:**
1. Enter valid meter number: `75835368301`
2. Enter amount higher than available balance: `R10,000`
3. Attempt to continue

**Expected Results:**
- ✅ Error alert displayed
- ✅ Clear message about insufficient balance
- ✅ Purchase flow blocked
- ✅ User returned to input screen

#### Test Case 2.4: Network Error Handling
**Objective:** Test error handling during network issues

**Steps:**
1. Disable network connection
2. Attempt electricity purchase
3. Re-enable network and retry

**Expected Results:**
- ✅ Clear network error message
- ✅ Retry functionality works
- ✅ No app crashes or freezing
- ✅ Graceful error recovery

#### Test Case 2.5: Purchase Timeout
**Objective:** Test handling of slow API responses

**Steps:**
1. Initiate purchase during high network latency
2. Monitor timeout behavior

**Expected Results:**
- ✅ Loading indicators shown during long operations
- ✅ Appropriate timeout handling (60 seconds)
- ✅ Clear error message if timeout occurs
- ✅ Option to retry purchase

### 3. UI/UX Testing

#### Test Case 3.1: Mobile Responsiveness
**Objective:** Verify UI works across different screen sizes

**Test Devices:**
- Small phone (iPhone SE)
- Standard phone (iPhone 12/Samsung Galaxy S21)
- Large phone (iPhone 15 Pro Max/Samsung Galaxy S23 Ultra)

**Expected Results:**
- ✅ Modal fits properly on all screen sizes
- ✅ Text is readable without horizontal scrolling
- ✅ Touch targets are adequate (44px minimum)
- ✅ Keyboard doesn't obscure input fields

#### Test Case 3.2: Accessibility Testing
**Objective:** Ensure accessibility compliance

**Steps:**
1. Enable screen reader (VoiceOver/TalkBack)
2. Navigate through electricity purchase flow
3. Test with high contrast mode
4. Test with large text sizes

**Expected Results:**
- ✅ All elements have proper labels
- ✅ Navigation is logical and intuitive
- ✅ Important information is announced
- ✅ Form inputs are properly labeled

#### Test Case 3.3: Performance Testing
**Objective:** Verify smooth performance

**Metrics to Monitor:**
- Modal open time: < 500ms
- Meter lookup time: < 3 seconds
- Purchase completion time: < 30 seconds
- Memory usage: Stable during extended use

**Expected Results:**
- ✅ Smooth animations and transitions
- ✅ No UI freezing or lag
- ✅ Efficient memory usage
- ✅ Fast response times

### 4. Integration Testing

#### Test Case 4.1: Existing App Integration
**Objective:** Verify integration doesn't break existing functionality

**Steps:**
1. Test original payout methods (bank transfer, cash, airtime)
2. Navigate between different app screens
3. Test existing features in other tabs

**Expected Results:**
- ✅ Existing payout types work unchanged
- ✅ App navigation remains smooth
- ✅ No interference with other features
- ✅ Memory usage stays consistent

#### Test Case 4.2: Data Persistence Testing
**Objective:** Test app behavior across restarts

**Steps:**
1. Complete electricity purchase
2. Close and restart app
3. Navigate to payouts screen
4. Attempt another purchase

**Expected Results:**
- ✅ Authentication credentials persist
- ✅ No re-authentication required
- ✅ Purchase history maintained
- ✅ App state restored properly

## 📊 Test Data Reference

### Valid Test Inputs

#### Meter Numbers
| Meter Number | Status | Customer Name | Municipality |
|--------------|--------|---------------|--------------|
| 04004444884 | Active | Test Customer 1 | City Power |
| 75835368301 | Active | Test Customer 2 | Eskom |

#### Phone Numbers
| Phone Number | Network | Format |
|--------------|---------|---------|
| 0812345678 | Vodacom | +27812345678 |
| 0723456789 | MTN | +27723456789 |
| 0834567890 | Vodacom | +27834567890 |

#### Test Amounts
| Amount | Purpose | Expected Result |
|--------|---------|----------------|
| R5.00 | Minimum amount | ✅ Should succeed |
| R50.00 | Standard test | ✅ Should succeed |
| R5000.00 | Maximum amount | ✅ Should succeed |
| R1.00 | Below minimum | ❌ Should fail validation |
| R10000.00 | Above maximum | ❌ Should fail validation |

### Invalid Test Inputs

#### Invalid Meter Numbers
- `1234567890` (10 digits)
- `123456789012` (12 digits)
- `abcdefghijk` (non-numeric)
- `12345 67890` (with space)

#### Invalid Phone Numbers
- `123456789` (too short)
- `12345678901` (too long)
- `+1234567890` (wrong country code)
- `abcdefghij` (non-numeric)

## 🐛 Debug Information

### Enabling Debug Mode

1. **React Native Debugger:**
   ```bash
   # In development mode
   __DEV__ = true
   ```

2. **Network Logging:**
   - API requests logged with 🚀 prefix
   - API responses logged with ✅ prefix  
   - API errors logged with ❌ prefix

3. **Flash API Debug Info:**
   ```typescript
   // In browser console during testing
   console.log('Flash Auth Status:', authService.isAuthenticated());
   console.log('Account Number:', authService.getAccountNumber());
   ```

### Common Debug Commands

```javascript
// Check authentication status
authService.isAuthenticated()

// Get current account number  
authService.getAccountNumber()

// Test authentication
authService.testAuthentication()

// Clear credentials (for testing)
authService.logout()
```

## 📋 Test Checklist

### Pre-Testing Setup
- [ ] Development environment running
- [ ] Mobile app installed on device/simulator
- [ ] Network connectivity verified
- [ ] QA credentials configured
- [ ] Test data prepared

### Core Functionality Tests
- [ ] Authentication initialization works
- [ ] Meter lookup with valid numbers succeeds
- [ ] Meter lookup with invalid numbers fails gracefully
- [ ] Electricity purchase completes successfully
- [ ] Electricity token displayed correctly
- [ ] Receipt sharing functionality works
- [ ] Copy token to clipboard works
- [ ] Insufficient balance validation works
- [ ] Amount validation (min/max) works
- [ ] Reference field accepts valid input

### Error Handling Tests
- [ ] Network error handling works
- [ ] API timeout handling works
- [ ] Invalid meter number errors shown
- [ ] Authentication errors handled
- [ ] Purchase failures communicated clearly

### UI/UX Tests
- [ ] Modal responsive on different screen sizes
- [ ] Loading states visible during operations
- [ ] Success animations play smoothly
- [ ] Error messages are user-friendly
- [ ] Navigation flow is intuitive
- [ ] Touch targets are adequate size

### Integration Tests
- [ ] Existing payout methods still work
- [ ] App navigation unaffected
- [ ] Memory usage stable
- [ ] No crashes or freezing
- [ ] App restart preserves authentication

## 🚨 Known Issues & Workarounds

### Issue 1: Meter Lookup Timeout
**Symptom:** Meter lookup takes longer than expected
**Workaround:** Wait up to 10 seconds, then retry
**Status:** Under investigation

### Issue 2: Token Copy on Older iOS
**Symptom:** Copy to clipboard may not work on iOS < 14
**Workaround:** Manual token entry, share receipt instead
**Status:** Expected limitation

### Issue 3: Network Switch During Purchase
**Symptom:** Purchase may fail when switching networks
**Workaround:** Retry purchase after network stabilizes
**Status:** Improved retry logic implemented

## 📈 Performance Benchmarks

### Target Performance Metrics
| Operation | Target Time | Acceptable Range |
|-----------|-------------|------------------|
| Modal Open | < 300ms | < 500ms |
| Authentication | < 2s | < 5s |
| Meter Lookup | < 3s | < 10s |
| Purchase Complete | < 15s | < 30s |
| Token Display | < 500ms | < 1s |

### Memory Usage
- **Target:** < 50MB additional RAM usage
- **Acceptable:** < 100MB additional RAM usage
- **Monitor:** Memory leaks during extended use

## 🔍 Testing Tools

### Recommended Testing Tools
1. **React Native Debugger** - For debugging React components
2. **Flipper** - For network requests and performance monitoring
3. **Chrome DevTools** - For JavaScript debugging
4. **Expo DevTools** - For Expo-specific debugging
5. **Charles Proxy** - For network traffic analysis

### Testing Commands
```bash
# Run with debugging enabled
npm run android -- --variant=debug

# Run with performance monitoring
npm run android -- --profile

# Clear Metro cache
npm start -- --clear-cache

# Run specific test scenario
npm test -- electricity-purchase
```

## 📞 Support & Escalation

### Internal Support
1. **Check logs** in React Native Debugger
2. **Review API documentation** in Flash Partner API V4 - V2.pdf
3. **Verify QA credentials** in V4 QA.pdf
4. **Test with known good data** from this guide

### External Support
1. **Flash API Issues:** Contact Flash technical support
2. **Authentication Problems:** Verify QA credentials with Flash
3. **Sandbox Environment Issues:** Report to Flash QA team

### Escalation Path
1. **Level 1:** Development team debugging
2. **Level 2:** Flash integration team review  
3. **Level 3:** Flash API support engagement
4. **Level 4:** Flash technical team escalation

---

## 📝 Test Report Template

### Test Session Information
- **Date:** ___________
- **Tester:** ___________
- **Environment:** Sandbox
- **App Version:** ___________
- **Device:** ___________
- **OS Version:** ___________

### Test Results Summary
- **Total Tests:** ___________
- **Passed:** ___________
- **Failed:** ___________
- **Blocked:** ___________
- **Not Tested:** ___________

### Critical Issues Found
1. **Issue:** ___________
   **Severity:** High/Medium/Low
   **Status:** ___________

### Recommendations
- [ ] Ready for production deployment
- [ ] Needs additional testing
- [ ] Critical issues must be resolved
- [ ] Performance optimization needed

### Sign-off
**QA Approval:** ___________
**Date:** ___________
**Notes:** ___________

---

**Last Updated:** 2025-09-09  
**Version:** 1.0.0  
**Status:** Ready for QA Testing
# Bug Report Template

**Issue Title:** [Clear, concise description of the bug]

## Bug Summary
Provide a brief summary of the bug in 1-2 sentences.

## Portal/Component Affected
- [ ] Car Guard App
- [ ] Customer Portal  
- [ ] Admin Dashboard
- [ ] Shared Components
- [ ] Backend API
- [ ] Authentication System
- [ ] Payment Processing

**Specific Component:** [e.g., QRCodeDisplay, TipVolumeChart, CustomerNavigation]

## Environment Information
- **Environment:** [Development/Staging/Production]
- **Browser/Device:** [Chrome 120, Safari iOS 17, etc.]
- **Screen Size:** [Mobile/Tablet/Desktop - specific dimensions if relevant]
- **Operating System:** [Windows 11, iOS 17, Android 13, etc.]
- **Application Version:** [Git commit hash or version number]

## Steps to Reproduce
1. Navigate to [specific page/route]
2. Perform [specific action]
3. Enter [specific data if relevant]
4. Click/Tap [specific button/element]
5. Observe the issue

**Test Data Used:**
- Guard ID: [if applicable]
- Customer ID: [if applicable]
- Tip Amount: [if applicable]
- Location: [if applicable]

## Expected Behavior
Describe what should happen when following the steps above.

## Actual Behavior
Describe what actually happens. Be specific about error messages, incorrect data, or UI issues.

## Screenshots/Videos
[Attach screenshots, screen recordings, or console output]
- Screenshot 1: [Brief description]
- Console logs: [Copy relevant console errors]
- Network errors: [Copy any network request failures]

## Financial Impact Assessment
- [ ] No financial impact
- [ ] Potential financial discrepancy
- [ ] Blocks payments/tips
- [ ] Security vulnerability
- [ ] Data integrity issue

**Details:** [Explain any financial implications]

## User Impact
- **Severity:** [Critical/High/Medium/Low]
- **User Types Affected:** [Car Guards/Customers/Admins/All]
- **Estimated Users Affected:** [Number or percentage]
- **Workaround Available:** [Yes/No - describe if yes]

## Technical Details
**Error Messages:**
```
[Paste any error messages here]
```

**Console Logs:**
```
[Paste relevant console output here]
```

**Network Requests:**
- Failed API calls: [List any failing endpoints]
- Status codes: [HTTP status codes received]
- Response data: [Relevant response content]

## Additional Context
- Is this a regression? [Yes/No - if yes, when did it start?]
- Related to recent changes? [Yes/No - reference PR/commit if known]
- Occurs consistently? [Always/Sometimes/Once]
- Device-specific? [Yes/No]
- Time-sensitive? [Does it occur at specific times?]

## Mock Data Context
If using mock data for reproduction:
- **Car Guard:** [guardId from mockData.ts]
- **Customer:** [customerId from mockData.ts]  
- **Location:** [locationId from mockData.ts]
- **Transaction:** [transactionId if relevant]

## Suggested Priority
- [ ] P0 - Critical (System down, security issue, financial loss)
- [ ] P1 - High (Major feature broken, significant user impact)
- [ ] P2 - Medium (Feature partially broken, moderate user impact)
- [ ] P3 - Low (Minor issue, cosmetic, low user impact)

**Justification:** [Why this priority level?]

## Stakeholder Tags
**Relevance:**
- [ ] @developers - Code fix required
- [ ] @qa-team - Testing implications
- [ ] @product-owners - Feature impact
- [ ] @security-team - Security implications
- [ ] @finance-team - Financial impact
- [ ] @support-team - User communication needed

---

**Reporter:** [Your name/username]
**Date:** [Date reported]
**Last Updated:** [Date of last update]

---
*This template is part of the NogadaCarGuard project documentation. Please fill out all relevant sections to help ensure quick resolution of issues.*
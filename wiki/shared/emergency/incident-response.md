# Incident Response Plan

This document outlines emergency procedures, contacts, and response protocols for the NogadaCarGuard application.

## Emergency Contacts

### Primary Response Team

#### Critical Incidents (P0/P1)
**Development Team Lead**
- Name: [TBD]
- Phone: [TBD]
- Email: [TBD]
- Available: 24/7 for P0, Business hours for P1

**DevOps/Infrastructure Lead** 
- Name: [TBD]
- Phone: [TBD] 
- Email: [TBD]
- Available: 24/7 for P0, Business hours for P1

**Product Owner**
- Name: [TBD]
- Phone: [TBD]
- Email: [TBD]
- Available: Business hours, on-call for P0

#### Secondary Response Team

**Senior Frontend Developer**
- Name: [TBD]
- Phone: [TBD]
- Email: [TBD]
- Available: Business hours + extended for P1

**Backend Developer**
- Name: [TBD] 
- Phone: [TBD]
- Email: [TBD]
- Available: Business hours + extended for P1

**QA Lead**
- Name: [TBD]
- Phone: [TBD]
- Email: [TBD]
- Available: Business hours

### External Contacts

**Hosting Provider Support**
- Provider: [TBD]
- Support Phone: [TBD]
- Support Email: [TBD]
- Account ID: [TBD]

**Payment Gateway Support**
- Provider: [TBD]
- Emergency Phone: [TBD]
- Support Email: [TBD]
- Merchant ID: [TBD]

**SSL Certificate Provider**
- Provider: [TBD] 
- Support Phone: [TBD]
- Renewal Contact: [TBD]

## Incident Classification

### Priority Levels

#### P0 - Critical (Response: Immediate)
- Complete application outage affecting all users
- Security breach or data exposure
- Payment processing completely down
- Database corruption or data loss

**Response Time**: 15 minutes
**Resolution Target**: 2 hours
**Communication**: Immediate notification to all stakeholders

#### P1 - High (Response: 1 hour)
- Single portal completely unavailable
- Major functionality broken (QR code generation, tip processing)
- Performance degradation affecting >50% of users
- Authentication system down

**Response Time**: 1 hour
**Resolution Target**: 4 hours  
**Communication**: Hourly updates to stakeholders

#### P2 - Medium (Response: 4 hours)
- Minor feature broken affecting <25% of users
- UI/UX issues not preventing core functionality
- Performance issues affecting specific features
- Non-critical integrations down

**Response Time**: 4 hours during business hours
**Resolution Target**: 24 hours
**Communication**: Daily updates

#### P3 - Low (Response: Next business day)
- Cosmetic issues
- Enhancement requests
- Documentation updates
- Minor bug fixes

**Response Time**: Next business day
**Resolution Target**: 1 week
**Communication**: Weekly updates

## Incident Response Procedures

### Initial Response (0-15 minutes)

#### 1. Incident Detection and Reporting
```
WHO: Anyone who discovers the incident
WHAT: Report via designated channels
WHEN: Immediately upon discovery
HOW: 
- Slack channel: #nogada-incidents
- Email: incidents@[company].com
- Phone: Emergency hotline [TBD]
```

#### 2. Initial Assessment
```
WHO: First responder (Development Lead or on-call engineer)
WHAT: 
- Classify incident priority (P0-P3)
- Assess impact scope
- Determine affected portals/features
- Estimate affected user count
WHEN: Within 15 minutes of report
```

#### 3. Incident Commander Assignment
```
P0/P1: Development Team Lead or designated backup
P2: Senior developer on duty
P3: Any available developer during business hours
```

#### 4. Initial Communication
```
INTERNAL:
- Notify response team via Slack/email
- Update incident tracking system
- Brief status to management for P0/P1

EXTERNAL (if applicable):
- Customer notification for P0/P1 affecting service
- Status page update
- Social media acknowledgment if widespread
```

### Investigation Phase (15 minutes - 2 hours)

#### 1. System Assessment
```bash
# Check application status
curl -I https://app.nogadacarguard.com/health
curl -I https://app.nogadacarguard.com/car-guard/health  
curl -I https://app.nogadacarguard.com/customer/health
curl -I https://app.nogadacarguard.com/admin/health

# Check server resources
htop
df -h
free -m

# Check application logs
tail -f /var/log/nginx/error.log
tail -f /var/log/application/error.log
docker logs nogada-app
```

#### 2. Database Assessment
```sql
-- Check database connectivity
SELECT 1;

-- Check for blocking queries
SELECT * FROM pg_stat_activity WHERE state = 'active';

-- Check table locks
SELECT * FROM pg_locks WHERE NOT granted;

-- Verify data integrity for critical tables
SELECT COUNT(*) FROM car_guards;
SELECT COUNT(*) FROM transactions WHERE created_at > NOW() - INTERVAL '1 hour';
```

#### 3. Portal-Specific Checks

**Car Guard Portal**
- QR code generation functionality
- Balance display accuracy
- Tip receipt notifications
- Payout request processing

**Customer Portal**
- Registration/login process
- Payment method integration
- Transaction history accuracy
- Receipt generation

**Admin Portal**
- Dashboard loading and data accuracy
- User management functions
- Report generation
- Location/guard management

#### 4. Evidence Collection
```bash
# Capture system state
ps aux > /tmp/incident-processes-$(date +%Y%m%d-%H%M).txt
netstat -tulpn > /tmp/incident-network-$(date +%Y%m%d-%H%M).txt
free -m > /tmp/incident-memory-$(date +%Y%m%d-%H%M).txt

# Application logs
cp /var/log/application/*.log /tmp/incident-logs-$(date +%Y%m%d-%H%M)/

# Database snapshot (if safe to do so)
pg_dump --schema-only nogada_db > /tmp/incident-schema-$(date +%Y%m%d-%H%M).sql
```

### Resolution Phase

#### 1. Quick Fixes (Temporary Resolution)
```bash
# Application restart
sudo systemctl restart nogada-app
docker restart nogada-container

# Nginx restart  
sudo systemctl restart nginx

# Database connection reset
sudo systemctl restart postgresql

# Clear application cache
redis-cli FLUSHDB
```

#### 2. Rollback Procedures
```bash
# Git rollback to last known good state
git log --oneline -10  # Identify last good commit
git checkout [commit-hash]
npm run build:prod
sudo systemctl restart nogada-app

# Database rollback (if applicable)
pg_restore --clean --no-privileges --no-owner -d nogada_db backup_pre_incident.sql
```

#### 3. Configuration Changes
```bash
# Update environment variables
sudo nano /etc/systemd/system/nogada-app.service
sudo systemctl daemon-reload
sudo systemctl restart nogada-app

# Update Nginx configuration
sudo nano /etc/nginx/sites-available/nogada
sudo nginx -t
sudo systemctl reload nginx
```

### Post-Incident Phase

#### 1. Verification Testing
```javascript
// Smoke tests for each portal
const testCarGuardPortal = async () => {
  // Test login
  const loginResult = await fetch('/api/car-guard/auth/login', {
    method: 'POST',
    body: JSON.stringify({ phone: 'test', pin: 'test' })
  })
  
  // Test QR generation
  const qrResult = await fetch('/api/car-guard/qr-code/generate')
  
  // Test balance retrieval
  const balanceResult = await fetch('/api/car-guard/balance')
}

const testCustomerPortal = async () => {
  // Test registration
  // Test tip processing
  // Test payment methods
}

const testAdminPortal = async () => {
  // Test dashboard loading
  // Test user management
  // Test reports generation
}
```

#### 2. Communication Updates
```
INTERNAL:
- All-clear notification to response team
- Incident summary to management
- Lessons learned brief

EXTERNAL:
- Service restoration announcement
- Status page update to "All Systems Operational"
- Customer communication if affected
```

## Financial Application Specific Procedures

### Payment Processing Incidents

#### Immediate Actions
1. **Stop Payment Processing** (if data integrity at risk)
   ```javascript
   // Feature flag to disable payments
   setFeatureFlag('payment_processing', false)
   ```

2. **Audit Transaction Integrity**
   ```sql
   -- Check for duplicate transactions
   SELECT tip_id, COUNT(*) FROM transactions 
   WHERE created_at > NOW() - INTERVAL '1 hour'
   GROUP BY tip_id HAVING COUNT(*) > 1;
   
   -- Verify payment gateway reconciliation
   SELECT SUM(amount) FROM transactions 
   WHERE status = 'completed' AND created_at::date = CURRENT_DATE;
   ```

3. **Secure Sensitive Data**
   ```bash
   # Rotate API keys if compromise suspected
   # Update payment gateway credentials
   # Invalidate active sessions if needed
   ```

### Data Breach Response

#### Immediate Actions (within 30 minutes)
1. **Isolate Affected Systems**
   ```bash
   # Block suspicious IP addresses
   sudo iptables -A INPUT -s [suspicious-ip] -j DROP
   
   # Disable affected user accounts
   # Revoke API access tokens
   ```

2. **Assess Data Exposure**
   ```sql
   -- Identify potentially compromised data
   SELECT table_name, column_name 
   FROM information_schema.columns 
   WHERE table_schema = 'public' 
   AND column_name LIKE '%password%' 
   OR column_name LIKE '%token%'
   OR column_name LIKE '%bank%';
   ```

3. **Legal and Compliance Notification**
   - Notify legal team immediately
   - Prepare for POPIA compliance requirements
   - Document all actions taken

#### Follow-up Actions (within 2 hours)
1. **User Notification Preparation**
   ```html
   <!-- Email template for affected users -->
   <p>We are writing to inform you of a security incident...</p>
   <p>What data was involved: [specify]</p>
   <p>What we are doing: [specify actions]</p>
   <p>What you should do: [specify user actions]</p>
   ```

2. **Security Hardening**
   ```bash
   # Force password resets
   # Enable two-factor authentication
   # Update all system passwords
   # Patch security vulnerabilities
   ```

### Database Incidents

#### Data Corruption Response
```sql
-- Check database integrity
VACUUM ANALYZE;
REINDEX DATABASE nogada_db;

-- Verify foreign key constraints
SELECT conname, conrelid::regclass 
FROM pg_constraint 
WHERE confrelid = 'car_guards'::regclass;

-- Check for orphaned records
SELECT * FROM tips t 
LEFT JOIN car_guards cg ON t.guard_id = cg.id 
WHERE cg.id IS NULL;
```

#### Backup and Recovery
```bash
# Restore from latest backup
pg_restore --clean --no-privileges --no-owner -d nogada_db /backups/latest/nogada_db.sql

# Point-in-time recovery (if needed)
pg_basebackup -D /tmp/backup -Ft -z -P
```

## Communication Templates

### Internal Incident Alert
```
SUBJECT: [P0/P1/P2] NogadaCarGuard Incident - [Brief Description]

Incident ID: INC-YYYYMMDD-NNN
Priority: P0/P1/P2
Status: INVESTIGATING/MITIGATING/RESOLVED
Affected Systems: [Car Guard Portal/Customer Portal/Admin Portal/All]
Impact: [Number of users affected, functionality impacted]
Start Time: [YYYY-MM-DD HH:MM UTC]

SUMMARY:
[Brief description of the issue]

CURRENT STATUS:
[What is being done right now]

NEXT UPDATE:
[When the next update will be provided]

INCIDENT COMMANDER: [Name, contact]
```

### Customer Communication
```
SUBJECT: Service Update - NogadaCarGuard

We are currently experiencing [brief description] affecting [specific functionality].

What's affected: [List affected features]
What's working: [List unaffected features]  
Expected resolution: [Time estimate]

We apologize for any inconvenience and are working quickly to restore full service.

For updates, visit: [status page URL]
For support: [support contact]
```

### Post-Incident Report Template
```markdown
# Incident Report - [Date]

## Summary
**Incident ID**: INC-YYYYMMDD-NNN
**Duration**: X hours Y minutes
**Impact**: [User impact description]
**Root Cause**: [Technical root cause]

## Timeline
- HH:MM - Issue detected
- HH:MM - Response team assembled
- HH:MM - Root cause identified
- HH:MM - Fix deployed
- HH:MM - Service restored

## Root Cause Analysis
[Detailed technical analysis]

## Resolution
[What was done to fix the issue]

## Action Items
1. [Preventive measure 1] - Owner: [Name] - Due: [Date]
2. [Preventive measure 2] - Owner: [Name] - Due: [Date]

## Lessons Learned
[What we learned and how we'll improve]
```

## Testing and Validation Procedures

### Post-Incident Smoke Tests

#### Automated Health Checks
```javascript
// Health check endpoints
const healthChecks = [
  'https://app.nogadacarguard.com/api/health',
  'https://app.nogadacarguard.com/api/car-guard/health',
  'https://app.nogadacarguard.com/api/customer/health', 
  'https://app.nogadacarguard.com/api/admin/health'
]

const runHealthChecks = async () => {
  for (const endpoint of healthChecks) {
    const response = await fetch(endpoint)
    console.log(`${endpoint}: ${response.status}`)
  }
}
```

#### Critical Path Testing
```javascript
// Test critical user journeys
const testCriticalPaths = async () => {
  // Car Guard: Login -> View Balance -> Generate QR
  // Customer: Register -> Add Payment Method -> Send Tip
  // Admin: Login -> View Dashboard -> Process Payout
}
```

### Load Testing After Incidents
```bash
# Quick load test to verify stability
artillery quick --count 10 --num 5 https://app.nogadacarguard.com/api/health

# Comprehensive load test
artillery run load-test-config.yml
```

## Training and Preparedness

### Incident Response Drills

#### Monthly Drill Schedule
- Week 1: P2 incident simulation
- Week 2: Database failure simulation  
- Week 3: Payment processing incident
- Week 4: Security breach simulation

#### Drill Scenarios
```markdown
**Scenario 1: Payment Gateway Down**
- Simulate payment processor outage
- Test fallback procedures
- Verify customer communication

**Scenario 2: Database Connection Loss**
- Simulate database connectivity issues
- Test application resilience
- Practice backup restoration

**Scenario 3: QR Code Generation Failure**
- Simulate QR service outage
- Test manual workarounds
- Verify guard communication
```

### Team Preparedness

#### Required Tools Access
- [ ] VPN access configured
- [ ] Production system access
- [ ] Database access credentials
- [ ] Monitoring dashboard access
- [ ] Incident tracking system access
- [ ] Communication channel access

#### Knowledge Requirements
- [ ] Application architecture understanding
- [ ] Database schema knowledge
- [ ] Deployment process familiarity
- [ ] Monitoring system usage
- [ ] Rollback procedures
- [ ] Communication protocols

## Monitoring and Alerting

### Critical Alerts

#### Application Alerts
```yaml
# Application health monitoring
- name: Application Down
  condition: http_status != 200
  threshold: 3 consecutive failures
  notification: immediate

- name: High Response Time  
  condition: response_time > 2000ms
  threshold: 5 minutes average
  notification: 15 minutes

- name: High Error Rate
  condition: error_rate > 5%
  threshold: 5 minutes
  notification: immediate
```

#### Infrastructure Alerts
```yaml
- name: High CPU Usage
  condition: cpu_usage > 80%
  threshold: 10 minutes
  notification: 30 minutes

- name: Low Disk Space
  condition: disk_free < 20%
  threshold: immediate
  notification: immediate

- name: Database Connection Issues
  condition: db_connections > 80% of max
  threshold: 5 minutes
  notification: 15 minutes
```

#### Business Logic Alerts
```yaml
- name: Payment Failures
  condition: payment_failure_rate > 10%
  threshold: 5 minutes
  notification: immediate

- name: QR Code Generation Failures
  condition: qr_generation_failure_rate > 5%
  threshold: 3 minutes
  notification: immediate
```

---

**Stakeholder Relevance:**
- **Development Team**: Primary incident response procedures
- **DevOps/Infrastructure**: System recovery and monitoring procedures
- **Management**: Communication protocols and escalation procedures
- **Support Team**: Customer communication and status updates
- **Legal/Compliance**: Data breach and regulatory response procedures

**Document Information:**
- **Version**: 1.0
- **Last Updated**: August 2025
- **Next Review**: September 2025 (Monthly review required)
- **Owner**: Development Team Lead
- **Approval**: [TBD]

**Emergency Hotline**: [TBD]
**Incident Email**: incidents@[company].com
**Status Page**: [TBD]
# System Overview

> **Stakeholder Relevance**: [All]

Comprehensive overview of the NogadaCarGuard system architecture, components, and integrations.

## Table of Contents
- [System Overview](#system-overview)
- [High-Level Architecture](#high-level-architecture)
- [Portal Architecture](#portal-architecture)
- [Technology Stack](#technology-stack)
- [Data Architecture](#data-architecture)
- [Security Architecture](#security-architecture)
- [Performance Considerations](#performance-considerations)
- [Scalability Design](#scalability-design)
- [Integration Points](#integration-points)

## High-Level Architecture

NogadaCarGuard is a multi-portal Single Page Application (SPA) built on modern React architecture, serving three distinct user interfaces through a unified codebase.

```mermaid
graph TB
    subgraph "User Interfaces"
        CG["🚗 Car Guard App<br/>Mobile-First Interface"]
        CP["💳 Customer Portal<br/>Web Interface"]
        AD["⚙️ Admin Dashboard<br/>Management Interface"]
    end
    
    subgraph "Frontend Layer"
        SPA["React 18.3.1 SPA<br/>Single Codebase"]
        RT["React Router v6<br/>Multi-Portal Routing"]
        UI["shadcn/ui Components<br/>60+ Accessible Components"]
    end
    
    subgraph "State Management"
        RQ["TanStack Query<br/>Server State"]
        RHF["React Hook Form<br/>Form State"]
        CTX["React Context<br/>Portal State"]
    end
    
    subgraph "Data Layer (Current)"
        MD["Mock Data<br/>TypeScript Interfaces"]
        LS["Local Storage<br/>Session Persistence"]
    end
    
    subgraph "Future API Layer"
        API["RESTful API<br/>Payment Processing"]
        DB["Database<br/>Persistent Storage"]
        EXT["External Services<br/>Payment Gateways"]
    end
    
    subgraph "Build & Deployment"
        VT["Vite 5.4.1<br/>Build Tool"]
        TC["TypeScript<br/>Type Safety"]
        TW["Tailwind CSS<br/>Styling"]
    end
    
    CG --> SPA
    CP --> SPA
    AD --> SPA
    
    SPA --> RT
    SPA --> UI
    SPA --> RQ
    SPA --> RHF
    SPA --> CTX
    
    RQ --> MD
    CTX --> LS
    
    MD -.-> API
    API --> DB
    API --> EXT
    
    SPA --> VT
    VT --> TC
    VT --> TW
```

## Portal Architecture

### Multi-Portal Design Pattern

The application implements a sophisticated multi-portal architecture that provides three distinct user experiences while maintaining code reusability and consistency.

```mermaid
graph LR
    subgraph "Application Router (/)"
        AS["App Selector<br/>Portal Selection"]
    end
    
    subgraph "Car Guard Portal (/car-guard/*)"
        CGL["Car Guard Layout<br/>Bottom Navigation"]
        CG1["Dashboard<br/>QR Code Display"]
        CG2["History<br/>Tip Transactions"]
        CG3["Payouts<br/>Bank Management"]
        CG4["Profile<br/>Settings"]
    end
    
    subgraph "Customer Portal (/customer/*)"
        CPL["Customer Layout<br/>Top Navigation"]
        CP1["Dashboard<br/>Quick Actions"]
        CP2["Tipping<br/>QR Scanner"]
        CP3["History<br/>Transaction Log"]
        CP4["Profile<br/>Wallet Management"]
    end
    
    subgraph "Admin Dashboard (/admin/*)"
        ADL["Admin Layout<br/>Sidebar Navigation"]
        AD1["Dashboard<br/>Analytics"]
        AD2["Locations<br/>Management"]
        AD3["Guards<br/>Administration"]
        AD4["Transactions<br/>Monitoring"]
        AD5["Reports<br/>Business Intelligence"]
    end
    
    AS --> CGL
    AS --> CPL
    AS --> ADL
    
    CGL --> CG1
    CGL --> CG2
    CGL --> CG3
    CGL --> CG4
    
    CPL --> CP1
    CPL --> CP2
    CPL --> CP3
    CPL --> CP4
    
    ADL --> AD1
    ADL --> AD2
    ADL --> AD3
    ADL --> AD4
    ADL --> AD5
```

### Portal-Specific Features

#### 🚗 Car Guard App
- **Target Device**: Mobile phones and tablets
- **Key Features**: QR code generation, tip collection, payout management
- **Navigation**: Bottom navigation for thumb-friendly interaction
- **Offline Capability**: Local data persistence for poor connectivity areas

#### 💳 Customer Portal  
- **Target Device**: Desktop and mobile browsers
- **Key Features**: QR code scanning, payment processing, transaction history
- **Navigation**: Traditional top navigation with responsive design
- **Security Focus**: Payment data protection and transaction integrity

#### ⚙️ Admin Dashboard
- **Target Device**: Desktop computers and tablets
- **Key Features**: Location management, analytics, user administration
- **Navigation**: Sidebar navigation with hierarchical menu structure
- **Data Focus**: Business intelligence and operational management

## Technology Stack

### Frontend Framework
```typescript
// Core React Architecture
React: 18.3.1          // Concurrent features, improved performance
TypeScript: 5.5.3       // Full type safety across codebase
Vite: 5.4.1             // Fast build tool with HMR
```

### UI Framework
```typescript
// Component Library Stack
shadcn/ui               // 60+ accessible, customizable components
Radix UI                // Primitive components foundation
Tailwind CSS: 3.4.11    // Utility-first styling with tippa theme
Lucide React            // Consistent icon system
```

### State Management
```typescript
// State Management Strategy
TanStack Query: 5.56.2  // Server state and caching
React Hook Form: 7.53.0 // Form state management
Zod: 3.23.8             // Schema validation
React Context           // Portal-specific global state
```

### Development Tools
```typescript
// Development Experience
ESLint: 9.9.0           // Code quality and consistency
PostCSS                 // CSS processing
SWC                     // Fast TypeScript compilation
Path Aliases (@/)       // Clean import statements
```

## Data Architecture

### Current Mock Data System

The application currently operates with a comprehensive mock data system that simulates a complete backend.

```mermaid
erDiagram
    CarGuard {
        string id PK
        string name
        string email
        string phone
        number balance
        string qrCode
        string locationId FK
        string status
        object bankDetails
    }
    
    Customer {
        string id PK
        string name
        string email
        string phone
        number walletBalance
        number totalTipped
        string joinedDate
    }
    
    Tip {
        string id PK
        string guardId FK
        string customerId FK
        number amount
        string date
        string status
        string paymentMethod
    }
    
    Payout {
        string id PK
        string guardId FK
        number amount
        string status
        string bankAccount
        string date
    }
    
    Location {
        string id PK
        string name
        string address
        number guardCount
        string managerId FK
    }
    
    Manager {
        string id PK
        string name
        string email
        string locationId FK
    }
    
    Transaction {
        string id PK
        string guardId FK
        string type
        number amount
        string status
        string reference
    }
    
    CarGuard ||--o{ Tip : "receives"
    Customer ||--o{ Tip : "gives"
    CarGuard ||--o{ Payout : "requests"
    CarGuard }o--|| Location : "works at"
    Manager ||--o{ Location : "manages"
    CarGuard ||--o{ Transaction : "has"
```

### Helper Functions
```typescript
// Data Access Layer (src/data/mockData.ts)
getTipsByGuardId(guardId: string): Tip[]
getTipsByCustomerId(customerId: string): Tip[]
getPayoutsByGuardId(guardId: string): Payout[]
getGuardsByManagerId(managerId: string): CarGuard[]
getGuardsByLocationId(locationId: string): CarGuard[]
getTransactionsByGuardId(guardId: string): Transaction[]

// Utility Functions
formatCurrency(amount: number): string      // "R 123.45"
formatDate(date: string): string           // "Aug 25, 2025"
formatTime(time: string): string           // "2:30 PM"
```

## Security Architecture

### Frontend Security Layers

```mermaid
graph TB
    subgraph "Browser Security"
        CSP["Content Security Policy<br/>Script & Resource Protection"]
        HTTPS["HTTPS Only<br/>Transport Encryption"]
        SRI["Subresource Integrity<br/>Asset Verification"]
    end
    
    subgraph "Application Security"
        XSS["XSS Prevention<br/>Input Sanitization"]
        CSRF["CSRF Protection<br/>Token Validation"]
        AUTH["Authentication<br/>JWT + MFA"]
    end
    
    subgraph "Data Security"
        ENC["Data Encryption<br/>AES-256"]
        MASK["Data Masking<br/>Sensitive Fields"]
        AUDIT["Audit Logging<br/>User Actions"]
    end
    
    CSP --> XSS
    HTTPS --> AUTH
    SRI --> ENC
    XSS --> AUDIT
    CSRF --> MASK
    AUTH --> AUDIT
```

### Security Considerations by Portal

#### Car Guard App Security
- **QR Code Security**: Signed QR codes with expiration
- **Device Security**: Biometric authentication
- **Offline Security**: Encrypted local storage

#### Customer Portal Security
- **Payment Security**: PCI DSS compliance
- **Session Security**: Secure token management
- **Transaction Security**: End-to-end encryption

#### Admin Dashboard Security
- **Role-Based Access**: Hierarchical permissions
- **Audit Logging**: Complete action tracking
- **Data Protection**: Granular access controls

## Performance Considerations

### Build Performance
```bash
# Vite Build Optimization
Build Time: ~30 seconds
HMR Updates: <100ms
Bundle Size: ~2MB (compressed)
Code Splitting: Route-based chunks
```

### Runtime Performance
```typescript
// Performance Optimizations
React.memo()              // Component memoization
useMemo() / useCallback() // Hook optimization
React.lazy()              // Code splitting
Virtual Scrolling         // Large list optimization
```

### Loading Performance
- **First Contentful Paint**: <1.5s target
- **Largest Contentful Paint**: <2.5s target  
- **Time to Interactive**: <3.5s target
- **Cumulative Layout Shift**: <0.1 target

## Scalability Design

### Horizontal Scaling
```mermaid
graph LR
    subgraph "Load Distribution"
        LB["Load Balancer<br/>Azure Front Door"]
        CDN["CDN<br/>Static Assets"]
    end
    
    subgraph "Application Instances"
        APP1["App Instance 1<br/>Region: West Europe"]
        APP2["App Instance 2<br/>Region: South Africa"]
        APP3["App Instance 3<br/>Region: East US"]
    end
    
    subgraph "Data Layer"
        API1["API Gateway 1"]
        API2["API Gateway 2"]
        DB1["Database Cluster"]
    end
    
    LB --> APP1
    LB --> APP2
    LB --> APP3
    CDN --> APP1
    CDN --> APP2
    CDN --> APP3
    
    APP1 --> API1
    APP2 --> API1
    APP3 --> API2
    API1 --> DB1
    API2 --> DB1
```

### Component Scalability
- **Modular Architecture**: Independent portal deployment
- **Shared Components**: Reusable UI library
- **Lazy Loading**: Portal-specific code splitting
- **Caching Strategy**: Multi-layer caching approach

## Integration Points

### Current Integrations
- **Mock Data Layer**: TypeScript interfaces and helper functions
- **Local Storage**: Session persistence and offline capability
- **Browser APIs**: Geolocation, camera (QR scanning), notifications

### Planned Integrations
```mermaid
graph TB
    subgraph "External Services"
        PAY["Payment Gateways<br/>Stripe, PayPal, Yoco"]
        SMS["SMS Gateway<br/>Twilio, AWS SNS"]
        EMAIL["Email Service<br/>SendGrid, AWS SES"]
        MAPS["Maps API<br/>Google Maps"]
    end
    
    subgraph "Banking Integration"
        BANK1["Standard Bank API"]
        BANK2["FNB API"]
        BANK3["Absa API"]
        BANK4["Nedbank API"]
    end
    
    subgraph "Government Services"
        SARS["SARS API<br/>Tax Compliance"]
        FICA["FICA Verification<br/>Identity Services"]
    end
    
    subgraph "Monitoring"
        APM["Application Performance<br/>Azure Application Insights"]
        LOG["Centralized Logging<br/>Azure Log Analytics"]
        ALERT["Alerting<br/>Azure Monitor"]
    end
    
    PAY --> APP[NogadaCarGuard]
    SMS --> APP
    EMAIL --> APP
    MAPS --> APP
    
    BANK1 --> APP
    BANK2 --> APP
    BANK3 --> APP
    BANK4 --> APP
    
    SARS --> APP
    FICA --> APP
    
    APP --> APM
    APP --> LOG
    APP --> ALERT
```

## System Boundaries

### Current System Scope
- ✅ Multi-portal frontend application
- ✅ Mock data system with TypeScript interfaces
- ✅ Responsive design for all device types
- ✅ Component library and design system
- ✅ Build and development toolchain

### Future System Scope
- 🔄 RESTful API backend
- 🔄 Real payment processing
- 🔄 Database integration
- 🔄 Authentication and authorization
- 🔄 Monitoring and analytics
- 🔄 CI/CD pipeline

### Out of Scope
- ❌ Native mobile applications (using PWA approach)
- ❌ Real-time chat/messaging
- ❌ Video calling or conferencing
- ❌ Inventory management beyond basic location tracking
- ❌ Third-party marketplace integration

---
**Document Information:**
- **Last Updated**: 2025-08-25
- **Status**: Active
- **Owner**: Architecture Team
- **Version**: 1.0.0
- **Next Review**: 2025-09-25
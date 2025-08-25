# 📚 NogadaCarGuard Wiki

> **Welcome to the NogadaCarGuard Documentation Portal**
> 
> A comprehensive car guard tipping platform with three integrated portals: Car Guard App, Customer Portal, and Admin Dashboard

## 🚀 Quick Start

```bash
# Clone repository
git clone https://dev.azure.com/ionic-innovations/NogadaCarGuard/_git/NogadaCarGuard

# Install dependencies
npm install

# Start development server (port 8080)
npm run dev

# Build for production
npm run build
```

## 📊 Project Statistics

| Metric | Value |
|--------|-------|
| **Total Files** | 147 |
| **TypeScript/React Components** | 92 |
| **Lines of Code** | ~15,000 |
| **Dependencies** | 67 |
| **Primary Language** | TypeScript (95%) |
| **UI Components** | 50+ shadcn/ui |
| **Portals** | 3 (Car Guard, Customer, Admin) |
| **Routes** | 26 unique routes |

## 🗂️ Documentation Sections

### 👨‍💻 **[Developers](./developers/README.md)**
Essential documentation for the development team

- [🏗️ Development Standards](./developers/development-standards.md) - Coding conventions and best practices
- [📡 API Documentation](./developers/api-documentation.md) - API endpoints and integration patterns
- [💻 Local Setup](./developers/local-setup.md) - Environment configuration and setup guide
- [👁️ Code Review](./developers/code-review.md) - Review process and checklist
- [🚢 Deployment](./developers/deployment.md) - Deployment procedures and environments

### ⚙️ **[DevOps](./devops/README.md)**
Infrastructure and operations documentation

- [🏭 Infrastructure as Code](./devops/infrastructure-as-code.md) - IaC patterns and configurations
- [🔄 CI/CD Pipelines](./devops/cicd-pipelines.md) - Build and deployment automation
- [📊 Monitoring & Alerting](./devops/monitoring-alerting.md) - System health and performance tracking
- [🌍 Environment Management](./devops/environment-management.md) - Environment configurations

### 🧪 **[Quality Assurance](./qa/README.md)**
Testing and quality control documentation

- [📋 Testing Strategies](./qa/testing-strategies.md) - Testing approaches and methodologies
- [🔧 Test Environment Setup](./qa/test-environment-setup.md) - Test environment configuration
- [🐛 Bug Tracking](./qa/bug-tracking.md) - Issue management and resolution

### 🔒 **[Security](./security/README.md)**
Security policies and procedures

- [🛡️ Security Standards](./security/security-standards.md) - Security requirements and compliance
- [⚠️ Vulnerability Management](./security/vulnerability-management.md) - Security scanning and remediation
- [🔑 Access Control](./security/access-control.md) - Authentication and authorization

### 💼 **[Business](./business/README.md)**
Business requirements and metrics

- [📝 Requirements Management](./business/requirements-management.md) - Feature requirements and specifications
- [👥 User Stories](./business/user-stories.md) - User personas and journey maps
- [📈 Success Metrics](./business/success-metrics.md) - KPIs and business objectives

### 🔍 **[Analysis](./analysis/README.md)**
Codebase and architecture analysis

- [📦 Codebase Overview](./analysis/codebase-overview.md) - Project structure and organization
- [🏛️ Architecture Analysis](./analysis/architecture-analysis.md) - System design and patterns
- [🔗 Dependency Map](./analysis/dependency-map.md) - Package dependencies and relationships
- [⚡ Tech Stack](./analysis/tech-stack.md) - Technologies and frameworks

### 🔄 **[Workflows](./workflows/README.md)**
Development and operational workflows

- [💻 Development Workflow](./workflows/development-workflow.md) - Development process and Git flow
- [📦 Release Process](./workflows/release-process.md) - Release management and versioning
- [🚨 Incident Response](./workflows/incident-response.md) - Emergency procedures

### 🤝 **[Shared Resources](./shared/)**
Cross-functional documentation

#### Architecture
- [🗺️ System Overview](./shared/architecture/system-overview.md) - High-level architecture
- [🔀 Data Flow](./shared/architecture/data-flow.md) - Data movement and processing

#### Knowledge Base
- [🔧 Troubleshooting](./shared/knowledge/troubleshooting.md) - Common issues and solutions
- [⭐ Best Practices](./shared/knowledge/best-practices.md) - Recommended approaches

#### Emergency
- [🚨 Incident Response](./shared/emergency/incident-response.md) - Emergency contacts and procedures

### 📋 **[Governance](./governance/)**
Documentation standards and contribution guidelines

- [📖 Documentation Standards](./governance/documentation-standards.md) - Documentation guidelines
- [🤝 Contributing](./governance/contributing.md) - How to contribute to the project

### 📝 **[Templates](./templates/)**
Standard templates for project management

- [🐛 Bug Report Template](./templates/bug-report-template.md)
- [✨ Feature Request Template](./templates/feature-request-template.md)
- [🔀 Pull Request Template](./templates/pull-request-template.md)

## 🎯 Portal Overview

### 📱 Car Guard App
Mobile-friendly interface for car guards to receive tips and manage payouts

**Key Features:**
- QR Code display for tip collection
- Real-time balance tracking
- Transaction history
- Payout management
- Profile settings

**Routes:** `/car-guard/*`

### 🛒 Customer Portal
User interface for customers to tip car guards

**Key Features:**
- QR code scanning
- Multiple payment methods
- Transaction history
- Wallet management
- Guard ratings

**Routes:** `/customer/*`

### 🎛️ Admin Dashboard
Comprehensive administration panel

**Key Features:**
- Location management
- Guard and manager administration
- Transaction monitoring
- Analytics and reporting
- System configuration

**Routes:** `/admin/*`

## 🏗️ Technology Stack

| Category | Technology | Version |
|----------|------------|---------|
| **Framework** | React | 18.3.1 |
| **Language** | TypeScript | 5.5.3 |
| **Build Tool** | Vite | 5.4.1 |
| **UI Library** | shadcn/ui | Latest |
| **Styling** | Tailwind CSS | 3.4.11 |
| **Routing** | React Router | 6.26.2 |
| **State Management** | TanStack Query | 5.56.2 |
| **Forms** | React Hook Form + Zod | 7.53.0 + 3.23.8 |
| **Charts** | Recharts | 2.12.7 |
| **QR Code** | react-qr-code | 2.0.12 |

## 🔗 Quick Links

### Development
- [Local Setup Guide](./developers/local-setup.md)
- [Development Standards](./developers/development-standards.md)
- [Git Workflow](./workflows/development-workflow.md)

### Operations
- [Deployment Guide](./developers/deployment.md)
- [Monitoring Dashboard](./devops/monitoring-alerting.md)
- [Incident Response](./workflows/incident-response.md)

### Documentation
- [Claude AI Assistant Guide](./CLAUDE.md)
- [Contributing Guidelines](./governance/contributing.md)
- [Documentation Standards](./governance/documentation-standards.md)

## 📞 Contact & Support

| Role | Contact | Responsibility |
|------|---------|----------------|
| **Project Lead** | TO BE DOCUMENTED | Overall project management |
| **Tech Lead** | TO BE DOCUMENTED | Technical decisions and architecture |
| **DevOps Lead** | TO BE DOCUMENTED | Infrastructure and deployment |
| **QA Lead** | TO BE DOCUMENTED | Quality assurance and testing |

## 🔄 Recent Updates

| Date | Update | Author |
|------|--------|--------|
| 2025-08-25 | Wiki documentation created | AI Assistant |
| 2025-08-25 | Initial project setup | Development Team |

---
**Document Information:**
- **Last Updated**: 2025-08-25
- **Status**: Active
- **Owner**: Development Team
- **Version**: 1.0.0
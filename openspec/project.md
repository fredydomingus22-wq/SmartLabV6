# Project Context

## Purpose
SmartLab Enterprise is a next-generation Industrial Cloud platform designed to serve as a comprehensive LIMS (Laboratory Information Management System), QMS (Quality Management System), FSMS (Food Safety Management System), and SPC (Statistical Process Control) hub. It is built for highly regulated industrial environments (FSSC 22000, ISO 22000, 21 CFR Part 11), emphasizing data integrity, traceability, and operational excellence through a "Factory-First" digital experience.

## Tech Stack
- **Frontend**: Next.js 16, React 19, TypeScript 5.x
- **Styling/UI**: Tailwind CSS v4, Framer Motion (Industrial Glassmorphism), Lucide React
- **Backend/DB**: Supabase (PostgreSQL 16), PostgREST, Edge Functions (Deno/Node 18)
- **State Management**: TanStack Query v5 (Server State), Zustand (Client Flows)
- **Data Visualization**: ECharts, Recharts, React Flow (Genealogy/Traceability)
- **Quality/AI**: OpenAI API for anomaly detection and intelligent insights
- **Infrastructure**: Vercel (Frontend), Supabase Cloud (Backend)

## Project Conventions

### Code Style
- **Strict Typing**: Mandatory TypeScript strict mode. No implicit `any`.
- **Naming**: PascalCase for Components/Types, camelCase for variables/functions, snake_case for database columns (mappable to camelCase in domain layer).
- **Clean Code**: Small, focused functions; modular component architecture; dry (Don't Repeat Yourself) but with a focus on readability and industrial robustness.
- **Auditability**: All state-changing operations must be traceable.

### Architecture Patterns
- **Multi-Tenant**: Strict isolation using PostgreSQL Row Level Security (RLS) based on `organization_id`.
- **Domain-Driven Design (DDD)**: Logic organized by industrial domains (Production, Lab, Quality, CIP, Microbiology).
- **Dynamic Spec Engine**: Runtime validation of analysis results against product-specific specifications.
- **Trigger-Based Auditing**: Database-level triggers for 21 CFR Part 11 compliant audit trails.
- **Server Actions**: Preferred for data mutations in Next.js.

### Testing Strategy
- **Unit/Integration**: Vitest for core logic and service layers.
- **End-to-End**: Planned usage for critical compliance workflows.

### Git Workflow
- **Branching**: `main` as the source of truth; feature branches for development.
- **Commits**: Conventional Commits standard.
- **Releases**: Automated versioning and changelog generation via `semantic-release`.

## Domain Context
- **Industrial Hierarchy**: Plant -> Production Line -> Production Batch -> Intermediate Product (Tanks) -> Finished Product Lot.
- **LIMS Workflow**: Sample Collection -> Lab Analysis -> Result Validation -> Release/Block Decision.
- **Traceability**: Forward and backward genealogy covering the entire production lifecycle.
- **Compliance**: Adherence to FSSC 22000 and ISO standards is mandatory.

## Important Constraints
- **Data Integrity**: Critical data must never be irreversibly deleted (soft deletes or audit trails required).
- **Regulatory Compliance**: Must support 21 CFR Part 11 (Audit trails, e-signatures).
- **Performance**: Dashboards must provide real-time or near real-time visibility ("Live Floor").
- **Security**: RBAC (Role-Based Access Control) enforced at both UI and Database (RLS) layers.

## External Dependencies
- **Supabase**: Primary backend, Auth, and Realtime infrastructure.
- **Vercel**: Deployment and hosting.
- **OpenAI**: AI-powered analysis validation and insights.
- **PostgreSQL**: Hard dependency on Postgres-specific features (RLS, Triggers, RPC).

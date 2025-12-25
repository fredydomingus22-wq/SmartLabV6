# **SmartLab – Enterprise Architecture (Doc 02)**

> **Objective**: Define the Technical and Logical Architecture for **SmartLab Enterprise**.
> **Standards**: Aligned with `erd_mental.md`, **Production Batch** model, and **Multi-Tenant** isolation.

---

## **1. High-Level Overview**

SmartLab Follows a modern **Industrial Cloud** architecture:

*   **Front-end**: Next.js 15, React 19, Tailwind v4 (Industrial Dark Mode).
*   **Back-end**: Supabase (Postgres 16) + Edge Functions (Node 18).
*   **Data Model**: Strictly Relational, Normalized, Multi-Tenant (`organization_id`).
*   **Security**: RBAC, Row Level Security (RLS), 21 CFR Part 11 Audit Trails.

---

## **2. Physical Architecture**

### **2.1 Core Components**
*   **Client/UI**: Browser-based (Chrome/Edge) for Desktops and Industrial Tablets.
*   **API Layer**: Supabase Auto-generated REST + RPC Stored Procedures.
*   **Database**: PostgreSQL 16 (The "Source of Truth").
*   **State Management**: React Query (Server State) + Zustand (Client Flows).
*   **Realtime**: WebSocket subscriptions for "Live Floor" dashboards.

### **2.2 Diagram**
```mermaid
graph TD
    UI[Browser UI (Next.js)] -->|Auth Token| API[Supabase API Gateway]
    API -->|RLS Policies| DB[(PostgreSQL Database)]
    UI -->|Realtime Sub| DB
    DB -->|Triggers| Edge[Edge Functions]
    Edge -->|Webhooks| External[3rd Party ERP]
```

---

## **3. Logical Architecture (Modules)**

The platform is divided into **9 Core Modules** (matching `Modules.md`):

1.  **Production & Process**: Batches, Intermediate Products (Tanks), Lines.
2.  **LIMS (Laboratory)**: Samples, Analysis, Reagents.
3.  **Raw Materials**: Lots, Suppliers, Receipt.
4.  **Microbiology**: Media, Incubators, Test Sessions.
5.  **Food Safety (FSMS)**: PRPs, PCCs, Hazard Analysis.
6.  **Quality & SPC**: Control Charts, Capability indices.
7.  **CIP (Cleaning)**: Programs, Executions, Validation.
8.  **Traceability**: Genealogy Engine, Audit Logs.
9.  **Admin / Core**: Tenancy, Users, Plants.

---

## **4. Data Architecture**

### **4.1 Core Entities (Ref: `erd_mental.md`)**

#### **Production Branch**
*   `Production Batch` (Parent) → `Intermediate Product` (Child/Tank) → `Intermediate Ingredient` (Consumption).

#### **LIMS Branch**
*   `Sample` (Root) → `Lab Analysis` (Result) → `QA Parameter` (Definition).
*   **Linkage**: `Sample` MUST link to an `Intermediate Product` or `Production Batch` for context.

### **4.2 Dynamic Spec Engine**
To support multi-product flexibility without schema changes:
*   **Parameters**: Defined globally per Plant (e.g., "Brix", "pH").
*   **Specifications**: Defined per Product (e.g., "Coke Zero" has Brix 0.5-0.7).
*   **Validation**: The system compares `Lab Analysis.value` vs. `Product Specification.range` at runtime.

---

## **5. Multi-Tenant Strategy**

**Selected Approach: Row-Level Security (RLS)**

*   **Single Database**: All tenants share the same Postgres instance.
*   **Isolation**: Every table has an `organization_id` column.
*   **Enforcement**: Postgres RLS Policies prevent cross-tenant data leakage at the database engine level.

---

## **6. Security & Governance**

*   **RBAC**: Roles (`admin`, `qa_manager`, `lab_tech`, `operator`) define UI visibility.
*   **RLS**: Database policies define Data access.
*   **Audit Trail**: Trigger-based logging of all INSERT/UPDATE/DELETE.
*   **E-Signature**: Critical actions (Release Batch, Approve Result) require re-authentication (Password/Passkey).

---

## **7. Infrastructure (MVP vs Enterprise)**

### **MVP (Current Phase)**
*   **Frontend**: Vercel Pro.
*   **Backend**: Supabase Pro.

### **Enterprise (Future)**
*   **Frontend**: Dockerized Container in Kubernetes.
*   **Backend**: Self-hosted Supabase or AWS RDS + Lambda.
*   **Connectivity**: VPN / Private Link to Factory network.

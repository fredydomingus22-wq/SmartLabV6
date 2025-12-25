# Information Architecture — SmartLab Enterprise

> **Status**: Draft 1.0

## 1. Sitemap & Hierarchy

The system is organized by **Department/Function**, not by data type.

*   **Dashboard** (Home)
    *   My Tasks (Pending approvals, OOS alerts)
    *   KPI Overview
*   **Lab (LIMS)**
    *   **Samples** (List of all samples)
        *   Registration (New)
        *   Sample Detail (Results, History)
    *   **Worksheets** (Batch result entry)
    *   **Reagents** (Inventory)
*   **Quality (QMS)**
    *   **SPC** (Statistical Process Control Charts)
    *   **Deviations** (Non-Conformances / CAPA)
    *   **Audits** (Supplier & Internal)
*   **Production**
    *   **Batches** (Production Runs)
    *   **Lines & Tanks** (Status monitor)
*   **Reports**
    *   Certificates of Analysis (COA)
    *   Management Reviews
*   **Admin**
    *   User Management
    *   Master Data (Products, Specs)
    *   Audit Logs

## 2. Navigation Rules

*   **Sidebar (Desktop)**: Vertical, collapsible. Icons + Text. Active state clearly highlighted. Groups items by Module.
*   **Mobile Behavior**: Sidebar becomes a bottom sheet or "Hamburger" drawer. Primary actions (Scan QR, Search) move to a Bottom Bar.
*   **Breadcrumbs**: Mandatory on levels deeper than 2.
    *   Ex: `Home > Lab > Samples > AMS-2024-001`
*   **Global Search (Cmd/Ctrl + K)**: Indexed entities:
    *   Sample Codes (`AMS-...`)
    *   Batch Codes (`B-2024...`)
    *   Product Names
    *   Menu Items (Navigation shortcut)

## 3. Route Conventions

URLs must be guessable and bookmarkable.

*   **List Views**: `/[module]/[entity]` -> `/lab/samples`, `/inventory/reagents`
*   **Detail Views**: `/[module]/[entity]/[uuid]` -> `/lab/samples/123-abc`
*   **Creation**: `/[module]/[entity]/new` (Or modal context)
*   **Settings**: `/admin/users`, `/admin/configuration`

**Query Parameters** are used for state (thanks to `nuqs`):
*   Filters: `?status=pending&type=raw_material`
*   Selection: `?tab=results`
*   Search: `?q=sulfuric`

## 4. Permissions & Visibility

We follow a **"See Global, Act Local"** policy, unless restricted by Tenant/Plant.

| Role | Lab Module | QMS Module | Production Module | Admin |
| :--- | :--- | :--- | :--- | :--- |
| **Lab Tech** | **Read/Write** | Read | Read | No Access |
| **QA Manager** | Read/Write + Approve | **Read/Write** | Read | Read |
| **Operator** | Read (Samples) | Read | **Read/Write** | No Access |
| **Auditor** | **Read Only** | **Read Only** | **Read Only** | Read Only (Logs) |
| **Admin** | Read/Write | Read/Write | Read/Write | **Full Access** |

*   **Access Denial**: If a user tries to access a restricted route (e.g., `/admin`), show a dedicated **403 Forbidden** page, not a 404.
*   **Hidden Actions**: Buttons for actions the user cannot perform (e.g., "Approve") should be **hidden**, not disabled, to reduce interface noise (except when teaching the workflow is important).

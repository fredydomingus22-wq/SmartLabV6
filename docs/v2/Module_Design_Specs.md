# V2 Module Design Specifications

This document details the functional and data design for the modules required to reach full compliance with ISO 9001, 22000, FSSC, and 17025.

---

## 📄 1. Document Management System (DMS)
**Objective**: Control "Master Documents" (SOPs, Specs, Methods, Forms) to ensure users only use the latest approved versions.

### Data Model
- `doc_categories`: SOP, Method, Specification, Form, Policy.
- `documents`: Title, Code, Category, Owner, Current Version ID.
- `document_versions`: Version number, Change description, Status (Draft, Review, Approved, Superseded), File path, Effective date, Expiry date.
- `document_approvals`: Link to Version, Approver ID, Role (Reviewer/Approver), Result, Comments, Timestamp (e-signature).

### Logic
- **Workflow**: Draft -> Review -> Approval -> Publish.
- **Superseding**: When a new version is "Published", the previous one is automatically marked "Superseded".
- **Access**: Only "Published" versions are visible to end-users in the "Manuals" section.

---

## 🛠️ 2. Metrology & Equipment Lifecycle
**Objective**: Full control over equipment that affects product quality/safety (Thermometers, Scales, Incubators, HPLC).

### Data Model
- `equipment_registry`: Name, Asset ID, Model, Serial No, Criticality (Critical/Non-critical).
- `maintenance_plans`: Equipment ID, Interval (monthly/annual), Task description, Last performed, Next due.
- `calibration_schedules`: Equipment ID, Frequency, Standard/Method to be used, Max allowable error.
- `maintenance_logs`: Type (Corrective/Preventive), Performed by, Result (Pass/Fail), Certificate/Report Attachment.

### Logic
- **Automatic Scheduling**: System calculates "Next Due" based on frequency and last completion.
- **Out of Service (OOS)**: If an equipment fails calibration/maintenance, it is automatically flagged as "Blocked" for use in Lab Analysis or Production.

---

## 🎓 3. Training & Competency Matrix
**Objective**: Ensure that analysts and operators are qualified for the tasks they perform.

### Data Model
- `competency_requirements`: Mapping of Tasks (e.g., "Protein Analysis") to required training/skills.
- `training_records`: Employee ID, Competency ID, Trainer, Date, Score, Certificate ID.
- `analyst_qualifications`: Employee ID, Task ID, Status (Learning, Qualified, Expert), Expiry date (Re-qualification due).

### Logic
- **Permission Interlock**: Prevent a user from "Approving" an analysis result if they do not have a "Qualified" status for that specific parameter/method.

---

## 🧬 4. Laboratory Quality Control (QC)
**Objective**: Continuous monitoring of measurement reliability (ISO 17025 requirement).

### Data Model
- `qc_samples`: Blanks, Duplicates, Spikes, Reference Materials (CRM).
- `qc_results`: Linked to a "Test Batch" or "Worklist".
- `control_charts`: Moving Average and Standard Deviation of QC results.

### Logic
- **Rule Enforcement**: If a "Blank" or "Control" fails limits, all samples in that batch are flagged for "Review/Retest" automatically.

---

## 📑 5. Unified QMS Interface (NC & CAPA)
**Objective**: Expose the existing backend tables to the frontend for daily management.

### Features
- **NC Dashboard**: Kanban board for Non-conformities (Open -> Investigating -> Action Plan -> Completed -> Verified).
- **8D Builder**: Wizard-style interface to fill the 8D report steps (D1-D8).
- **Auto-link**: Create NC directly from:
    - Failed Lab Result.
    - Failed CIP Cycle.
    - Rejected Raw Material Lot.
    - PCC Deviation in HACCP.

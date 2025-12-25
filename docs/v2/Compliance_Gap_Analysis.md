# Compliance Gap Analysis: V1.5 vs. ISO/FSSC/17025

This document outlines the gaps identified between the current **SmartLab Enterprise (V1.5)** system and the requirements of the standards found in `docs/Normas`.

## 📌 Summary of Standards
- **ISO 9001:2015**: Quality Management System (QMS)
- **ISO 22000 / FSSC 22000 v6**: Food Safety Management System (FSMS)
- **ISO/IEC 17025:2017**: Laboratory Competence

---

## 📊 Gap Analysis Table

| Requirement Area | Standard(s) | Current Implementation (V1.5) | Gap / V2 Requirement |
| :--- | :--- | :--- | :--- |
| **Document Control** | ISO 9001: 7.5<br>ISO 22000: 7.5 | Basic manual file attachments. | **High Gap**: Needs version control, approval workflows, and distribution tracking for SOPs and Methods. |
| **Training & Competence** | ISO 9001: 7.2<br>ISO 17025: 6.2 | Basic User Profiles. | **Medium Gap**: Needs skill matrix, analyst qualification records, and training certificates management. |
| **Equipment Metrology** | ISO 17025: 6.4<br>ISO 22000: 7.1 | Equipment registry with capacity (V1.5). | **Critical Gap**: Needs calibration schedules, maintenance logs, and tracking of measurement uncertainty/error. |
| **NC & CAPA** | ISO 9001: 10.2<br>ISO 22000: 8.9 | `nonconformities`, `capa_actions`, `8D` tables exist. | **Low Gap**: Need UI to manage these and link them to Batches/Samples automatically. |
| **Lab Quality Control** | ISO 17025: 7.7 | Raw analysis results. | **Medium Gap**: Needs logic for internal QC (blanks, duplicates, recovery) and Proficiency Testing (PT) tracking. |
| **Supplier Evaluation** | ISO 9001: 8.4<br>FSSC 22000: 2.5 | Supplier list and Lot quality scoring. | **Low Gap**: Needs formal supplier audit scheduling and document (license) expiry tracking. |
| **Food Fraud/Defense** | FSSC 22000: 2.5 | Not explicitly implemented. | **Medium Gap**: Needs vulnerability/threat assessment (VACCP/TACCP) risk registers. |

---

## 🚀 V2 Priority Modules

1. **Document Management System (DMS)**: Centralized vault for all "Master Documents" (SOPs, Specs, Forms).
2. **Metrology & Equipment Center**: Transition from simple equipment listing to a full lifecycle management (Schedule -> Perform -> Verify).
3. **Analyst Qualification Hub**: Linking training records to lab result permissioning (Only qualified analysts can approve specific tests).
4. **Unified QMS Portal**: UI integration for the existing NC/CAPA/8D backend tables.

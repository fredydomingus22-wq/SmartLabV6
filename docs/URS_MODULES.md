# **User Requirement Specifications (URS) – Functional Modules**

> **Objective**: Define high-level functional requirements for each system module.
> **Reference**: Aligned with `erd_mental.md` (Single Source of Truth).

---

## **1. Production Lines Module**
*   **REQ-001**: Ability to create and configure Production Lines (e.g., "Line 01").
*   **REQ-002**: Edit Line details (status, capacity).
*   **REQ-003**: Activate or Deactivate lines (maintenance mode).

## **2. Products Module**
*   **REQ-004**: Create unique Product definitions (SKU, Name).
*   **REQ-005**: Edit Product metadata.
*   **REQ-006**: Version Control for critical product configurations.
*   **REQ-007**: Mark products as "Obsolete" to prevent future use.

## **3. Parameters Module**
*   **REQ-008**: Create Global QA Parameters (e.g., Brix, pH).
*   **REQ-009**: Edit Parameter definitions (Unit, Data Type).
*   **REQ-010**: Version Control for parameter definitions.
*   **REQ-011**: Link Analytical Methods to Parameters.

## **4. Specifications Module (Spec Engine)**
*   **REQ-012**: Define Specifications linked to a specific Product.
*   **REQ-013**: Version Control for Specifications.
*   **REQ-014**: Define Limits: Minimum, Target, Maximum.
*   **REQ-015**: Mark Specifications as "Obsolete".

## **5. Reagents Module**
*   **REQ-016**: Register Reagent Master Data (Name, CAS, Supplier).
*   **REQ-017**: Record Stock Entry (IN) with Batch & Expiry.
*   **REQ-018**: Record Stock Usage (OUT).
*   **REQ-019**: Automated Stock Balance calculation.

## **6. Production Module (Batches)**
*   **REQ-020**: Create Production Batches (linked to SKU & Line).
*   **REQ-021**: Link Batches to Intermediate Products (Tank Mapping).
*   **REQ-022**: Auto-generate Sampling Plans based on Product Spec.

## **7. Laboratory Module (LIMS)**
*   **REQ-023**: Register Physico-chemical Analysis Results.
*   **REQ-024**: Register Microbiological Analysis Results.
*   **REQ-025**: Traceability of the Technician responsible (Electronic Signature).

## **8. Compliance & Standards Module**
*   **REQ-026**: Support ISO 9001 requirements (Document Control).
*   **REQ-027**: Support ISO 22000 / FSSC 22000 requirements (HACCP).
*   **REQ-028**: Support HACCP Plan digitization (Hazards, PCCs).

## **9. Reporting Module**
*   **REQ-029**: Generate automated Certificates of Analysis (CoA).
*   **REQ-030**: Export reports in PDF, Excel, and HTML formats.

## **10. Intelligent Assistant (IA) Module**
*   **REQ-031**: Trend Analysis (Heatmaps, Control Charts).
*   **REQ-032**: Predictive Analysis (Anomaly Detection).
*   **REQ-033**: Automated Quality Summaries (Narrative generation).

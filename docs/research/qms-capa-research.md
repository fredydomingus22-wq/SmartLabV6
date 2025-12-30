# QMS & CAPA Module Research (Sprint 5)

## 1. Regulatory Context (ISO 9001:2015 Clause 10.2)
Based on ISO 9001:2015, the SmartLab QMS must support:
- **Immediate Reaction**: Correction and containment of the non-conformity.
- **Evaluation**: Determination of the root cause via structured methods (5 Whys, Fishbone).
- **Implementation**: Execution of corrective actions.
- **Effectiveness Review**: Verification that the action actually solved the problem.
- **Risk Integration**: Updating the risk register based on new findings.

## 2. Competitive Benchmarking (InfinityQS & Coca-Cola/PepsiCo)
- **InfinityQS**: Real-time SPC (Statistical Process Control) integration. Alerts trigger immediate NC records.
- **Coke/Pepsi**: "KORE" (Coca-Cola Operating Requirements) and GFSI-recognized certifications (FSSC 22000). Focus on automated data capture and real-time visibility.
- **SmartLab Competitive Advantage**: Seamless integration between Lab (Analysis) -> Production -> QMS with AI-assisted Root Cause Analysis and predictive risk scoring.

## 3. Value Discovery: "Standard" vs. "Smart" Versions

### A. Standard Version (Compliance Focused)
- **NC Creation**: Manual or auto-triggered from failed lab results.
- **Workflow**: Simple state machine (Pending -> Investigating -> Action Required -> Effectiveness Review -> Closed).
- **Documentation**: Basic file attachments and text fields for RCA.
- **Reporting**: Monthly PDF exports of NC status.

### B. Smart/AI-Enhanced Version (Performance Focused)
- **AI-Assisted RCA**: AI analyzes historical data and suggests potential Root Causes (e.g., "Frequent failures on Line 2 with this parameter are often linked to Supplier X").
- **Predictive Deviation**: AI flags "Pre-NC" conditions before a limit is reached based on trend analysis.
- **Automated CAPA Assignments**: System identifies the best-qualified technician for the task based on training records and workload.
- **Real-Time Dashboards**: Interactive SPC charts with drill-down to specific batches.

## 4. Implementation Strategy
1.  **Modularize**: Ensure `non-conformities`, `capa`, and `eight-d` (8D Report) are fully decoupled yet integrated via `entity_id` references.
2.  **Schema Alignment**: Ensure multi-tenant `organization_id` and `plant_id` are strictly enforced.
3.  **UI/UX**: Transition QMS dashboard to the "Industrial Glassmorphism 2.0" design.

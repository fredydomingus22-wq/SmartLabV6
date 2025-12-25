
## SmartLab V4 – Logical Entity Relationship Diagram (Textual Model)

---

## 1. Multi-Tenant Base Structure

```

ORGANIZATION (Tenant)
└── PLANT (Factory)
└── All operational entities

```

Core rule:
Every business entity contains:
- organization_id
- plant_id

---

## 2. Structural & Organizational Entities

```

ORGANIZATION
└── PLANT
├── PLANT_SECTION
├── PRODUCTION_LINE
├── EQUIPMENT
│       └── EQUIPMENT_TYPE (tank, mixer, homogenizer, filler, incubator, etc.)
├── TEAM
├── SHIFT
└── TECHNICIAN (App_User)

```

Relationships:

- One Organization → Many Plants  
- One Plant → Many Sections  
- One Section → Many Equipment  
- One Plant → Many Production Lines  
- One Plant → Many Teams  
- One Team → Many Technicians  

---

## 3. Product & Material Model

```

PRODUCT
├── SPECIFICATION
└── PARAMETER

RAW_MATERIAL
└── RAW_MATERIAL_LOT

PACKAGING_MATERIAL
└── PACKAGING_LOT

```

Relationships:

- One Product → Many Specifications  
- One Specification → One Parameter  
- One Parameter → Many Specifications (across products)  
- One Raw Material → Many Lots  
- One Packaging Material → Many Lots  

---

## 4. Production Core Structure

```

PRODUCTION_BATCH
├── INTERMEDIATE_PRODUCT (Tank / Syrup / Mix / Pre-pasteurization)
│         ├── INTERMEDIATE_INGREDIENT
│         │        └── RAW_MATERIAL_LOT
│         └── EQUIPMENT (Tank / Mixer / Reactor)
└── FINAL_PRODUCT_FLOW
└── PRODUCTION_LINE

```

Key relationships:

- One Production Batch → Many Intermediate Products  
- One Intermediate Product → One Equipment (tank, mixer, etc.)  
- One Intermediate Product → Many Ingredients  
- Each Ingredient → One Raw Material Lot  

---

## 5. Sample Lifecycle (with Sample Type)

### 5.1 Sample Entity

`SAMPLE` represents a physical sample taken in the factory.

It MUST contain:

- organization_id
- plant_id
- intermediate_product_id (FK)
- production_batch_id (FK, resolved via intermediate product)
- sampling_point_id (FK)
- collected_at
- collected_by
- sample_type_id (FK to sample_types)

**sample_type examples** (enumeration):

- `tank` – intermediate tank sample (xaroparia / mistura)  
- `line` – line sample during filling  
- `finished_product` – off-line final product verification  
- `packaging` – sample of packaging material  
- `water` – process or utility water  
- `environment` – environmental hygiene sample  

### 5.2 Relations

```

INTERMEDIATE_PRODUCT
└── SAMPLE
├── SAMPLING_POINT
├── PRODUCTION_BATCH (auto-fetched via Intermediate Product)
├── PRODUCT (auto-fetched via Batch)
└── ANALYSIS_RESULT
└── PARAMETER

```

Rules:

- When a Sample is created, it MUST bind to:
  - An **Intermediate Product** (which automatically resolves its Production Batch)
  - A **Sampling Point**
  - A **sample_type** that identifies the nature and context of the sample

- From Intermediate Product, the system automatically resolves:
  - Production Batch
  - Product

- The system MUST automatically:
  - Load Product
  - Load Parameters applicable to that Product and context
  - Load Specifications for that Product

- One Sample → Many Analysis Results  
- Each Analysis Result → One Parameter  
- Results MUST be tracked **per parameter per sample**

---

## 6. Microbiology Structure

```

MICRO_MEDIA_TYPE (Culture Media Definition)
└── MICRO_MEDIA_LOT (Inventory of media batches)

MICRO_INCUBATOR (Equipment for incubation)
└── MICRO_TEST_SESSION (Incubation run grouping)

SAMPLE
└── MICRO_RESULT (colony count, TNTC, presence/absence)
    ├── MICRO_TEST_SESSION (optional grouping)
    ├── MICRO_MEDIA_LOT (media used)
    ├── PARAMETER (what was tested)
    └── READ_BY (analyst)

```

**Tables Created:**
- `micro_media_types`: Defines media types (PCA, VRB, etc.) with incubation parameters
- `micro_media_lots`: Tracks media inventory with lot codes, expiry dates, quantities
- `micro_incubators`: Equipment registry with setpoint temps and capacity
- `micro_test_sessions`: Groups related tests in same incubation run
- `micro_results`: Stores colony counts and conformity results per sample/parameter

Relationships:

- One Media Type → Many Media Lots  
- One Incubator → Many Test Sessions  
- One Sample → Many Micro Results  
- One Test Session → Many Micro Results  
- One Media Lot → Many Micro Results  
- One Parameter → Many Micro Results

---

## 7. Reagents (Stock Management Model)

```

REAGENT (Master data)
└── REAGENT_MOVEMENT (unified stock tracking)
    ├── movement_type (in/out/adjustment)
    ├── destination_lab (for dispatches)
    └── requested_by (for dispatches)

```

**Tables:**
- `reagents`: Master reagent data (name, CAS number, supplier, storage location, min stock level)
- `reagent_movements`: All stock movements with type discrimination

**Movement Types:**
- `in`: Stock entry (purchase/receipt) - tracks batch_number, expiry_date
- `out`: Stock dispatch to lab - tracks destination_lab, requested_by
- `adjustment`: Stock corrections

Relationships:

- One Reagent → Many Movements  

Rules:

- Current stock = SUM(quantity WHERE type='in') - SUM(quantity WHERE type='out')
- Movements track: quantity, batch_number, expiry_date, notes
- Dispatches additionally track: destination_lab, requested_by
- No linkage to individual analyses (no per-test consumption tracking)  

---

## 8. CIP (Cleaning In Place)

```

CIP_PROGRAM (Cleaning procedure definition)
├── CIP_PROGRAM_STEP (Step definitions with targets)
└── CIP_EXECUTION (Actual cleaning run)
    ├── EQUIPMENT (what was cleaned)
    └── CIP_EXECUTION_STEP (Actual step data)

```

**Tables Created:**
- `cip_programs`: Cleaning program definitions (name, target equipment type)
- `cip_program_steps`: Steps within program (order, name, targets for temp/duration/concentration)
- `cip_executions`: Actual cleaning runs (program, equipment, status, performed_by, verified_by)
- `cip_execution_steps`: Actual step execution data (temps, times, conductivity, status)

Relationships:

- One CIP Program → Many Program Steps  
- One CIP Program → Many Executions  
- One CIP Execution → Many Execution Steps  
- One Equipment → Many CIP Executions  

Data stored per execution step:

- Temperature: target vs actual (avg_temp_c)
- Duration: target vs actual (start_time, end_time)
- Concentration: via avg_conductivity
- Result status: pass/fail/pending

**Status workflow:**
- Executions: `in_progress` → `completed`/`failed`/`aborted`
- Steps: `pending` → `pass`/`fail`

---

## 9. Quality & SPC Structure

```

PARAMETER
└── SPECIFICATION
└── PRODUCT
└── ANALYSIS_RESULT (from SAMPLE)

```

This chain supports:

- SPC Charts (control charts per parameter)  
- Cp / Cpk calculations  
- Trend analysis over time per product / line / batch  

---

## 10. Traceability & Audit

### 10.1 Traceability Chain

```

RAW_MATERIAL_LOT
PACKAGING_LOT
INTERMEDIATE_PRODUCT
PRODUCTION_BATCH
SAMPLE
ANALYSIS_RESULT

```

All can be stitched via:

- `TRACEABILITY_CHAIN` table, allowing:
  - “From finished product back to raw material lot”
  - “From raw material lot to all impacted batches and products”

### 10.2 Audit Trail

All critical entities (Batches, Samples, Specifications, Parameters, Results, CIP Records, Reagent Movements, etc.) must write into:

- `AUDIT_TRAIL`
- `STATUS_HISTORY`

---

## 11. High-Level Logical Flow (End-to-End)

1. **Raw Material** arrives → becomes **Raw Material Lot**  
2. **Batch** is planned for a **Product** on a **Line**  
3. **Intermediate Product (Tank)** is prepared using Raw Material Lots  
4. **Sample** is collected:
   - Bound to Intermediate Product
   - Bound to Sampling Point
   - Assigned a **sample_type**
5. System auto-resolves Product + Specifications + Parameters  
6. Lab records **Analysis Results** per Parameter per Sample  
7. Microbiology runs **Micro Test Sessions** linked to Sample  
8. System generates:
   - SPC charts
   - COAs
   - Non-conformance reports
   - Traceability reports  
9. Audit & status changes logged in **Audit Trail** and **Status History**

---

## 12. Design Principles Summary

- Fully relational data model  
- Strict multi-tenant isolation (organization_id + plant_id everywhere)  
- Clear Sample Type for correct interpretation of results  
- True manufacturing traceability and auditability  
- Ready for ISO 9001 / ISO 22000 / FSSC 22000 and HACCP usage  

---

✅ END OF DOCUMENT
```


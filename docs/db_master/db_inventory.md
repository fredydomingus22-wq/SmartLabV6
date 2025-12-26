# Database Reference: Inventory & Supply Chain

This document details the tables related to procurement, warehouse management, and material tracking.

## Tables

### `raw_materials`
| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `organization_id` | uuid | NO | - |
| `name` | text | NO | - |
| `code` | text | NO | - |
| `category` | text | YES | - |

### `raw_material_lots`
| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `organization_id` | uuid | NO | - |
| `raw_material_id` | uuid | NO | - |
| `lot_number` | text | NO | - |
| `supplier_lot_number` | text | YES | - |
| `quantity_initial` | numeric | NO | - |
| `quantity_remaining` | numeric | NO | - |
| `expiry_date` | date | YES | - |
| `status` | text | NO | 'quarantine' |

### `packaging_materials`
| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `organization_id` | uuid | NO | - |
| `name` | text | NO | - |
| `code` | text | NO | - |

### `packaging_lots`
| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `packaging_material_id` | uuid | NO | - |
| `lot_number` | text | NO | - |
| `quantity_remaining` | numeric | NO | - |

### `reagents`
| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `organization_id` | uuid | NO | - |
| `name` | text | NO | - |
| `code` | text | NO | - |

### `reagent_batches`
| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `reagent_id` | uuid | NO | - |
| `batch_number` | text | NO | - |
| `expiry_date` | date | YES | - |
| `current_stock` | numeric | NO | 0 |

### `suppliers`
| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `organization_id` | uuid | NO | - |
| `name` | text | NO | - |
| `contact_info` | jsonb | YES | - |
| `status` | text | NO | 'active' |

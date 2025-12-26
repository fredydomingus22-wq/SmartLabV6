# Database Reference: Production & MES

This document details the tables related to the manufacturing execution system and production tracking.

## Tables

### `production_batches`
| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `organization_id` | uuid | NO | - |
| `plant_id` | uuid | NO | - |
| `product_id` | uuid | NO | - |
| `production_line_id` | uuid | YES | - |
| `code` | text | NO | - |
| `status` | text | NO | 'planned' |
| `planned_quantity` | numeric | YES | - |
| `actual_quantity` | numeric | YES | - |
| `start_date` | timestamptz | YES | - |
| `end_date` | timestamptz | YES | - |
| `qa_approved_by` | uuid | YES | - |
| `qa_approved_at` | timestamptz | YES | - |
| `supervisor_approved_by` | uuid | YES | - |
| `supervisor_approved_at` | timestamptz | YES | - |

### `production_lines`
| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `organization_id` | uuid | NO | - |
| `plant_id` | uuid | NO | - |
| `name` | text | NO | - |
| `code` | text | NO | - |
| `status` | text | NO | 'active' |

### `products`
| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `organization_id` | uuid | NO | - |
| `name` | text | NO | - |
| `sku` | text | NO | - |
| `category` | text | YES | - |

### `product_history`
| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `product_id` | uuid | NO | - |
| `changed_by` | uuid | NO | - |
| `change_type` | text | NO | - |
| `old_data` | jsonb | YES | - |
| `new_data` | jsonb | YES | - |

### `intermediate_products`
| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `organization_id` | uuid | NO | - |
| `plant_id` | uuid | NO | - |
| `production_batch_id` | uuid | NO | - |
| `equipment_id` | uuid | NO | - |
| `code` | text | NO | - |
| `status` | text | NO | 'pending' |
| `volume` | numeric | YES | - |

### `intermediate_ingredients`
| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `intermediate_product_id` | uuid | NO | - |
| `raw_material_lot_id` | uuid | YES | - |
| `quantity` | numeric | NO | - |

### `batch_packaging_usage`
| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `production_batch_id` | uuid | NO | - |
| `packaging_lot_id` | uuid | NO | - |
| `quantity_used` | numeric | NO | - |

### `equipments`
| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `organization_id` | uuid | NO | - |
| `plant_id` | uuid | NO | - |
| `name` | text | NO | - |
| `code` | text | NO | - |
| `equipment_type` | text | NO | - |
| `status` | text | NO | 'active' |

# Database Schema Reference

This document serves as a comprehensive reference for the database schema of SmartLab V6, aiding in the implementation of the **Traceability Dossier (EPIC 5)** and ensuring accurate table/column references.

## Core Tables

### `user_profiles`
| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | - |
| `organization_id` | uuid | NO | - |
| `plant_id` | uuid | YES | - |
| `role` | user_role | NO | 'lab_tech' |
| `full_name` | text | YES | - |
| `employee_id` | text | YES | - |
| `created_at` | timestamptz | YES | now() |

### `production_batches`
| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `organization_id` | uuid | NO | - |
| `plant_id` | uuid | NO | - |
| `product_id` | uuid | NO | - |
| `batch_number` | text | NO | - |
| `start_date` | timestamptz | YES | - |
| `end_date` | timestamptz | YES | - |
| `status` | text | NO | 'planned' |
| `created_at` | timestamptz | YES | now() |
| `batch_code` | text | YES | - |
| `product_name` | text | YES | - |
| `production_date` | date | YES | - |
| `production_line_id` | uuid | YES | - |
| `quantity` | numeric | YES | - |

### `samples`
| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `organization_id` | uuid | NO | - |
| `plant_id` | uuid | NO | - |
| `sample_type_id` | uuid | NO | - |
| `production_batch_id` | uuid | YES | - |
| `intermediate_product_id` | uuid | YES | - |
| `sampling_point_id` | uuid | YES | - |
| `code` | text | NO | - |
| `collected_at` | timestamptz | NO | - |
| `collected_by` | uuid | YES | - |
| `status` | text | NO | 'pending' |
| `created_at` | timestamptz | YES | now() |

### `lab_analysis`
| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `organization_id` | uuid | NO | - |
| `plant_id` | uuid | NO | - |
| `sample_id` | uuid | NO | - |
| `qa_parameter_id` | uuid | NO | - |
| `value_numeric` | numeric | YES | - |
| `value_text` | text | YES | - |
| `is_conforming` | boolean | YES | - |
| `analyzed_at` | timestamptz | YES | - |
| `analyzed_by` | uuid | YES | - |
| `status` | text | NO | 'in_progress' |
| `signed_transaction_hash` | text | YES | - |

### `intermediate_products` (Tanks)
| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `organization_id` | uuid | NO | - |
| `plant_id` | uuid | NO | - |
| `tank_number` | text | NO | - |
| `status` | text | NO | 'idle' |
| `created_at` | timestamptz | YES | now() |

### `ai_insights`
| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `entity_type` | text | NO | - |
| `entity_id` | uuid | NO | - |
| `insight_type` | text | NO | 'validation' |
| `status` | text | NO | - |
| `message` | text | YES | - |
| `confidence` | numeric | YES | - |
| `raw_response` | jsonb | YES | - |
| `model_used` | text | YES | 'gpt-4o-mini' |
| `processing_time_ms` | integer | YES | - |
| `organization_id` | uuid | NO | - |
| `plant_id` | uuid | YES | - |
| `created_at` | timestamptz | YES | now() |

## Supply Chain & Inventory

### `raw_material_lots`
| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `organization_id` | uuid | NO | - |
| `lot_number` | text | NO | - |
| `expiry_date` | date | YES | - |
| `status` | text | NO | 'quarantine' |

### `batch_ingredients`
| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `batch_id` | uuid | NO | - |
| `lot_id` | uuid | NO | - |
| `quantity` | numeric | NO | - |

### `batch_tanks`
| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `batch_id` | uuid | NO | - |
| `tank_id` | uuid | NO | - |

## Quality & Compliance

### `qa_parameters`
| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `name` | text | NO | - |
| `code` | text | NO | - |
| `unit` | text | YES | - |
| `category` | text | NO | - |

### `product_specifications`
| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `product_id` | uuid | NO | - |
| `qa_parameter_id` | uuid | NO | - |
| `min_value` | numeric | YES | - |
| `max_value` | numeric | YES | - |
| `target_value` | numeric | YES | - |
| `sample_type_id` | uuid | YES | - |

### `generated_reports`
| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `organization_id` | uuid | NO | - |
| `plant_id` | uuid | YES | - |
| `report_type` | text | NO | - |
| `entity_type` | text | NO | - |
| `entity_id` | uuid | NO | - |
| `report_number` | text | NO | - |
| `title` | text | NO | - |
| `report_data` | jsonb | YES | - |
| `generated_by` | uuid | YES | - |
| `status` | text | NO | 'draft' |
| `signed_by` | uuid | YES | - |
| `signed_at` | timestamptz | YES | - |
| `created_at` | timestamptz | YES | now() |

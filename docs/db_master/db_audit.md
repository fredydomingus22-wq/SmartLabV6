# Database Reference: Insights & Auditing

This document details the tables related to AI-powered insights, system logging, training records, and data integrity.

## Tables

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
| `organization_id` | uuid | NO | - |
| `plant_id` | uuid | YES | - |
| `model_used` | text | YES | 'gpt-4o-mini' |

### `audit_logs`
| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `organization_id` | uuid | NO | - |
| `user_id` | uuid | YES | - |
| `action` | text | NO | - |
| `entity_type` | text | NO | - |
| `entity_id` | uuid | YES | - |
| `old_data` | jsonb | YES | - |
| `new_data` | jsonb | YES | - |

### `traceability_chain`
| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `source_batch_id` | uuid | YES | - |
| `target_batch_id` | uuid | YES | - |
| `trace_depth` | integer | NO | 1 |
| `metadata` | jsonb | YES | - |

### `training_records`
| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `employee_id` | uuid | NO | - |
| `training_name` | text | NO | - |
| `completed_at` | date | NO | - |
| `expiry_date` | date | YES | - |
| `status` | text | NO | 'completed' |

### `generated_reports`
| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `organization_id` | uuid | NO | - |
| `plant_id` | uuid | YES | - |
| `report_type` | text | NO | - |
| `entity_id` | uuid | NO | - |
| `status` | text | NO | 'draft' |
| `signed_at` | timestamptz | YES | - |
| `signed_by` | uuid | YES | - |

### `spc_alerts`
| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `organization_id` | uuid | NO | - |
| `parameter_id` | uuid | NO | - |
| `alert_type` | text | NO | - |
| `severity` | text | NO | 'medium' |
| `status` | text | NO | 'active' |

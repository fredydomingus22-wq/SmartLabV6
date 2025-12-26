# Database Reference: Quality & Compliance

This document details the tables related to QMS, ISO compliance, food safety (HACCP), and sanitation.

## Tables

### `nonconformities`
| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `organization_id` | uuid | NO | - |
| `plant_id` | uuid | NO | - |
| `title` | text | NO | - |
| `description` | text | NO | - |
| `source_type` | text | NO | - |
| `severity` | text | NO | 'medium' |
| `status` | text | NO | 'open' |

### `audits`
| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `organization_id` | uuid | NO | - |
| `plant_id` | uuid | NO | - |
| `audit_type` | text | NO | - |
| `scheduled_date` | date | NO | - |
| `status` | text | NO | 'scheduled' |

### `audit_checklists`
| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `organization_id` | uuid | NO | - |
| `name` | text | NO | - |
| `category` | text | YES | - |

### `capa_actions`
| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `nonconformity_id` | uuid | NO | - |
| `action_type` | text | NO | 'corrective' |
| `description` | text | NO | - |
| `assignee_id` | uuid | YES | - |
| `due_date` | date | YES | - |
| `status` | text | NO | 'pending' |

### `haccp_hazards`
| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `organization_id` | uuid | NO | - |
| `name` | text | NO | - |
| `type` | text | NO | 'biological' |
| `severity` | integer | NO | 1 |
| `probability` | integer | NO | 1 |

### `haccp_prp_templates`
| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `organization_id` | uuid | NO | - |
| `name` | text | NO | - |
| `frequency` | text | NO | - |

### `cip_programs`
| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `organization_id` | uuid | NO | - |
| `plant_id` | uuid | NO | - |
| `name` | text | NO | - |
| `target_equipment_type` | text | YES | - |

### `cip_executions`
| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `program_id` | uuid | NO | - |
| `equipment_id` | uuid | NO | - |
| `started_at` | timestamptz | NO | - |
| `status` | text | NO | 'running' |
| `operator_id` | uuid | YES | - |

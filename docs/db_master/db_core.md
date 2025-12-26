# Database Reference: Core & Organization

This document details the tables related to the organizational structure, user management, and workforce.

## Tables

### `organizations`
| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `name` | text | NO | - |
| `slug` | text | NO | - |
| `subscription_tier` | text | YES | 'free' |
| `created_at` | timestamptz | YES | now() |

### `plants`
| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `organization_id` | uuid | NO | - |
| `name` | text | NO | - |
| `location` | text | YES | - |
| `created_at` | timestamptz | YES | now() |

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

### `teams`
| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `organization_id` | uuid | NO | - |
| `plant_id` | uuid | NO | - |
| `name` | text | NO | - |
| `description` | text | YES | - |
| `created_at` | timestamptz | YES | now() |

### `employees`
| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `organization_id` | uuid | NO | - |
| `plant_id` | uuid | NO | - |
| `full_name` | text | NO | - |
| `code` | text | NO | - |
| `role` | text | YES | - |
| `status` | text | NO | 'active' |

### `attendance_logs`
| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `employee_id` | uuid | NO | - |
| `check_in` | timestamptz | NO | - |
| `check_out` | timestamptz | YES | - |
| `organization_id` | uuid | NO | - |
| `plant_id` | uuid | NO | - |

### `shifts`
| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `organization_id` | uuid | NO | - |
| `plant_id` | uuid | NO | - |
| `name` | text | NO | - |
| `start_time` | time | NO | - |
| `end_time` | time | NO | - |

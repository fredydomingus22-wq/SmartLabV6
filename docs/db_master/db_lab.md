# Database Reference: Laboratory & LIMS

This document details the tables related to laboratory operations, quality analysis, and microbiology.

## Tables

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
| `status` | text | NO | 'pending' |
| `collected_at` | timestamptz | NO | - |
| `collected_by` | uuid | YES | - |

### `sample_types`
| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `organization_id` | uuid | NO | - |
| `name` | text | NO | - |
| `code` | text | NO | - |
| `test_category` | text | YES | - |

### `sampling_points`
| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `organization_id` | uuid | NO | - |
| `plant_id` | uuid | YES | - |
| `name` | text | NO | - |
| `code` | text | NO | - |

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

### `qa_parameters`
| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `organization_id` | uuid | NO | - |
| `name` | text | NO | - |
| `code` | text | NO | - |
| `unit` | text | YES | - |

### `product_specifications`
| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `organization_id` | uuid | NO | - |
| `product_id` | uuid | NO | - |
| `qa_parameter_id` | uuid | NO | - |
| `min_value` | numeric | YES | - |
| `max_value` | numeric | YES | - |
| `target_value` | numeric | YES | - |

### `micro_results`
| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `sample_id` | uuid | NO | - |
| `session_id` | uuid | YES | - |
| `count` | numeric | YES | - |
| `is_positive` | boolean | YES | - |
| `judgement` | text | YES | - |

### `micro_test_sessions`
| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `organization_id` | uuid | NO | - |
| `plant_id` | uuid | NO | - |
| `media_lot_id` | uuid | NO | - |
| `incubator_id` | uuid | YES | - |
| `started_at` | timestamptz | NO | - |
| `expected_at` | timestamptz | YES | - |

### `micro_media_types`
| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `organization_id` | uuid | NO | - |
| `name` | text | NO | - |
| `code` | text | NO | - |
| `target_organism` | text | YES | - |

### `micro_media_lots`
| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `media_type_id` | uuid | NO | - |
| `lot_number` | text | NO | - |
| `expiry_date` | date | NO | - |
| `status` | text | NO | 'active' |

### `micro_incubators`
| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `organization_id` | uuid | NO | - |
| `plant_id` | uuid | NO | - |
| `name` | text | NO | - |
| `temperature_target` | numeric | YES | - |

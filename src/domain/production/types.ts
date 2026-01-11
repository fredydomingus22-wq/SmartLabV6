export interface ProductionOrder {
    id: string;
    code: string;
    product_id: string;
    planned_quantity: number;
    status: 'draft' | 'planned' | 'in_progress' | 'completed' | 'cancelled';
    start_date?: string;
    unit?: string;
}

export interface ProductionBatch {
    id: string;
    code: string;
    status: string;
    planned_quantity: number;
    spec_version_id?: string;
    product_id?: string;
}

export interface ProductionEvent {
    id: string;
    production_batch_id: string;
    event_type: string;
}

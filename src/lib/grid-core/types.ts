/**
 * @smartlab/grid-core: Industrial Headless Grid Engine
 * Mission: Replace AG Grid Enterprise with a proprietary, audit-ready engine.
 */

export type GridStatus = 'valid' | 'invalid' | 'blocked' | 'readonly';

export interface AuditEvent {
    id: string;
    entityType: string;
    entityId: string;
    columnId: string;
    oldValue: any;
    newValue: any;
    userId: string;
    timestamp: string;
    requiresSignature: boolean;
    justification?: string;
    signature?: string;
}

export interface CellState {
    value: any;
    originalValue: any;
    status: GridStatus;
    isDirty: boolean;
    error?: string;
    requiresSignature: boolean;
}

export interface RowState<T> {
    id: string;
    data: T;
    cells: Record<string, CellState>;
    status: GridStatus;
    isExpanded: boolean;
    isGroup: boolean;
    level: number;
    auditHistory: AuditEvent[];
}

export interface ColumnDefinition<T> {
    id: string;
    header: string;
    field: keyof T | string;
    width?: number;
    editable?: boolean;
    requiresSignature?: boolean;
    validation?: (value: any, row: T) => string | undefined;
    aggregation?: 'sum' | 'avg' | 'count' | 'status';
}

export interface GridState<T> {
    data: T[];
    columns: ColumnDefinition<T>[];
    rows: RowState<T>[];
    selection: Set<string>;
    loading: boolean;
    pagination: {
        page: number;
        pageSize: number;
        total: number;
    };
    grouping: string[];
}

export type GridAction =
    | { type: 'SET_DATA', data: any[] }
    | { type: 'UPDATE_CELL', rowId: string, colId: string, value: any, audit: AuditEvent }
    | { type: 'TOGGLE_ROW', rowId: string }
    | { type: 'SET_SELECTION', ids: string[] }
    | { type: 'SET_LOADING', loading: boolean };

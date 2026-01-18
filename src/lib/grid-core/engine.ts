import { GridState, ColumnDefinition, RowState, CellState, AuditEvent, GridAction } from './types';

export class GridEngine<T extends { id: string }> {
    private state: GridState<T>;
    private onStateChange: (state: GridState<T>) => void;

    constructor(
        data: T[],
        columns: ColumnDefinition<T>[],
        onStateChange: (state: GridState<T>) => void
    ) {
        this.onStateChange = onStateChange;
        this.state = this.initializeState(data, columns);
        this.notify();
    }

    private initializeState(data: T[], columns: ColumnDefinition<T>[]): GridState<T> {
        const rows: RowState<T>[] = data.map(item => ({
            id: item.id,
            data: item,
            cells: this.initializeCells(item, columns),
            status: 'valid',
            isExpanded: false,
            isGroup: false,
            level: 0,
            auditHistory: []
        }));

        return {
            data,
            columns,
            rows,
            selection: new Set(),
            loading: false,
            pagination: {
                page: 1,
                pageSize: 20,
                total: data.length
            },
            grouping: []
        };
    }

    private initializeCells(item: T, columns: ColumnDefinition<T>[]): Record<string, CellState> {
        const cells: Record<string, CellState> = {};
        columns.forEach(col => {
            const value = (item as any)[col.field];
            cells[col.id] = {
                value,
                originalValue: value,
                status: 'valid',
                isDirty: false,
                requiresSignature: col.requiresSignature || false
            };
        });
        return cells;
    }

    public updateCell(rowId: string, colId: string, newValue: any, userId: string): void {
        const row = this.state.rows.find(r => r.id === rowId);
        if (!row) return;

        const cell = row.cells[colId];
        if (!cell) return;

        const oldValue = cell.value;
        if (oldValue === newValue) return;

        // Generate Audit Event
        const auditEvent: AuditEvent = {
            id: crypto.randomUUID(),
            entityType: 'grid-mutation',
            entityId: rowId,
            columnId: colId,
            oldValue,
            newValue,
            userId,
            timestamp: new Date().toISOString(),
            requiresSignature: cell.requiresSignature
        };

        // Update State
        cell.value = newValue;
        cell.isDirty = true;
        row.auditHistory.push(auditEvent);

        // Run validation if defined
        const colDef = this.state.columns.find(c => c.id === colId);
        if (colDef?.validation) {
            const error = colDef.validation(newValue, row.data);
            cell.error = error;
            cell.status = error ? 'invalid' : 'valid';
        }

        this.notify();
    }

    public toggleRow(rowId: string): void {
        const row = this.state.rows.find(r => r.id === rowId);
        if (row) {
            row.isExpanded = !row.isExpanded;
            this.notify();
        }
    }

    public setSelection(ids: string[] | Set<string>): void {
        this.state.selection = new Set(ids);
        this.notify();
    }

    private notify() {
        // In a real implementation, we would deep clone or use immutable state patterns
        // For this POC, we'll notify with the current state object.
        this.onStateChange({ ...this.state });
    }

    public getState(): GridState<T> {
        return this.state;
    }
}

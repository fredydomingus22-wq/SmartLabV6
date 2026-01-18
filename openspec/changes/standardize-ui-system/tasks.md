# Tasks: UI Standardization

## Phase 1: Foundation & Navigation
- [x] Create `PageShell`, `PageHeader`, `KPICard`, `ChartCard` global components [/]
- [x] Refactor `Sidebar` navigation to use grouped modules defined in design.md [ ]
- [x] Implement `navigation.ts` updates to reflect strict module hierarchy [ ]
- [x] **Verification**: Audit new sidebar against legacy to ensure NO routes are missing [ ]

## Phase 2: QMS Module Migration
## Phase 2: QMS Module Migration
- [x] Migrate `/quality/qms` root to Tabbed Layout [x]
- [x] Refactor `NC List` to use `TableCard` [x]
- [x] Refactor `CAPA` views to use `PageHeader` standard [x]

## Phase 3: LIMS Module Migration
- [x] Migrate `/lab/samples` to Tabbed Layout (List/Kanban) [x]
- [x] Standardize `SampleDetail` view with standard Cards [x]

## Phase 4: Production & Assets
- [ ] Update `/production` dashboards to use `KPICard` (h-120px) [ ]
- [ ] Standardize Asset Management lists [ ]

## Phase 5: Global Polish
- [ ] Audit all 4px grid alignments [ ]
- [ ] Verify Mobile/Tablet responsiveness for new components [ ]

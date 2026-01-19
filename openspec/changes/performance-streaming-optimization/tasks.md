# Performance Optimization Tasks

## 🏗️ Infrastructure
- [x] Create `src/providers/query-provider.tsx`
- [x] Integrate `QueryProvider` in `src/app/layout.tsx`
- [ ] Implement `getOrganizationId()` utility for safe client-side keys [/]

## ⚡ Module: Reports (Pilot)
- [ ] Refactor `src/app/(dashboard)/reports/page.tsx`:
    - [ ] Move `getDashboardSamples`, `getLabStats` etc. to a separate Server Component [ ]
    - [ ] Wrap with `Suspense` and `HydrationBoundary` [ ]
- [ ] Optimize `lib/queries/reports.ts`:
    - [ ] Limit `select()` fields to reduce payload size [ ]
    - [ ] Implement pagination in list queries [ ]

## ⚡ Module: Lab
- [ ] Refactor `src/app/(dashboard)/lab/page.tsx`:
    - [ ] remove `force-dynamic` if possible [/]
    - [ ] Use `useSuspenseQuery` in `DashboardClient` [/]

## 🎨 UI/UX Refinement
- [x] Create `components/ui/skeleton-loader.tsx` with premium glassmorphism pulse
- [x] Implement `prefetch={true}` in `AppSidebar` for instant navigation feels
- [x] Update `components/layout/app-sidebar.tsx` to prefetch active routes:
    - [ ] Prefetch "Reports" on dash hover [ ]
    - [ ] Prefetch "Lab" on dash hover [ ]

## 🧪 Verification
- [ ] Run Lighthouse Audit for TBT (Total Blocking Time) [ ]
- [ ] Verify "Back" navigation is 0ms (Cache hit) [ ]

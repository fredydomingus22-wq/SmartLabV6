-- Comprehensive RLS Policies for Document Management System (DMS)
-- This ensures users can Create, Read, Update and Delete documents within their organization

-- 1. doc_categories
DROP POLICY IF EXISTS "Users can view doc_categories in their org" ON public.doc_categories;
CREATE POLICY "Users can manage doc_categories in their org"
    ON public.doc_categories FOR ALL
    USING (organization_id IN (SELECT organization_id FROM public.user_profiles WHERE id = auth.uid()))
    WITH CHECK (organization_id IN (SELECT organization_id FROM public.user_profiles WHERE id = auth.uid()));

-- 2. documents
DROP POLICY IF EXISTS "Users can view documents in their org" ON public.documents;
CREATE POLICY "Users can manage documents in their org"
    ON public.documents FOR ALL
    USING (organization_id IN (SELECT organization_id FROM public.user_profiles WHERE id = auth.uid()))
    WITH CHECK (organization_id IN (SELECT organization_id FROM public.user_profiles WHERE id = auth.uid()));

-- 3. document_versions
DROP POLICY IF EXISTS "Users can view document_versions in their org" ON public.document_versions;
CREATE POLICY "Users can manage document_versions in their org"
    ON public.document_versions FOR ALL
    USING (organization_id IN (SELECT organization_id FROM public.user_profiles WHERE id = auth.uid()))
    WITH CHECK (organization_id IN (SELECT organization_id FROM public.user_profiles WHERE id = auth.uid()));

-- 4. document_approvals
DROP POLICY IF EXISTS "Users can view document_approvals in their org" ON public.document_approvals;
CREATE POLICY "Users can manage document_approvals in their org"
    ON public.document_approvals FOR ALL
    USING (version_id IN (SELECT id FROM public.document_versions WHERE organization_id IN (SELECT organization_id FROM public.user_profiles WHERE id = auth.uid())))
    WITH CHECK (version_id IN (SELECT id FROM public.document_versions WHERE organization_id IN (SELECT organization_id FROM public.user_profiles WHERE id = auth.uid())));

-- 5. doc_reading_logs
DROP POLICY IF EXISTS "Users can view their own reading logs" ON public.doc_reading_logs;
DROP POLICY IF EXISTS "Managers can view all reading logs in org" ON public.doc_reading_logs;
CREATE POLICY "Users can manage reading logs in their org"
    ON public.doc_reading_logs FOR ALL
    USING (organization_id IN (SELECT organization_id FROM public.user_profiles WHERE id = auth.uid()))
    WITH CHECK (organization_id IN (SELECT organization_id FROM public.user_profiles WHERE id = auth.uid()));

-- 6. doc_periodic_reviews
DROP POLICY IF EXISTS "Users can view periodic reviews in their org" ON public.doc_periodic_reviews;
CREATE POLICY "Users can manage periodic reviews in their org"
    ON public.doc_periodic_reviews FOR ALL
    USING (organization_id IN (SELECT organization_id FROM public.user_profiles WHERE id = auth.uid()))
    WITH CHECK (organization_id IN (SELECT organization_id FROM public.user_profiles WHERE id = auth.uid()));

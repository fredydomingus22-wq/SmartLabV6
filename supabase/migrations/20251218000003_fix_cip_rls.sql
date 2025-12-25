-- Enable RLS for INSERT, UPDATE, DELETE on cip_programs

CREATE POLICY "Enable insert for authenticated users with valid org" ON public.cip_programs FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    organization_id = (SELECT organization_id FROM public.user_profiles WHERE id = auth.uid())
);

CREATE POLICY "Enable update for users of same org" ON public.cip_programs FOR UPDATE USING (
    organization_id = (SELECT organization_id FROM public.user_profiles WHERE id = auth.uid())
) WITH CHECK (
    organization_id = (SELECT organization_id FROM public.user_profiles WHERE id = auth.uid())
);

CREATE POLICY "Enable delete for users of same org" ON public.cip_programs FOR DELETE USING (
     organization_id = (SELECT organization_id FROM public.user_profiles WHERE id = auth.uid())
);

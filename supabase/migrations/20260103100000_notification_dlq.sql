create table if not exists notification_logs (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid references organizations(id),
    target_role text not null,
    title text not null,
    status text check (status in ('sent', 'failed')) not null,
    error_message text,
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz default now()
);

-- RLS: Ops/Admins only
alter table notification_logs enable row level security;

create policy "Admins can view notification logs"
    on notification_logs for select
    using (
        exists (
            select 1 from user_profiles
            where user_profiles.id = auth.uid()
            and user_profiles.role in ('admin', 'system_owner', 'qa_manager')
        )
    );

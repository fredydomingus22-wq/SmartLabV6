alter table lab_analysis add column if not exists notes text;
comment on column lab_analysis.notes is 'User comments or justification for the result, required for OOS';

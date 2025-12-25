# URS_GLOBAL.md

## 1. Visão Geral

SmartLab v4 é uma plataforma SaaS multi-tenant de gestão de qualidade para indústrias de bebidas, lácteos e alimentos.

O sistema combina:

- LIMS (Laboratory Information Management System)
- QMS (ISO 9001:2015)
- FSMS (ISO 22000 / FSSC 22000)
- HACCP
- SPC (Statistical Process Control)
- Inteligência Artificial para análise preditiva

## 2. Objetivo

Automatizar e digitalizar totalmente o controlo de qualidade industrial, reduzindo em até 80% o esforço de implementação e manutenção de normas como ISO 9001, ISO 22000, FSSC 22000 e HACCP.

## 3. Arquitetura Geral

- SaaS multi-tenant
- Tenant = empresa (grupo)
- Plant = fábrica
- Stack moderna:
  - Next.js 15
  - React 19
  - Supabase PostgreSQL 16
  - Tailwind CSS

- Row Level Security (RLS) obrigatório

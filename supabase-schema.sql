create table if not exists public.app_settings (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  nome_atelier text not null default '',
  custo_hora_mao_de_obra numeric(12, 2) not null default 0,
  custo_energia_kwh numeric(12, 4) not null default 0,
  despesas_fixas_mensais numeric(12, 2) not null default 0,
  horas_produtivas_mensais numeric(12, 2) not null default 1,
  margem_padrao_pct numeric(8, 4) not null default 0,
  custo_design_hora numeric(12, 2) not null default 0,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.materials (
  owner_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  sort_order integer not null default 0,
  nome text not null,
  categoria text not null default '',
  unidade text not null default 'g',
  custo_unitario numeric(12, 4) not null default 0,
  estoque_atual numeric(12, 4) not null default 0,
  estoque_minimo numeric(12, 4) not null default 0,
  fornecedor text not null default '',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (owner_id, id)
);

create table if not exists public.packagings (
  owner_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  sort_order integer not null default 0,
  nome text not null,
  tipo text not null default '',
  custo_unitario numeric(12, 4) not null default 0,
  estoque_atual numeric(12, 4) not null default 0,
  estoque_minimo numeric(12, 4) not null default 0,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (owner_id, id)
);

create table if not exists public.marketplaces (
  owner_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  sort_order integer not null default 0,
  nome text not null,
  tipo text not null default '',
  comissao_pct numeric(8, 4) not null default 0,
  taxa_pagamento_pct numeric(8, 4) not null default 0,
  despesa_variavel_pct numeric(8, 4) not null default 0,
  tarifa_fixa numeric(12, 4) not null default 0,
  teto_tarifa numeric(12, 4) not null default 0,
  cobrar_comissao_sobre_tarifa boolean not null default false,
  quantidade_minima integer not null default 1,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (owner_id, id)
);

create table if not exists public.marketplace_rules (
  owner_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  marketplace_id text not null,
  sort_order integer not null default 0,
  faixa_de numeric(12, 4) not null default 0,
  faixa_ate numeric(12, 4),
  comissao_pct numeric(8, 4) not null default 0,
  tarifa_fixa numeric(12, 4) not null default 0,
  teto_tarifa numeric(12, 4) not null default 0,
  cobrar_comissao_sobre_tarifa boolean not null default false,
  quantidade_minima integer not null default 1,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (owner_id, id),
  constraint marketplace_rules_marketplace_fk
    foreign key (owner_id, marketplace_id)
    references public.marketplaces(owner_id, id)
    on delete cascade
);

create table if not exists public.products (
  owner_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  sort_order integer not null default 0,
  nome text not null,
  categoria text not null default '',
  descricao text not null default '',
  destaque text not null default '',
  ativo boolean not null default true,
  imagem_url text not null default '',
  imagem_nome_arquivo text not null default '',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (owner_id, id)
);

create table if not exists public.product_materials (
  owner_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  product_id text not null,
  material_id text not null,
  sort_order integer not null default 0,
  quantidade numeric(12, 4) not null default 0,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (owner_id, id),
  constraint product_materials_product_fk
    foreign key (owner_id, product_id)
    references public.products(owner_id, id)
    on delete cascade,
  constraint product_materials_material_fk
    foreign key (owner_id, material_id)
    references public.materials(owner_id, id)
    on delete cascade
);

create table if not exists public.product_packagings (
  owner_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  product_id text not null,
  packaging_id text not null,
  sort_order integer not null default 0,
  quantidade numeric(12, 4) not null default 0,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (owner_id, id),
  constraint product_packagings_product_fk
    foreign key (owner_id, product_id)
    references public.products(owner_id, id)
    on delete cascade,
  constraint product_packagings_packaging_fk
    foreign key (owner_id, packaging_id)
    references public.packagings(owner_id, id)
    on delete cascade
);

create table if not exists public.product_variants (
  owner_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  product_id text not null,
  sort_order integer not null default 0,
  nome text not null,
  largura_mm numeric(12, 4) not null default 0,
  altura_mm numeric(12, 4) not null default 0,
  profundidade_mm numeric(12, 4) not null default 0,
  multiplicador_material numeric(12, 4) not null default 1,
  horas_producao numeric(12, 4) not null default 0,
  consumo_energia_kwh numeric(12, 4) not null default 0,
  custo_extra numeric(12, 4) not null default 0,
  margem_sugerida_pct numeric(8, 4) not null default 0,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (owner_id, id),
  constraint product_variants_product_fk
    foreign key (owner_id, product_id)
    references public.products(owner_id, id)
    on delete cascade
);

create table if not exists public.quotes (
  owner_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  sort_order integer not null default 0,
  cliente text not null default '',
  criado_em timestamptz not null default now(),
  observacoes text not null default '',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (owner_id, id)
);

create table if not exists public.quote_items (
  owner_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  quote_id text not null,
  sort_order integer not null default 0,
  product_id text not null,
  variant_id text not null,
  marketplace_id text not null,
  packaging_id text,
  quantidade numeric(12, 4) not null default 1,
  margem_override_pct numeric(8, 4),
  observacoes text not null default '',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (owner_id, id),
  constraint quote_items_quote_fk
    foreign key (owner_id, quote_id)
    references public.quotes(owner_id, id)
    on delete cascade,
  constraint quote_items_product_fk
    foreign key (owner_id, product_id)
    references public.products(owner_id, id)
    on delete cascade,
  constraint quote_items_variant_fk
    foreign key (owner_id, variant_id)
    references public.product_variants(owner_id, id)
    on delete cascade,
  constraint quote_items_marketplace_fk
    foreign key (owner_id, marketplace_id)
    references public.marketplaces(owner_id, id)
    on delete cascade,
  constraint quote_items_packaging_fk
    foreign key (owner_id, packaging_id)
    references public.packagings(owner_id, id)
    on delete set null
);

create index if not exists idx_materials_owner_sort on public.materials(owner_id, sort_order);
create index if not exists idx_packagings_owner_sort on public.packagings(owner_id, sort_order);
create index if not exists idx_marketplaces_owner_sort on public.marketplaces(owner_id, sort_order);
create index if not exists idx_marketplace_rules_owner_marketplace on public.marketplace_rules(owner_id, marketplace_id, sort_order);
create index if not exists idx_products_owner_sort on public.products(owner_id, sort_order);
create index if not exists idx_product_materials_owner_product on public.product_materials(owner_id, product_id, sort_order);
create index if not exists idx_product_packagings_owner_product on public.product_packagings(owner_id, product_id, sort_order);
create index if not exists idx_product_variants_owner_product on public.product_variants(owner_id, product_id, sort_order);
create index if not exists idx_quotes_owner_sort on public.quotes(owner_id, sort_order);
create index if not exists idx_quote_items_owner_quote on public.quote_items(owner_id, quote_id, sort_order);

create table if not exists public.app_states (
  owner_id uuid not null references auth.users(id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (owner_id)
);

alter table public.app_settings enable row level security;
alter table public.materials enable row level security;
alter table public.packagings enable row level security;
alter table public.marketplaces enable row level security;
alter table public.marketplace_rules enable row level security;
alter table public.products enable row level security;
alter table public.product_materials enable row level security;
alter table public.product_packagings enable row level security;
alter table public.product_variants enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;
alter table public.app_states enable row level security;

create policy "usuarios leem as proprias configuracoes"
on public.app_settings
for select
using (auth.uid() = owner_id);

create policy "usuarios inserem as proprias configuracoes"
on public.app_settings
for insert
with check (auth.uid() = owner_id);

create policy "usuarios atualizam as proprias configuracoes"
on public.app_settings
for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

create policy "usuarios removem as proprias configuracoes"
on public.app_settings
for delete
using (auth.uid() = owner_id);

create policy "usuarios leem os proprios materiais"
on public.materials
for select
using (auth.uid() = owner_id);

create policy "usuarios inserem os proprios materiais"
on public.materials
for insert
with check (auth.uid() = owner_id);

create policy "usuarios atualizam os proprios materiais"
on public.materials
for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

create policy "usuarios removem os proprios materiais"
on public.materials
for delete
using (auth.uid() = owner_id);

create policy "usuarios leem as proprias embalagens"
on public.packagings
for select
using (auth.uid() = owner_id);

create policy "usuarios inserem as proprias embalagens"
on public.packagings
for insert
with check (auth.uid() = owner_id);

create policy "usuarios atualizam as proprias embalagens"
on public.packagings
for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

create policy "usuarios removem as proprias embalagens"
on public.packagings
for delete
using (auth.uid() = owner_id);

create policy "usuarios leem os proprios marketplaces"
on public.marketplaces
for select
using (auth.uid() = owner_id);

create policy "usuarios inserem os proprios marketplaces"
on public.marketplaces
for insert
with check (auth.uid() = owner_id);

create policy "usuarios atualizam os proprios marketplaces"
on public.marketplaces
for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

create policy "usuarios removem os proprios marketplaces"
on public.marketplaces
for delete
using (auth.uid() = owner_id);

create policy "usuarios leem as proprias regras de marketplace"
on public.marketplace_rules
for select
using (auth.uid() = owner_id);

create policy "usuarios inserem as proprias regras de marketplace"
on public.marketplace_rules
for insert
with check (auth.uid() = owner_id);

create policy "usuarios atualizam as proprias regras de marketplace"
on public.marketplace_rules
for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

create policy "usuarios removem as proprias regras de marketplace"
on public.marketplace_rules
for delete
using (auth.uid() = owner_id);

create policy "usuarios leem os proprios produtos"
on public.products
for select
using (auth.uid() = owner_id);

create policy "usuarios inserem os proprios produtos"
on public.products
for insert
with check (auth.uid() = owner_id);

create policy "usuarios atualizam os proprios produtos"
on public.products
for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

create policy "usuarios removem os proprios produtos"
on public.products
for delete
using (auth.uid() = owner_id);

create policy "usuarios leem os proprios consumos de materiais"
on public.product_materials
for select
using (auth.uid() = owner_id);

create policy "usuarios inserem os proprios consumos de materiais"
on public.product_materials
for insert
with check (auth.uid() = owner_id);

create policy "usuarios atualizam os proprios consumos de materiais"
on public.product_materials
for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

create policy "usuarios removem os proprios consumos de materiais"
on public.product_materials
for delete
using (auth.uid() = owner_id);

create policy "usuarios leem as proprias opcoes de embalagem"
on public.product_packagings
for select
using (auth.uid() = owner_id);

create policy "usuarios inserem as proprias opcoes de embalagem"
on public.product_packagings
for insert
with check (auth.uid() = owner_id);

create policy "usuarios atualizam as proprias opcoes de embalagem"
on public.product_packagings
for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

create policy "usuarios removem as proprias opcoes de embalagem"
on public.product_packagings
for delete
using (auth.uid() = owner_id);

create policy "usuarios leem as proprias variacoes"
on public.product_variants
for select
using (auth.uid() = owner_id);

create policy "usuarios inserem as proprias variacoes"
on public.product_variants
for insert
with check (auth.uid() = owner_id);

create policy "usuarios atualizam as proprias variacoes"
on public.product_variants
for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

create policy "usuarios removem as proprias variacoes"
on public.product_variants
for delete
using (auth.uid() = owner_id);

create policy "usuarios leem os proprios orcamentos"
on public.quotes
for select
using (auth.uid() = owner_id);

create policy "usuarios inserem os proprios orcamentos"
on public.quotes
for insert
with check (auth.uid() = owner_id);

create policy "usuarios atualizam os proprios orcamentos"
on public.quotes
for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

create policy "usuarios removem os proprios orcamentos"
on public.quotes
for delete
using (auth.uid() = owner_id);

create policy "usuarios leem os proprios itens de orcamento"
on public.quote_items
for select
using (auth.uid() = owner_id);

create policy "usuarios inserem os proprios itens de orcamento"
on public.quote_items
for insert
with check (auth.uid() = owner_id);

create policy "usuarios atualizam os proprios itens de orcamento"
on public.quote_items
for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

create policy "usuarios removem os proprios itens de orcamento"
on public.quote_items
for delete
using (auth.uid() = owner_id);

create policy "usuarios leem o proprio estado legado"
on public.app_states
for select
using (auth.uid() = owner_id);

create policy "usuarios inserem o proprio estado legado"
on public.app_states
for insert
with check (auth.uid() = owner_id);

create policy "usuarios atualizam o proprio estado legado"
on public.app_states
for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

-- Retiros de ganancia de la casa (registro manual del admin)
create table if not exists house_withdrawals (
  id uuid primary key default gen_random_uuid(),
  amount numeric(10,2) not null check (amount > 0),
  note text,
  created_at timestamptz default now()
);

alter table house_withdrawals enable row level security;

-- Solo acceso via service role (endpoints admin)

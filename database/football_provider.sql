-- Columna provider en partidos de jornada: indica con que proveedor de
-- futbol se creo cada partido ('apifootball' | 'apisports').
-- Los partidos existentes quedan como 'apifootball' para que el sync siga
-- consultando al proveedor correcto mientras ese servicio este activo.
alter table admin_jornada_partidos
  add column if not exists provider varchar(20) not null default 'apifootball';

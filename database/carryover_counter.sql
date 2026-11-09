-- Contador de acumulaciones consecutivas de la bolsa de 2do lugar.
-- Regla: si la bolsa se acumula 2 jornadas seguidas del mismo tipo,
-- en la tercera se reparte obligatoriamente sin importar el numero
-- de empatados. Al repartirse, el contador vuelve a 0.
alter table prize_carryover
  add column if not exists consecutive_count integer not null default 0;

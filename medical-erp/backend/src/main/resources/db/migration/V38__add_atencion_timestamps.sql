ALTER TABLE citas
  ADD COLUMN inicio_atencion DATETIME NULL AFTER asistio_confirmed_at,
  ADD COLUMN fin_atencion DATETIME NULL AFTER inicio_atencion;

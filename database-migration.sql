-- ========================================
-- MIGRACIÓN DE BASE DE DATOS
-- Agregar columna invitation_route a tabla events
-- ========================================

-- 1. Agregar la nueva columna invitation_route
ALTER TABLE events ADD COLUMN invitation_route VARCHAR(255) NULL;

-- 2. Insertar el evento "Cumple de Alessia 3" (si no existe)
-- NOTA: Ejecutar solo si el evento no existe aún
INSERT INTO events (id, name, description, event_date, invitation_route, created_at) 
VALUES (
    gen_random_uuid(), 
    'Cumple de Alessia 3', 
    'Celebración del tercer cumpleaños de Alessia', 
    '2026-03-15 15:00:00', 
    'invites/turns3/turns3.html',
    NOW()
);

-- 3. Actualizar evento existente con la ruta (si ya existe)
-- NOTA: Ejecutar solo si el evento ya existe en la base de datos
UPDATE events 
SET invitation_route = 'invites/turns3/turns3.html' 
WHERE name = 'Cumple de Alessia 3';

-- ========================================
-- VERIFICACIÓN
-- ========================================

-- Verificar que la columna se agregó correctamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'events' AND column_name = 'invitation_route';

-- Verificar los datos actuales
SELECT id, name, invitation_route, created_at 
FROM events 
ORDER BY created_at DESC;
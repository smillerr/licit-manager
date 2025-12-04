
-- Insertar un usuario estándar (No admin)
-- Puedes cambiar el email y password según necesites
INSERT INTO app_users (email, password, name, role)
VALUES ('usuario@test.com', '123456', 'Usuario Estándar', 'user')
ON CONFLICT (email) DO NOTHING;


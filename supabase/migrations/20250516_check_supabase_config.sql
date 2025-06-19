-- Проверяем конфигурацию Supabase
SELECT current_database();

-- Проверяем версию PostgreSQL
SELECT version();

-- Проверяем права доступа к базе данных
SELECT 
    rolname,
    rolsuper,
    rolinherit,
    rolcreaterole,
    rolcreatedb,
    rolcanlogin
FROM pg_roles
WHERE rolname = current_user;

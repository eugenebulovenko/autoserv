-- Обновляем роль пользователя на admin
DO $$ 
BEGIN
  -- Обновляем роль в таблице profiles
  UPDATE profiles 
  SET role = 'admin'
  WHERE id = (SELECT id FROM auth.users WHERE email = 'bulov@example.com'); -- Замените на ваш email

  -- Создаем профиль, если его еще нет
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = (SELECT id FROM auth.users WHERE email = 'bulov@example.com') -- Замените на ваш email
  ) THEN
    INSERT INTO profiles (id, first_name, last_name, phone, role)
    SELECT 
      id,
      'Администратор',
      'Системы',
      null,
      'admin'
    FROM auth.users 
    WHERE email = 'bulov@example.com'; -- Замените на ваш email
  END IF;
END $$; 
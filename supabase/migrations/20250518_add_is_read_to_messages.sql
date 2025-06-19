-- Добавление поля is_read в таблицу messages для поддержки уведомлений о прочтении
alter table public.messages
add column if not exists is_read boolean not null default false;

-- Индекс для быстрого поиска непрочитанных сообщений
create index if not exists idx_messages_is_read on public.messages(is_read);

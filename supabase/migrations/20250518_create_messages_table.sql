-- Создание таблицы сообщений между пользователями
create table if not exists public.messages (
    id uuid primary key default gen_random_uuid(),
    sender_id uuid references profiles(id) on delete cascade,
    receiver_id uuid references profiles(id) on delete cascade,
    content text not null,
    created_at timestamp with time zone default timezone('utc', now())
);

-- Индексы для ускорения поиска
create index if not exists idx_messages_sender on public.messages(sender_id);
create index if not exists idx_messages_receiver on public.messages(receiver_id);
create index if not exists idx_messages_created_at on public.messages(created_at);

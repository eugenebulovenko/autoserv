-- Миграция: создание таблицы новостей
create table if not exists news (
    id uuid primary key default gen_random_uuid(),
    created_at timestamp with time zone default now() not null,
    title text not null,
    body text not null,
    image_url text not null,
    button_text text,
    button_link text,
    published boolean not null default true,
    "order" integer
);

-- Индекс для сортировки по order/created_at
create index if not exists idx_news_order_created_at on news ("order", created_at desc);

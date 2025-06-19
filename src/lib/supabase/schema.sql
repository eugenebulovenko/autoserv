-- Создание таблицы mechanics
CREATE TABLE IF NOT EXISTS public.mechanics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Создание таблицы clients
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Создание таблицы services
CREATE TABLE IF NOT EXISTS public.services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    duration INTEGER NOT NULL, -- в минутах
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Создание таблицы work_orders
CREATE TABLE IF NOT EXISTS public.work_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES public.clients(id),
    mechanic_id UUID NOT NULL REFERENCES public.mechanics(id),
    status TEXT NOT NULL DEFAULT 'pending',
    total_amount DECIMAL(10,2) DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Создание таблицы work_order_services
CREATE TABLE IF NOT EXISTS public.work_order_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    work_order_id UUID NOT NULL REFERENCES public.work_orders(id),
    service_id UUID NOT NULL REFERENCES public.services(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Создание индексов
CREATE INDEX IF NOT EXISTS idx_work_orders_client_id ON public.work_orders(client_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_mechanic_id ON public.work_orders(mechanic_id);
CREATE INDEX IF NOT EXISTS idx_work_order_services_work_order_id ON public.work_order_services(work_order_id);
CREATE INDEX IF NOT EXISTS idx_work_order_services_service_id ON public.work_order_services(service_id);

-- Добавление RLS политик
ALTER TABLE public.mechanics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_services ENABLE ROW LEVEL SECURITY;

-- Политики для mechanics
CREATE POLICY "Публичный доступ к mechanics" ON public.mechanics
    FOR SELECT USING (true);

-- Политики для clients
CREATE POLICY "Публичный доступ к clients" ON public.clients
    FOR SELECT USING (true);

-- Политики для services
CREATE POLICY "Публичный доступ к services" ON public.services
    FOR SELECT USING (true);

-- Политики для work_orders
CREATE POLICY "Публичный доступ к work_orders" ON public.work_orders
    FOR SELECT USING (true);

-- Политики для work_order_services
CREATE POLICY "Публичный доступ к work_order_services" ON public.work_order_services
    FOR SELECT USING (true); 
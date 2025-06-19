import { supabase } from '@/lib/supabase';

export interface NewsItem {
  id: string;
  created_at: string;
  title: string;
  body: string;
  image_url: string;
  button_text?: string;
  button_link?: string;
  published: boolean;
  order?: number;
}

export async function getPublishedNews(): Promise<NewsItem[]> {
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .eq('published', true)
    .order('order', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createNews(news: Partial<NewsItem>) {
  const { data, error } = await supabase.from('news').insert([news]).select();
  if (error) throw error;
  return data?.[0];
}

export async function updateNews(id: string, updates: Partial<NewsItem>) {
  const { data, error } = await supabase.from('news').update(updates).eq('id', id).select();
  if (error) throw error;
  return data?.[0];
}

export async function deleteNews(id: string) {
  const { error } = await supabase.from('news').delete().eq('id', id);
  if (error) throw error;
}

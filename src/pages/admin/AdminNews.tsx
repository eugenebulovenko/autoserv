import React, { useEffect, useState } from 'react';
import { getPublishedNews, createNews, updateNews, deleteNews, NewsItem } from '@/services/newsService';
import { Button } from '@/components/ui/button';

const emptyNews: Partial<NewsItem> = {
  title: '',
  body: '',
  image_url: '',
  button_text: '',
  button_link: '',
  published: true,
};

const AdminNews: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [form, setForm] = useState<Partial<NewsItem>>(emptyNews);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchNews = async () => {
    setLoading(true);
    const data = await getPublishedNews();
    setNews(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setLoading(true);
    if (editingId) {
      await updateNews(editingId, form);
    } else {
      await createNews(form);
    }
    setForm(emptyNews);
    setEditingId(null);
    fetchNews();
  };

  const handleEdit = (item: NewsItem) => {
    setForm(item);
    setEditingId(item.id);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Удалить новость?')) {
      await deleteNews(id);
      fetchNews();
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Новости</h1>
      <div className="bg-white rounded-xl shadow p-4 mb-8 max-w-xl">
        <input
          className="w-full mb-2 p-2 border rounded"
          name="title"
          placeholder="Заголовок"
          value={form.title}
          onChange={handleChange}
        />
        <textarea
          className="w-full mb-2 p-2 border rounded"
          name="body"
          placeholder="Текст новости"
          value={form.body}
          onChange={handleChange}
        />
        <input
          className="w-full mb-2 p-2 border rounded"
          name="image_url"
          placeholder="Ссылка на картинку"
          value={form.image_url}
          onChange={handleChange}
        />
        <input
          className="w-full mb-2 p-2 border rounded"
          name="button_text"
          placeholder="Текст кнопки (необязательно)"
          value={form.button_text}
          onChange={handleChange}
        />
        <input
          className="w-full mb-2 p-2 border rounded"
          name="button_link"
          placeholder="Ссылка кнопки (необязательно)"
          value={form.button_link}
          onChange={handleChange}
        />
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={loading}>
            {editingId ? 'Сохранить' : 'Добавить'}
          </Button>
          {editingId && (
            <Button variant="outline" onClick={() => { setForm(emptyNews); setEditingId(null); }}>
              Отмена
            </Button>
          )}
        </div>
      </div>
      <div>
        {loading ? 'Загрузка...' : news.map((item) => (
          <div key={item.id} className="bg-white rounded shadow p-4 mb-4 flex flex-col md:flex-row gap-4 items-center">
            <img src={item.image_url} alt={item.title} className="w-32 h-20 object-cover rounded" />
            <div className="flex-1">
              <div className="font-semibold text-lg">{item.title}</div>
              <div className="text-gray-600 text-sm line-clamp-2">{item.body}</div>
              {item.button_text && (
                <a href={item.button_link} target="_blank" rel="noopener noreferrer" className="text-primary underline text-sm">{item.button_text}</a>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>Редактировать</Button>
              <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id)}>Удалить</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminNews;

import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getPublishedNews, NewsItem } from '@/services/newsService';
import MainLayout from '@/layouts/MainLayout';

const NewsDetail = () => {
  const { id } = useParams();
  const [news, setNews] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const all = await getPublishedNews();
        const found = all.find(n => String(n.id) === String(id));
        setNews(found || null);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) return (
    <MainLayout>
      <div className="min-h-[40vh] flex items-center justify-center">Загрузка...</div>
    </MainLayout>
  );
  if (!news) return (
    <MainLayout>
      <div className="min-h-[40vh] flex items-center justify-center text-muted-foreground">Новость не найдена</div>
    </MainLayout>
  );

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto pt-32 pb-16 px-4">
        <img src={news.image_url} alt={news.title} className="w-full rounded-2xl shadow mb-8 max-h-96 object-cover" />
        <h1 className="text-3xl md:text-5xl font-bold mb-6 text-primary drop-shadow-lg">{news.title}</h1>
        <div className="text-muted-foreground mb-4">{news.created_at && new Date(news.created_at).toLocaleDateString('ru-RU')}</div>
        <div className="prose prose-lg max-w-none text-foreground" dangerouslySetInnerHTML={{__html: news.body}} />
        {news.button_text && news.button_link && (
          <a href={news.button_link} target="_blank" rel="noopener noreferrer" className="inline-block mt-8 px-8 py-3 rounded-full bg-gradient-to-r from-primary to-secondary text-white font-semibold shadow hover:scale-105 transition-transform duration-300">
            {news.button_text}
          </a>
        )}
      </div>
    </MainLayout>
  );
};

export default NewsDetail;

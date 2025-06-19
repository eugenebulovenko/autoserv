import React, { useState, useEffect } from 'react';
import { getPublishedNews, NewsItem } from '@/services/newsService';
import { Button } from '@/components/ui/button';

const AUTO_SLIDE_INTERVAL = 7000;

const NewsCarousel: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublishedNews().then((data) => {
      setNews(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (news.length < 2) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % news.length);
    }, AUTO_SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, [news]);

  if (loading) return <div className="w-full h-72 flex items-center justify-center">Загрузка...</div>;
  if (!news.length) return <div className="w-full h-72 flex items-center justify-center">Нет новостей</div>;

  const item = news[current];

  return (
    <div className="relative rounded-[2.5rem] shadow-3xl bg-white/80 backdrop-blur-md overflow-hidden flex flex-col md:flex-row items-stretch min-h-[420px] max-h-[520px] border-4 border-transparent bg-clip-padding group transition-all duration-300 hover:shadow-[0_16px_64px_0_rgba(60,60,130,0.24),0_3px_16px_0_rgba(0,0,0,0.14)] hover:scale-[1.025] hover:border-gradient-to-br hover:from-primary hover:to-secondary hover:border-2 hover:outline-none hover:ring-4 hover:ring-primary/20" style={{boxShadow: '0 8px 48px 0 rgba(60,60,130,0.18), 0 1.5px 8px 0 rgba(0,0,0,0.10)'}}>
      <div className="md:w-1/2 flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/20 relative">
        <div className="absolute inset-0 rounded-3xl border-4 border-gradient-to-br from-primary to-secondary opacity-30 pointer-events-none group-hover:opacity-60 group-hover:scale-105 transition-all duration-300"></div>
        <img
          src={item.image_url}
          alt={item.title}
          className="object-cover w-full h-96 md:h-[520px] md:w-auto max-h-[520px] transition-all duration-700 rounded-2xl shadow-xl group-hover:scale-105"
          loading="lazy"
          style={{filter: 'brightness(0.96)'}}
        />
      </div>
      <div className="md:w-1/2 flex flex-col justify-center p-8 md:p-14 animate-fade-in">
        <h2 className="text-3xl md:text-5xl font-extrabold mb-6 text-primary drop-shadow-lg transition-all duration-700 animate-fade-in-up">{item.title}</h2>
        <p className="text-lg md:text-xl text-gray-800 mb-8 line-clamp-6 animate-fade-in-up transition-all duration-700 delay-150">{item.body}</p>
        {item.button_text && item.button_link && (
          <Button asChild className="rounded-full px-10 py-4 text-lg font-bold shadow-lg bg-gradient-to-r from-primary to-secondary text-white hover:scale-105 transition-transform duration-300">
            <a href={item.button_link} target="_blank" rel="noopener noreferrer">{item.button_text}</a>
          </Button>
        )}
        <div className="flex gap-3 mt-8 justify-center md:justify-start">
          {news.map((_, idx) => (
            <button
              key={idx}
              className={`w-4 h-4 rounded-full border-2 border-primary/60 transition-all duration-300 ${idx === current ? 'bg-gradient-to-br from-primary to-secondary border-none shadow-md scale-110' : 'bg-white/80'}`}
              onClick={() => setCurrent(idx)}
              aria-label={`Перейти к новости ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default NewsCarousel;

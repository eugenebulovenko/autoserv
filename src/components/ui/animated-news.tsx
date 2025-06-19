import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { getPublishedNews, NewsItem } from "@/services/newsService";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Newspaper } from "lucide-react";

export const AnimatedNews = ({
  autoplay = false,
  className,
}: {
  autoplay?: boolean;
  className?: string;
}) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [active, setActive] = useState(0);
  const [expanded, setExpanded] = useState<number|null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublishedNews().then((data) => {
      setNews(data);
      setLoading(false);
    });
  }, []);

  const handleNext = () => {
    setActive((prev) => (prev + 1) % news.length);
  };

  const handlePrev = () => {
    setActive((prev) => (prev - 1 + news.length) % news.length);
  };

  useEffect(() => {
    if (autoplay && news.length > 1) {
      const interval = setInterval(handleNext, 6000);
      return () => clearInterval(interval);
    }
  }, [autoplay, news.length]);

  const isActive = (index: number) => index === active;
  const randomRotateY = () => Math.floor(Math.random() * 21) - 10;

  if (loading) return <div className="w-full h-80 flex items-center justify-center text-muted-foreground">Загрузка...</div>;
  if (!news.length) return <div className="w-full h-80 flex items-center justify-center text-muted-foreground">Нет новостей</div>;

  return (
    <div className={cn("max-w-sm md:max-w-4xl mx-auto px-4 md:px-8 lg:px-12 py-12", className)}>
      <div className="relative grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20">
        {/* Левая колонка: картинка и анимация */}
        <div>
          <div className="relative h-72 md:h-80 w-full">
            <AnimatePresence>
              {news.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{
                    opacity: 0,
                    scale: 0.92,
                    z: -100,
                    rotate: randomRotateY(),
                  }}
                  animate={{
                    opacity: isActive(index) ? 1 : 0.7,
                    scale: isActive(index) ? 1 : 0.95,
                    z: isActive(index) ? 0 : -100,
                    rotate: isActive(index) ? 0 : randomRotateY(),
                    zIndex: isActive(index) ? 999 : news.length + 2 - index,
                    y: isActive(index) ? [0, -80, 0] : 0,
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.9,
                    z: 100,
                    rotate: randomRotateY(),
                  }}
                  transition={{
                    duration: 0.4,
                    ease: "easeInOut",
                  }}
                  className="absolute inset-0 origin-bottom"
                >
                  <img
                    src={item.image_url}
                    alt={item.title}
                    draggable={false}
                    className="h-full w-full rounded-3xl object-cover object-center border-4 border-primary/20 shadow-lg"
                  />
                  <div className="absolute top-4 left-4 bg-primary/90 text-white rounded-full px-3 py-1 flex items-center gap-2 text-xs font-bold shadow-md">
                    <Newspaper className="w-4 h-4" /> Новость
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
        {/* Правая колонка: текст и кнопки */}
        <div className="flex justify-between flex-col py-4">
          <motion.div
            key={active}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              {news[active].title}
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              {new Date(news[active].created_at).toLocaleDateString()}
            </p>
            {/* Краткое или полное описание в зависимости от expanded */}
            {expanded === active ? (
              <>
                <motion.div className="text-lg text-muted-foreground mt-4 whitespace-pre-line mb-4">
                  {news[active].body}
                </motion.div>
                <div className="flex flex-wrap gap-4 mt-4">
                  <Button
                    asChild
                    className="rounded-full px-8 py-3 text-base font-semibold bg-gradient-to-r from-primary to-secondary text-white shadow-lg hover:scale-105 transition-transform duration-300"
                  >
                    <a href={"/news/" + news[active].id}>
                      Перейти к новости
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-full px-8 py-3 text-base font-semibold mt-0"
                    onClick={() => setExpanded(null)}
                  >
                    Свернуть
                  </Button>
                </div>
              </>
            ) : (
              <>
                <motion.p className="text-lg text-muted-foreground mt-4 line-clamp-5">
                  {news[active].body}
                </motion.p>
                <Button
                  variant="ghost"
                  className="rounded-full px-8 py-3 text-base font-semibold mt-8 border border-primary text-primary hover:bg-primary/10"
                  onClick={() => setExpanded(active)}
                >
                  Читать полностью
                </Button>
              </>
            )}
            {news[active].button_link && expanded === active && (
              <Button asChild className="rounded-full px-8 py-3 text-base font-semibold mt-4 bg-gradient-to-r from-primary to-secondary text-white shadow-lg hover:scale-105 transition-transform duration-300">
                <a href={news[active].button_link} target="_blank" rel="noopener noreferrer">
                  {news[active].button_text || 'Подробнее'}
                </a>
              </Button>
            )}
          </motion.div>
          <div className="flex gap-4 pt-12 md:pt-0">
            <button
              onClick={handlePrev}
              className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center group/button"
              aria-label="Предыдущая новость"
            >
              <ArrowLeft className="h-5 w-5 text-foreground group-hover/button:rotate-12 transition-transform duration-300" />
            </button>
            <button
              onClick={handleNext}
              className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center group/button"
              aria-label="Следующая новость"
            >
              <ArrowRight className="h-5 w-5 text-foreground group-hover/button:-rotate-12 transition-transform duration-300" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

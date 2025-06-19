import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ChevronDown, Clock, Calendar, Shield } from "lucide-react";
import { AnimatedNews } from "@/components/ui/animated-news";

const Hero = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Небольшая задержка для анимации после монтирования компонента
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const scrollToServices = () => {
    const servicesSection = document.getElementById("services");
    if (servicesSection) {
      servicesSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/5 rounded-full filter blur-3xl animate-spin-slow"></div>
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-primary/10 rounded-full filter blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-secondary rounded-full filter blur-3xl opacity-50"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div
            className={`transition-all duration-700 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in">
              Современный подход к обслуживанию автомобиля
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6 leading-tight">
              Интеллектуальный{" "}
              <span className="text-primary">автосервис</span> нового поколения
            </h1>
            <p className="text-lg text-foreground/80 mb-8 max-w-xl leading-relaxed">
              Автоматизированная система управления автосервисом с интуитивным
              интерфейсом для клиентов, администраторов и механиков
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Button asChild size="lg" className="rounded-full shadow-lg shadow-primary/20">
                <Link to="/booking">Записаться онлайн</Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="rounded-full"
                onClick={scrollToServices}
              >
                Узнать больше
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                {
                  icon: Clock,
                  title: "Экономия времени",
                  description: "Онлайн запись без очередей",
                },
                {
                  icon: Calendar,
                  title: "Удобство",
                  description: "Отслеживание статуса ремонта",
                },
                {
                  icon: Shield,
                  title: "Надежность",
                  description: "Прозрачность всех процессов",
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className={`flex items-start space-x-3 transition-all duration-700 delay-${
                    index + 1
                  }00 ${
                    isVisible
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-10"
                  }`}
                >
                  <div className="bg-primary/10 rounded-full p-2 text-primary">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-foreground/70">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className={`rounded-2xl transition-all duration-700 delay-300 ${
              isVisible
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-10"
            }`}
          >
            <div className="relative">
              <div className="w-full h-full absolute top-4 left-4 bg-primary/10 rounded-2xl"></div>
              <div className="glass rounded-2xl p-6 shadow-xl relative z-10">
  <AnimatedNews autoplay />
</div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDown className="h-6 w-6 text-primary" />
      </div>
    </section>
  );
};

export default Hero;

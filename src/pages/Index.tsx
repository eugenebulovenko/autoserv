import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Hero from "@/components/Hero";
import NewsCarousel from "@/components/NewsCarousel";
import ServiceCard from "@/components/ServiceCard";
import MainLayout from "@/layouts/MainLayout";
import {
  Users,
  Calendar,
  ClipboardList,
  Timer,
  Wrench,
  CreditCard,
  BarChart3,
  ChevronRight,
  ArrowRight,
  Car,
  Settings,
  Hammer,
} from "lucide-react";

const Index = () => {
  const [isVisible, setIsVisible] = useState({
    features: false,
    modules: false,
    cta: false,
  });

  useEffect(() => {
    const handleScroll = () => {
      const featuresSection = document.getElementById("features");
      const modulesSection = document.getElementById("services");
      const ctaSection = document.getElementById("cta");

      if (featuresSection) {
        const rect = featuresSection.getBoundingClientRect();
        setIsVisible((prev) => ({
          ...prev,
          features: rect.top < window.innerHeight * 0.75,
        }));
      }

      if (modulesSection) {
        const rect = modulesSection.getBoundingClientRect();
        setIsVisible((prev) => ({
          ...prev,
          modules: rect.top < window.innerHeight * 0.75,
        }));
      }

      if (ctaSection) {
        const rect = ctaSection.getBoundingClientRect();
        setIsVisible((prev) => ({
          ...prev,
          cta: rect.top < window.innerHeight * 0.75,
        }));
      }
    };

    window.addEventListener("scroll", handleScroll);
    // Запустить один раз при монтировании для проверки видимости
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const serviceModules = [
    {
      id: 1,
      title: "Управление клиентами",
      description:
        "Полное управление клиентской базой, историей обслуживания автомобилей и программой лояльности",
      icon: <Users className="h-6 w-6" />,
      link: "/clients",
    },
    {
      id: 2,
      title: "Онлайн-запись",
      description:
        "Интерактивный календарь для выбора даты и времени с автоматическим расчетом стоимости",
      icon: <Calendar className="h-6 w-6" />,
      link: "/booking",
    },
    {
      id: 3,
      title: "Управление заказами",
      description:
        "Создание заказ-нарядов, калькуляция работ и запчастей, назначение мастеров",
      icon: <ClipboardList className="h-6 w-6" />,
      link: "/orders",
    },
    {
      id: 4,
      title: "Отслеживание ремонта",
      description:
        "Отображение статуса работ в реальном времени с фотоотчетами и уведомлениями",
      icon: <Timer className="h-6 w-6" />,
      link: "/tracking",
    },
    {
      id: 5,
      title: "Управление запчастями",
      description:
        "Интеграция со складской системой, отслеживание запчастей и автоматический заказ",
      icon: <Wrench className="h-6 w-6" />,
      link: "/parts",
    },
    {
      id: 6,
      title: "Оплата и финансы",
      description:
        "Онлайн-оплата услуг, формирование отчетов и интеграция с бухгалтерией",
      icon: <CreditCard className="h-6 w-6" />,
      link: "/finance",
    },
    {
      id: 7,
      title: "Бизнес-аналитика",
      description:
        "Статистика загрузки сервиса, анализ услуг и отчеты по эффективности персонала",
      icon: <BarChart3 className="h-6 w-6" />,
      link: "/analytics",
    },
  ];

  return (
    <MainLayout>
      <div className="pt-16">
        <Hero />

        {/* Features Section */}
        <section id="features" className="section-padding bg-secondary">
          <div className="container mx-auto max-w-7xl">
            <div
              className={`text-center max-w-3xl mx-auto mb-16 transition-all duration-700 transform ${
                isVisible.features
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
            >
              <span className="text-primary text-sm font-medium px-3 py-1 rounded-full bg-primary/10 mb-4 inline-block">
                Функциональность
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Три пользовательских роли для эффективной работы
              </h2>
              <p className="text-foreground/70 leading-relaxed">
                Система разработана с учетом потребностей всех участников
                процесса: клиентов, администраторов и механиков. Каждая роль
                имеет специализированный интерфейс и набор функций.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {[
                {
                  title: "Клиенты",
                  description:
                    "Онлайн-запись, отслеживание статуса ремонта, история обслуживания и удобная оплата услуг",
                  icon: <Car />,
                  steps: [
                    "Регистрация в системе",
                    "Запись на сервис",
                    "Отслеживание статуса ремонта",
                    "Получение уведомлений",
                    "Оплата услуг",
                    "Просмотр истории",
                  ],
                  delay: 0,
                },
                {
                  title: "Администраторы",
                  description:
                    "Управление расписанием, заказ-нарядами, клиентской базой и формирование отчетности",
                  icon: <Settings />,
                  steps: [
                    "Управление расписанием",
                    "Обработка заявок",
                    "Создание заказ-нарядов",
                    "Назначение мастеров",
                    "Расчет стоимости",
                    "Контроль выполнения",
                  ],
                  delay: 100,
                },
                {
                  title: "Механики",
                  description:
                    "Просмотр заданий, отметки о ходе выполнения работ и запрос необходимых запчастей",
                  icon: <Hammer />,
                  steps: [
                    "Просмотр назначенных работ",
                    "Получение информации",
                    "Отметка о выполнении",
                    "Добавление фотоотчетов",
                    "Запрос запчастей",
                    "Передача на проверку",
                  ],
                  delay: 200,
                },
              ].map((role, index) => (
                <div
                  key={index}
                  className={`glass rounded-xl p-6 transition-all duration-700 delay-${
                    role.delay
                  } transform ${
                    isVisible.features
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-10"
                  }`}
                >
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-5">
                    {role.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{role.title}</h3>
                  <p className="text-foreground/70 text-sm mb-6">
                    {role.description}
                  </p>
                  <div className="space-y-2">
                    {role.steps.map((step, idx) => (
                      <div
                        key={idx}
                        className="flex items-center text-sm text-foreground/70"
                      >
                        <div className="h-1.5 w-1.5 bg-primary rounded-full mr-2"></div>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Modules Section */}
        <section id="services" className="section-padding">
          <div className="container mx-auto max-w-7xl">
            <div
              className={`text-center max-w-3xl mx-auto mb-16 transition-all duration-700 transform ${
                isVisible.modules
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
            >
              <span className="text-primary text-sm font-medium px-3 py-1 rounded-full bg-primary/10 mb-4 inline-block">
                Функциональные модули
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Комплексное решение для автоматизации автосервиса
              </h2>
              <p className="text-foreground/70 leading-relaxed">
                Наша система предлагает полный набор инструментов для
                эффективного управления всеми аспектами работы современного
                автосервиса
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {serviceModules.map((module, index) => (
                <ServiceCard
                  key={module.id}
                  title={module.title}
                  description={module.description}
                  icon={module.icon}
                  link={module.link}
                  delay={index * 100}
                />
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="cta" className="section-padding bg-primary text-white">
          <div
            className={`container mx-auto max-w-6xl transition-all duration-700 transform ${
              isVisible.cta
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
                  Готовы перевести свой автосервис на новый уровень?
                </h2>
                <p className="text-white/90 mb-8 text-lg leading-relaxed">
                  Присоединяйтесь к сотням автосервисов, которые уже используют
                  нашу систему для оптимизации рабочих процессов, увеличения
                  продаж и повышения качества обслуживания клиентов.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    asChild
                    size="lg"
                    variant="secondary"
                    className="rounded-full font-medium text-primary"
                  >
                    <Link to="/register">
                      Начать использование
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="rounded-full border-white/20 text-white hover:bg-white/10"
                  >
                    <Link to="/contact">Связаться с нами</Link>
                  </Button>
                </div>
              </div>
              <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm">
                <div className="space-y-4">
                  {[
                    "Увеличение эффективности на 35%",
                    "Сокращение времени обслуживания клиентов на 45%",
                    "Повышение удовлетворенности клиентов на 40%",
                    "Увеличение среднего чека на 25%",
                    "Сокращение административных расходов на 30%",
                  ].map((stat, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-white/5 rounded-lg"
                    >
                      <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0">
                        <ChevronRight className="h-4 w-4" />
                      </div>
                      <span className="font-medium">{stat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-4 bg-foreground text-white">
          <div className="container mx-auto max-w-7xl">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="md:col-span-2">
                <div className="flex items-center gap-2 text-xl font-semibold mb-4">
                  <span className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                    A
                  </span>
                  <span>АвтоСервис</span>
                </div>
                <p className="text-white/70 mb-6 max-w-md">
                  Автоматизированная система управления автосервисом с интуитивным
                  интерфейсом для клиентов, администраторов и механиков
                </p>
                <div className="flex space-x-4">
                  {["Twitter", "Facebook", "Instagram", "LinkedIn"].map(
                    (social) => (
                      <a
                        key={social}
                        href="#"
                        className="text-white/60 hover:text-white transition-colors"
                      >
                        {social}
                      </a>
                    )
                  )}
                </div>
              </div>

              <div>
                <h5 className="font-medium mb-4">О компании</h5>
                <ul className="space-y-2">
                  {["О нас", "Команда", "Карьера", "Контакты"].map((item) => (
                    <li key={item}>
                      <a
                        href="#"
                        className="text-white/60 hover:text-white transition-colors text-sm"
                      >
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h5 className="font-medium mb-4">Полезные ссылки</h5>
                <ul className="space-y-2">
                  {[
                    "Документация",
                    "Цены",
                    "Блог",
                    "FAQ",
                    "Политика конфиденциальности",
                  ].map((item) => (
                    <li key={item}>
                      <a
                        href="#"
                        className="text-white/60 hover:text-white transition-colors text-sm"
                      >
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-12 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center">
              <p className="text-white/60 text-sm mb-4 md:mb-0">
                © 2025 АвтоСервис. Все права защищены.
              </p>
              <div className="flex space-x-6">
                <a
                  href="#"
                  className="text-white/60 hover:text-white transition-colors text-sm"
                >
                  Условия использования
                </a>
                <a
                  href="#"
                  className="text-white/60 hover:text-white transition-colors text-sm"
                >
                  Политика конфиденциальности
                </a>
                <a
                  href="#"
                  className="text-white/60 hover:text-white transition-colors text-sm"
                >
                  Cookies
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </MainLayout>
  );
};

export default Index;

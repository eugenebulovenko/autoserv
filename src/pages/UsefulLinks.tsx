
import MainLayout from "@/layouts/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, File, FileQuestion, Github, HelpCircle, Info, Link2 } from "lucide-react";

const sections = [
  {
    title: "Юридическая информация",
    links: [
      {
        title: "Политика конфиденциальности",
        url: "/privacy",
        icon: Info,
        description: "Информация о том, как мы обрабатываем ваши персональные данные",
      },
      {
        title: "Пользовательское соглашение",
        url: "/terms",
        icon: File,
        description: "Условия использования нашего сервиса",
      },
      {
        title: "Правила возврата и отмены услуг",
        url: "/refund-policy",
        icon: FileQuestion,
        description: "Информация о политике возврата и отмены заказов",
      },
    ],
  },
  {
    title: "Полезная информация",
    links: [
      {
        title: "Часто задаваемые вопросы",
        url: "/faq",
        icon: HelpCircle,
        description: "Ответы на часто задаваемые вопросы о наших услугах",
      },
      {
        title: "Руководство пользователя",
        url: "/user-guide",
        icon: File,
        description: "Подробная инструкция по использованию нашего сервиса",
      },
      {
        title: "Отзывы клиентов",
        url: "/reviews",
        icon: Github,
        description: "Отзывы и рекомендации от наших клиентов",
      },
    ],
  },
  {
    title: "Внешние ресурсы",
    links: [
      {
        title: "Блог об уходе за автомобилем",
        url: "https://example.com/blog",
        external: true,
        icon: ExternalLink,
        description: "Полезные статьи о правильном уходе за вашим автомобилем",
      },
      {
        title: "База знаний по ремонту",
        url: "https://example.com/knowledge-base",
        external: true,
        icon: ExternalLink,
        description: "Обширная база знаний по ремонту различных марок автомобилей",
      },
      {
        title: "Форум автомобилистов",
        url: "https://example.com/forum",
        external: true,
        icon: Link2,
        description: "Сообщество автомобилистов, где можно задать вопросы и получить советы",
      },
    ],
  },
];

const UsefulLinks = () => {
  return (
    <MainLayout>
      <div className="min-h-screen pt-28 pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold mb-3">Полезные ссылки</h1>
            <p className="text-foreground/70 max-w-2xl mx-auto">
              Подборка полезных ресурсов и документов для наших клиентов
            </p>
          </div>
          
          <div className="space-y-16">
            {sections.map((section, index) => (
              <div key={index}>
                <h2 className="text-2xl font-bold mb-6">{section.title}</h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {section.links.map((link, i) => (
                    <Card key={i} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center text-lg">
                          {link.icon && <link.icon className="h-5 w-5 mr-2 text-primary" />}
                          {link.title}
                          {link.external && (
                            <ExternalLink className="h-4 w-4 ml-2 text-muted-foreground" />
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground text-sm mb-4">{link.description}</p>
                        <a
                          href={link.url}
                          target={link.external ? "_blank" : "_self"}
                          rel={link.external ? "noopener noreferrer" : ""}
                          className="text-primary text-sm hover:underline inline-flex items-center"
                        >
                          Перейти
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="ml-1"
                          >
                            <path d="m9 18 6-6-6-6" />
                          </svg>
                        </a>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-16 text-center">
            <h2 className="text-2xl font-bold mb-3">Не нашли нужную информацию?</h2>
            <p className="text-foreground/70 max-w-2xl mx-auto mb-6">
              Если вам не удалось найти нужную информацию, свяжитесь с нами, и мы с радостью поможем
            </p>
            <a href="/contacts" className="text-primary hover:underline inline-flex items-center">
              Перейти на страницу контактов
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ml-1"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default UsefulLinks;

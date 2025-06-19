
import MainLayout from "@/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Award, BadgeCheck, Briefcase, Calendar, Locate, MapPin, Sparkles, UserPlus } from "lucide-react";

const jobOpenings = [
  {
    id: 1,
    title: "Автомеханик",
    location: "Москва",
    type: "Полная занятость",
    experience: "От 3 лет",
    description: "Ищем опытного автомеханика для работы с иностранными автомобилями. Требуется опыт диагностики, ремонта ходовой части, двигателей и трансмиссии.",
    responsibilities: [
      "Диагностика и ремонт автомобилей",
      "Плановое техническое обслуживание",
      "Замена расходных материалов и деталей",
      "Консультирование клиентов"
    ],
    requirements: [
      "Опыт работы автомехаником от 3 лет",
      "Знание устройства современных автомобилей",
      "Умение работать с диагностическим оборудованием",
      "Ответственность и внимательность к деталям"
    ],
    benefits: [
      "Официальное трудоустройство",
      "Конкурентная заработная плата",
      "Профессиональное обучение",
      "Дружный коллектив",
      "Современное оборудование"
    ]
  },
  {
    id: 2,
    title: "Администратор автосервиса",
    location: "Москва",
    type: "Полная занятость",
    experience: "От 1 года",
    description: "Требуется администратор для встречи клиентов, приема заказов и координации работы сервиса.",
    responsibilities: [
      "Прием и оформление заказов",
      "Консультирование клиентов по услугам и ценам",
      "Ведение документации",
      "Контроль за выполнением работ"
    ],
    requirements: [
      "Опыт работы в автосервисе или сфере обслуживания",
      "Знание основ устройства автомобиля",
      "Уверенный пользователь ПК",
      "Коммуникабельность и клиентоориентированность"
    ],
    benefits: [
      "Официальное трудоустройство",
      "Стабильная заработная плата + премии",
      "График работы 5/2",
      "Возможность карьерного роста",
      "Дружный коллектив"
    ]
  },
  {
    id: 3,
    title: "Специалист по кузовному ремонту",
    location: "Москва",
    type: "Полная занятость",
    experience: "От 5 лет",
    description: "Ищем мастера кузовного ремонта с опытом работы для выполнения всех видов кузовных работ.",
    responsibilities: [
      "Кузовной ремонт любой сложности",
      "Устранение перекосов кузова",
      "Замена элементов кузова",
      "Подготовка к покраске"
    ],
    requirements: [
      "Опыт работы в кузовном ремонте от 5 лет",
      "Умение работать с современным оборудованием",
      "Знание технологий ремонта",
      "Ответственность и аккуратность"
    ],
    benefits: [
      "Высокая заработная плата",
      "Официальное трудоустройство",
      "Современное оборудование",
      "Комфортные условия труда",
      "Профессиональное развитие"
    ]
  }
];

const Career = () => {
  return (
    <MainLayout>
      <div className="min-h-screen pt-28 pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold mb-3">Карьера в АвтоСервисе</h1>
            <p className="text-foreground/70 max-w-2xl mx-auto">
              Присоединяйтесь к нашей команде профессионалов и развивайтесь вместе с нами
            </p>
          </div>
          
          <div className="mb-16">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold mb-3">Почему стоит работать с нами</h2>
              <p className="text-foreground/70 max-w-2xl mx-auto">
                Мы создаем комфортные условия для профессионального роста и развития наших сотрудников
              </p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <BadgeCheck className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Стабильность</h3>
                    <p className="text-muted-foreground">
                      Официальное трудоустройство, своевременная оплата труда и социальные гарантии
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Развитие</h3>
                    <p className="text-muted-foreground">
                      Возможность обучения, повышения квалификации и карьерного роста
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <UserPlus className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Команда</h3>
                    <p className="text-muted-foreground">
                      Дружный коллектив профессионалов, готовых поделиться опытом и поддержать
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <div className="mb-16">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold mb-3">Открытые вакансии</h2>
              <p className="text-foreground/70 max-w-2xl mx-auto">
                Ознакомьтесь с текущими вакансиями и найдите подходящую возможность для развития
              </p>
            </div>
            
            <div className="space-y-6">
              {jobOpenings.map((job) => (
                <Card key={job.id}>
                  <CardContent className="p-0">
                    <div className="p-6 border-b">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-semibold mb-2">{job.title}</h3>
                          <div className="flex flex-wrap gap-2 mb-4">
                            <div className="flex items-center text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4 mr-1" />
                              {job.location}
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Briefcase className="h-4 w-4 mr-1" />
                              {job.type}
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Award className="h-4 w-4 mr-1" />
                              {job.experience}
                            </div>
                          </div>
                          <p className="text-foreground/70">{job.description}</p>
                        </div>
                        <Button className="hidden sm:flex ml-4">Откликнуться</Button>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <Accordion type="single" collapsible>
                        <AccordionItem value="responsibilities">
                          <AccordionTrigger>Обязанности</AccordionTrigger>
                          <AccordionContent>
                            <ul className="list-disc pl-5 text-foreground/70 space-y-1">
                              {job.responsibilities.map((item, index) => (
                                <li key={index}>{item}</li>
                              ))}
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                        
                        <AccordionItem value="requirements">
                          <AccordionTrigger>Требования</AccordionTrigger>
                          <AccordionContent>
                            <ul className="list-disc pl-5 text-foreground/70 space-y-1">
                              {job.requirements.map((item, index) => (
                                <li key={index}>{item}</li>
                              ))}
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                        
                        <AccordionItem value="benefits">
                          <AccordionTrigger>Преимущества</AccordionTrigger>
                          <AccordionContent>
                            <ul className="list-disc pl-5 text-foreground/70 space-y-1">
                              {job.benefits.map((item, index) => (
                                <li key={index}>{item}</li>
                              ))}
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                      
                      <Button className="w-full sm:hidden mt-4">Откликнуться</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          
          <div className="mb-16 bg-secondary p-8 rounded-lg">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-3">Процесс отбора</h2>
              <p className="text-foreground/70 max-w-2xl mx-auto">
                Как проходит процесс трудоустройства в нашу компанию
              </p>
            </div>
            
            <div className="grid gap-8 md:grid-cols-4">
              <div className="text-center">
                <div className="h-12 w-12 rounded-full bg-background flex items-center justify-center mx-auto mb-4">
                  <span className="text-lg font-bold">1</span>
                </div>
                <h3 className="font-semibold mb-2">Отклик на вакансию</h3>
                <p className="text-sm text-muted-foreground">
                  Отправьте резюме и заполните анкету на сайте
                </p>
              </div>
              
              <div className="text-center">
                <div className="h-12 w-12 rounded-full bg-background flex items-center justify-center mx-auto mb-4">
                  <span className="text-lg font-bold">2</span>
                </div>
                <h3 className="font-semibold mb-2">Собеседование</h3>
                <p className="text-sm text-muted-foreground">
                  Встреча с руководителем для обсуждения опыта и компетенций
                </p>
              </div>
              
              <div className="text-center">
                <div className="h-12 w-12 rounded-full bg-background flex items-center justify-center mx-auto mb-4">
                  <span className="text-lg font-bold">3</span>
                </div>
                <h3 className="font-semibold mb-2">Тестовое задание</h3>
                <p className="text-sm text-muted-foreground">
                  Демонстрация профессиональных навыков на практике
                </p>
              </div>
              
              <div className="text-center">
                <div className="h-12 w-12 rounded-full bg-background flex items-center justify-center mx-auto mb-4">
                  <span className="text-lg font-bold">4</span>
                </div>
                <h3 className="font-semibold mb-2">Трудоустройство</h3>
                <p className="text-sm text-muted-foreground">
                  Оформление документов и начало работы в компании
                </p>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-3">Не нашли подходящую вакансию?</h2>
            <p className="text-foreground/70 max-w-2xl mx-auto mb-6">
              Отправьте нам свое резюме, и мы свяжемся с вами, когда появится подходящая позиция
            </p>
            
            <Button>Отправить резюме</Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Career;

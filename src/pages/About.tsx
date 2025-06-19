
import MainLayout from "@/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Award, Building, Clock, MapPin, ShieldCheck, Wrench } from "lucide-react";
import { Link } from "react-router-dom";

const About = () => {
  return (
    <MainLayout>
      <div className="min-h-screen pt-28 pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold mb-3">О нас</h1>
            <p className="text-foreground/70 max-w-3xl mx-auto">
              Мы — современный автосервис с профессиональной командой и инновационным подходом к обслуживанию
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-16">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Wrench className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Профессиональное обслуживание</h3>
                  <p className="text-muted-foreground">
                    Наши специалисты имеют богатый опыт работы и проходят регулярное обучение
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Быстрое обслуживание</h3>
                  <p className="text-muted-foreground">
                    Мы ценим ваше время и выполняем работы в кратчайшие сроки
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <ShieldCheck className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Гарантия качества</h3>
                  <p className="text-muted-foreground">
                    Мы предоставляем гарантию на все выполненные работы и используемые запчасти
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="mb-16">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold mb-3">Наша история</h2>
              <p className="text-foreground/70 max-w-2xl mx-auto">
                С момента основания в 2010 году мы постоянно развиваемся и совершенствуем наши услуги
              </p>
            </div>
            
            <div className="grid gap-8 md:grid-cols-2">
              <div>
                <h3 className="text-xl font-semibold mb-4">Как всё начиналось</h3>
                <p className="text-foreground/70 mb-4">
                  Наша компания была основана группой профессиональных автомехаников, которые решили создать автосервис нового формата, где клиент получает максимально прозрачный и качественный сервис.
                </p>
                <p className="text-foreground/70 mb-4">
                  Начав с небольшого помещения и базового оборудования, мы постепенно расширялись, инвестируя в новые технологии и обучение персонала.
                </p>
                <p className="text-foreground/70">
                  Сегодня мы — современный автосервис с диагностическим оборудованием последнего поколения и командой сертифицированных специалистов.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-4">Наша миссия</h3>
                <p className="text-foreground/70 mb-4">
                  Мы стремимся обеспечить каждому клиенту безопасность и комфорт на дороге благодаря профессиональному обслуживанию автомобилей.
                </p>
                <p className="text-foreground/70 mb-4">
                  Наша цель — не просто ремонтировать автомобили, а создавать долгосрочные отношения с клиентами, основанные на доверии и взаимном уважении.
                </p>
                <p className="text-foreground/70">
                  Мы постоянно следим за новыми технологиями в автомобильной индустрии и внедряем их в нашу работу, чтобы предоставлять услуги высочайшего качества.
                </p>
              </div>
            </div>
          </div>
          
          <div className="mb-16">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold mb-3">Наше расположение</h2>
              <p className="text-foreground/70 max-w-2xl mx-auto">
                Мы находимся в удобном месте с хорошей транспортной доступностью
              </p>
            </div>
            
            <div className="bg-secondary p-6 rounded-lg">
              <div className="flex flex-col md:flex-row justify-between items-start">
                <div className="mb-6 md:mb-0 md:mr-8">
                  <h3 className="text-xl font-semibold mb-4">Контактная информация</h3>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <MapPin className="h-5 w-5 text-primary mt-0.5 mr-3" />
                      <div>
                        <p className="font-medium">Адрес:</p>
                        <p className="text-foreground/70">г. Москва, ул. Автомобильная, д. 10</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Clock className="h-5 w-5 text-primary mt-0.5 mr-3" />
                      <div>
                        <p className="font-medium">Часы работы:</p>
                        <p className="text-foreground/70">Пн-Пт: 8:00 - 20:00</p>
                        <p className="text-foreground/70">Сб: 9:00 - 18:00</p>
                        <p className="text-foreground/70">Вс: Выходной</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Building className="h-5 w-5 text-primary mt-0.5 mr-3" />
                      <div>
                        <p className="font-medium">Как добраться:</p>
                        <p className="text-foreground/70">5 минут пешком от станции метро "Автозаводская"</p>
                        <p className="text-foreground/70">Удобная парковка для клиентов</p>
                      </div>
                    </div>
                  </div>
                  
                  <Button asChild className="mt-6">
                    <Link to="/contacts">
                      Все контакты <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                
                <div className="w-full md:w-2/3 h-64 bg-accent rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">Карта расположения автосервиса</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-3">Узнайте больше о нас</h2>
            <p className="text-foreground/70 max-w-2xl mx-auto mb-8">
              Познакомьтесь с нашей командой и узнайте о карьерных возможностях
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild variant="outline">
                <Link to="/team">
                  Наша команда <Award className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              
              <Button asChild variant="outline">
                <Link to="/career">
                  Карьера у нас <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default About;

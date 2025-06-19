
import MainLayout from "@/layouts/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Facebook, Instagram, Linkedin, Mail, Phone } from "lucide-react";

const teamMembers = [
  {
    id: 1,
    name: "Александр Петров",
    role: "Генеральный директор",
    bio: "Более 15 лет опыта в автомобильной индустрии. Основатель компании с видением создать сервис нового поколения.",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8YnVzaW5lc3MlMjBtYW58ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60",
  },
  {
    id: 2,
    name: "Екатерина Смирнова",
    role: "Руководитель сервиса",
    bio: "Сертифицированный инженер с опытом работы более 10 лет. Отвечает за качество всех выполняемых работ.",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8YnVzaW5lc3MlMjB3b21hbnxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=500&q=60",
  },
  {
    id: 3,
    name: "Дмитрий Иванов",
    role: "Главный механик",
    bio: "Эксперт по диагностике и ремонту европейских автомобилей. Регулярно проходит обучение у производителей.",
    image: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTN8fG1lY2hhbmljfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60",
  },
  {
    id: 4,
    name: "Ольга Кузнецова",
    role: "Менеджер по работе с клиентами",
    bio: "Помогает клиентам решать все вопросы, связанные с обслуживанием. Профессионал в сфере клиентского сервиса.",
    image: "https://images.unsplash.com/photo-1573497491765-dccce02b29df?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTd8fGJ1c2luZXNzJTIwd29tYW58ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60",
  },
  {
    id: 5,
    name: "Сергей Новиков",
    role: "Специалист по электронике",
    bio: "Эксперт по диагностике и ремонту электронных систем современных автомобилей всех марок.",
    image: "https://images.unsplash.com/photo-1566753323558-f4e0952af115?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fHRlY2huaWNpYW58ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60",
  },
  {
    id: 6,
    name: "Наталья Морозова",
    role: "Бухгалтер",
    bio: "Отвечает за финансовую сторону бизнеса, обеспечивая прозрачность и своевременность всех расчетов.",
    image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8YWNjb3VudGFudHxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=500&q=60",
  },
];

const Team = () => {
  return (
    <MainLayout>
      <div className="min-h-screen pt-28 pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold mb-3">Наша команда</h1>
            <p className="text-foreground/70 max-w-2xl mx-auto">
              Профессионалы своего дела, которые сделают всё, чтобы ваш автомобиль был в идеальном состоянии
            </p>
          </div>
          
          <div className="mb-16">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold mb-3">Познакомьтесь с нашими специалистами</h2>
              <p className="text-foreground/70 max-w-2xl mx-auto">
                Каждый член нашей команды — эксперт в своей области с богатым опытом работы
              </p>
            </div>
            
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {teamMembers.map((member) => (
                <Card key={member.id}>
                  <CardContent className="p-0">
                    <div className="aspect-[4/3] overflow-hidden">
                      <img 
                        src={member.image} 
                        alt={member.name} 
                        className="w-full h-full object-cover transition-transform hover:scale-105"
                      />
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
                      <p className="text-primary font-medium mb-3">{member.role}</p>
                      <p className="text-muted-foreground">{member.bio}</p>
                      
                      <div className="flex mt-4 space-x-3">
                        <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                          <Linkedin className="h-5 w-5" />
                        </a>
                        <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                          <Mail className="h-5 w-5" />
                        </a>
                        <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                          <Phone className="h-5 w-5" />
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          
          <div className="mb-16 bg-secondary p-8 rounded-lg">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-3">Наши ценности</h2>
              <p className="text-foreground/70 max-w-2xl mx-auto">
                Принципы, которыми руководствуется наша команда в ежедневной работе
              </p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="bg-background p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Профессионализм</h3>
                <p className="text-muted-foreground">
                  Мы постоянно совершенствуем свои знания и навыки, чтобы предоставлять услуги высочайшего качества.
                </p>
              </div>
              
              <div className="bg-background p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Честность</h3>
                <p className="text-muted-foreground">
                  Мы всегда предоставляем клиентам полную и достоверную информацию о состоянии их автомобиля.
                </p>
              </div>
              
              <div className="bg-background p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Ответственность</h3>
                <p className="text-muted-foreground">
                  Мы несем полную ответственность за качество выполняемых работ и соблюдение сроков.
                </p>
              </div>
              
              <div className="bg-background p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Клиентоориентированность</h3>
                <p className="text-muted-foreground">
                  Мы всегда ставим интересы клиента на первое место и стремимся превзойти его ожидания.
                </p>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-3">Хотите присоединиться к нашей команде?</h2>
            <p className="text-foreground/70 max-w-2xl mx-auto mb-6">
              Мы всегда рады талантливым и преданным своему делу специалистам
            </p>
            
            <div className="flex justify-center space-x-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="h-6 w-6" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="h-6 w-6" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Linkedin className="h-6 w-6" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Team;

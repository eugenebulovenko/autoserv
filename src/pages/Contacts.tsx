import MainLayout from "@/layouts/MainLayout";
import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Clock, Mail, MapPin, Phone } from "lucide-react";

const Contacts = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateEmail = (email: string) => {
    // Простая валидация email
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(formData.email)) {
      toast({
        title: "Некорректный email",
        description: "Пожалуйста, введите корректный email адрес.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      // Сохраняем обращение в supabase
      const { error } = await supabase.from('feedback').insert([
        {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          message: formData.message,
          created_at: new Date().toISOString(),
        },
      ]);
      if (error) throw error;
      toast({
        title: "Сообщение отправлено",
        description: "Спасибо за обращение! Мы свяжемся с вами в ближайшее время.",
      });
      setFormData({ name: "", email: "", phone: "", message: "" });
    } catch (error) {
      console.error("Ошибка при отправке обратной связи:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось отправить сообщение. Пожалуйста, попробуйте позже.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <MainLayout>
      <div className="min-h-screen pt-28 pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold mb-3">Контакты</h1>
            <p className="text-foreground/70 max-w-2xl mx-auto">
              Свяжитесь с нами любым удобным способом или оставьте заявку, и мы вам перезвоним
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 mb-16">
            <div>
              <Card className="h-full">
                <CardContent className="pt-6">
                  <h2 className="text-2xl font-bold mb-6">Наши контакты</h2>
                  
                  <div className="space-y-6">
                    <div className="flex items-start">
                      <MapPin className="h-6 w-6 text-primary mt-0.5 mr-4" />
                      <div>
                        <h3 className="font-semibold mb-1">Адрес</h3>
                        <p className="text-foreground/70">г. Гомель, ул. Автомобильная, д. 10</p>
                        <p className="text-foreground/70 mt-1">
                          <span className="text-sm">5 минут от м. Автозаводская</span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Phone className="h-6 w-6 text-primary mt-0.5 mr-4" />
                      <div>
                        <h3 className="font-semibold mb-1">Телефон</h3>
                        <p className="text-foreground/70">+375 (29) 123-45-67</p>
                        <p className="text-foreground/70">+375 (29) 765-43-21</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Mail className="h-6 w-6 text-primary mt-0.5 mr-4" />
                      <div>
                        <h3 className="font-semibold mb-1">Email</h3>
                        <p className="text-foreground/70">info@autoservice.ru</p>
                        <p className="text-foreground/70">support@autoservice.ru</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Clock className="h-6 w-6 text-primary mt-0.5 mr-4" />
                      <div>
                        <h3 className="font-semibold mb-1">Часы работы</h3>
                        <p className="text-foreground/70">Пн-Пт: 8:00 - 20:00</p>
                        <p className="text-foreground/70">Сб: 9:00 - 18:00</p>
                        <p className="text-foreground/70">Вс: Выходной</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8">
                    <h3 className="font-semibold mb-3">Мы в социальных сетях</h3>
                    <div className="flex space-x-4">
                      <a href="#" className="bg-secondary h-10 w-10 rounded-full flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                        </svg>
                      </a>
                      <a href="#" className="bg-secondary h-10 w-10 rounded-full flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                        </svg>
                      </a>
                      <a href="#" className="bg-secondary h-10 w-10 rounded-full flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                          <rect x="2" y="9" width="4" height="12"></rect>
                          <circle cx="4" cy="4" r="2"></circle>
                        </svg>
                      </a>
                      <a href="#" className="bg-secondary h-10 w-10 rounded-full flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                        </svg>
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card>
                <CardContent className="pt-6">
                  <h2 className="text-2xl font-bold mb-6">Обратная связь</h2>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Ваше имя</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Иван Иванов"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="ivan@example.com"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Телефон</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+7 (123) 456-7890"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="message">Сообщение</Label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Ваш вопрос или сообщение"
                        rows={4}
                        required
                      />
                    </div>
                    
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? "Отправка..." : "Отправить сообщение"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <div>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-3">Как нас найти</h2>
              <p className="text-foreground/70 max-w-2xl mx-auto">
                Удобное расположение в центре города с хорошей транспортной доступностью
              </p>
            </div>
            
            <div className="h-96 bg-accent rounded-lg flex items-center justify-center">
              <iframe
                title="Карта автосервиса"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2022.073232625992!2d30.98515531609944!3d52.47675507980737!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x46d469b2e2e2e2e2%3A0x1234567890abcdef!2z0JHQtdC70L7QstCw0YAg0JrQvtC80L7QvdCw!5e0!3m2!1sru!2sru!4v1710000000000!5m2!1sru!2sru"
                width="100%"
                height="100%"
                style={{ border: 0, borderRadius: '0.5rem' }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Contacts;

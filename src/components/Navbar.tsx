
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown, User, LogOut, Mail } from "lucide-react";
import AdminMessengerBadge from "@/pages/admin/AdminMessengerBadge";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, signOut, profile, isAdmin, isMechanic } = useAuth();

  const getNavLinks = () => {
    // Общие ссылки для всех
    const commonLinks = [
      { name: "Главная", path: "/" },
      { name: "Услуги", path: "/services" },
      { name: "Контакты", path: "/contact" },
    ];

    // Если пользователь авторизован
    if (user) {
      // Ссылки для клиентов
      if (profile?.role === 'client') {
        return [
          ...commonLinks,
          { name: "Запись", path: "/booking" },
          { name: "Статус ремонта", path: "/tracking" },
        ];
      }
      // Ссылки для механиков
      else if (profile?.role === 'mechanic') {
        return [
          ...commonLinks,
          { name: "Мои задания", path: "/mechanic/tasks" },
        ];
      }
      // Ссылки для администраторов
      else if (profile?.role === 'admin') {
        return [
          ...commonLinks,
          { name: "Управление", path: "/admin" },
        ];
      }
    }

    // Для неавторизованных пользователей
    return commonLinks;
  };

  const navLinks = getNavLinks();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Закрываем мобильное меню при смене маршрута
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/90 backdrop-blur-md shadow-sm py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="container max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="text-xl font-semibold flex items-center gap-2 text-foreground"
          >
            <span className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-bold">
              A
            </span>
            <span>АвтоСервис</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === link.path
                    ? "text-primary"
                    : "text-foreground/80"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <User className="h-4 w-4" />
                    {profile?.first_name || "Профиль"}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    {profile?.first_name} {profile?.last_name}
                  </DropdownMenuLabel>
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    {profile?.role === 'admin' && "Администратор"}
                    {profile?.role === 'mechanic' && "Механик"}
                    {profile?.role === 'client' && "Клиент"}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {profile?.role === 'client' && (
                    <DropdownMenuItem asChild>
                      <Link to="/messenger" className="flex items-center gap-2">
                        <span>Сообщения</span>
                        <span className="relative">
                          <Mail className="h-4 w-4 text-primary" />
                          <AdminMessengerBadge userId={user.id}>
                            {(count) => count > 0 && (
                              <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full px-1 text-xs animate-pulse">{count}</span>
                            )}
                          </AdminMessengerBadge>
                        </span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard">Панель управления</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/profile">Настройки профиля</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()} className="text-red-500">
                    <LogOut className="mr-2 h-4 w-4" />
                    Выйти
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  className="text-sm font-medium transition-colors"
                >
                  <Link to="/login">Войти</Link>
                </Button>
                <Button asChild className="text-sm font-medium">
                  <Link to="/register">Регистрация</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden focus:outline-none"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6 text-foreground" />
            ) : (
              <Menu className="h-6 w-6 text-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div
        className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden ${
          isMobileMenuOpen
            ? "max-h-[400px] opacity-100 shadow-lg"
            : "max-h-0 opacity-0"
        }`}
      >
        <div className="container mx-auto px-4 pb-5 pt-3 bg-background/95 backdrop-blur-md">
          <nav className="flex flex-col space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium py-2 transition-colors hover:text-primary ${
                  location.pathname === link.path
                    ? "text-primary"
                    : "text-foreground/80"
                }`}
              >
                {link.name}
              </Link>
            ))}
            <div className="flex flex-col space-y-2 pt-2 border-t border-border">
              {user ? (
                <>
                  {profile?.role === 'client' && (
                    <Link to="/messenger" className="text-sm font-medium py-2 flex items-center gap-2">
                      <span>Сообщения</span>
                      <span className="relative">
                        <Mail className="h-4 w-4 text-primary" />
                        <AdminMessengerBadge userId={user.id}>
                          {(count) => count > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full px-1 text-xs animate-pulse">{count}</span>
                          )}
                        </AdminMessengerBadge>
                      </span>
                    </Link>
                  )}
                  <Link to="/dashboard" className="text-sm font-medium py-2">
                    Панель управления
                  </Link>
                  <Link to="/profile" className="text-sm font-medium py-2">
                    Настройки профиля
                  </Link>
                  <Button 
                    variant="outline" 
                    className="justify-start text-sm font-medium mt-2"
                    onClick={() => signOut()}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Выйти
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    asChild
                    variant="ghost"
                    className="justify-start text-sm font-medium"
                  >
                    <Link to="/login">Войти</Link>
                  </Button>
                  <Button asChild className="text-sm font-medium">
                    <Link to="/register">Регистрация</Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

import { Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  Users,
  Wrench,
  ClipboardList,
  BarChart3,
  LogOut,
  Newspaper,
} from "lucide-react";

const menuItems = [
  {
    title: "Панель управления",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Новости",
    href: "/admin/news",
    icon: Newspaper,
  },
  {
    title: "Клиенты",
    href: "/admin/clients",
    icon: Users,
  },
  {
    title: "Механики",
    href: "/admin/mechanics",
    icon: Users,
  },
  {
    title: "Услуги",
    href: "/admin/services",
    icon: Wrench,
  },
  {
    title: "Заказ-наряды",
    href: "/admin/work-orders",
    icon: ClipboardList,
  },
  {
    title: "Отчеты",
    href: "/admin/reports",
    icon: BarChart3,
  },
  {
    title: "Обращения",
    href: "/admin/feedback",
    icon: ClipboardList,
  },
];

const AdminLayout = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* Боковое меню */}
        <div className="w-64 min-h-screen bg-white border-r">
          <div className="p-6">
            <h1 className="text-2xl font-bold">Автосервис</h1>
            <p className="text-sm text-muted-foreground">Панель администратора</p>
          </div>
          <nav className="px-4 space-y-2">
            {menuItems.map((item) => (
              <Button
                key={item.href}
                variant="ghost"
                className="w-full justify-start"
                onClick={() => navigate(item.href)}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.title}
              </Button>
            ))}
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Выйти
            </Button>
          </nav>
        </div>

        {/* Основной контент */}
        <div className="flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout; 
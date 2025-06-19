import { useState } from "react";
import { Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Wrench, ClipboardList, CheckSquare, Calendar, 
  ChevronRight, ChevronLeft, LogOut, Home, Mail
} from "lucide-react";
import AdminMessengerBadge from "../admin/AdminMessengerBadge";
import { Button } from "@/components/ui/button";
import MechanicHome from "./MechanicHome";
import MechanicTasks from "./MechanicTasks";
import MechanicTaskDetails from "./MechanicTaskDetails";

const MechanicDashboard = () => {
  const { signOut, profile } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const { user } = useAuth();
  const menuItems = [
    { name: "Обзор", path: "/mechanic", icon: <Calendar className="h-5 w-5" /> },
    { name: "Задания", path: "/mechanic/tasks", icon: <ClipboardList className="h-5 w-5" /> },
    { name: "Выполненные", path: "/mechanic/completed", icon: <CheckSquare className="h-5 w-5" /> },
    user && {
      name: "Общение",
      path: "/mechanic/messenger",
      icon: (
        <span className="relative">
          <Mail className="h-5 w-5" />
          <AdminMessengerBadge userId={user.id}>
            {(count) => count > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full px-1.5 text-xs animate-pulse">{count}</span>
            )}
          </AdminMessengerBadge>
        </span>
      ),
    },
  ].filter(Boolean);

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar */}
      <div 
        className={`bg-primary text-white transition-all duration-300 ${
          collapsed ? "w-20" : "w-64"
        } fixed inset-y-0 left-0 z-30 md:relative`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 flex items-center justify-between border-b border-white/20">
            <div className={`flex items-center ${collapsed ? "justify-center w-full" : ""}`}>
              <span className="h-8 w-8 rounded-full bg-white text-primary flex items-center justify-center font-bold">
                A
              </span>
              {!collapsed && <span className="ml-2 font-semibold">АвтоСервис</span>}
            </div>
            <button 
              onClick={() => setCollapsed(!collapsed)}
              className="text-white/80 hover:text-white"
            >
              {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>
          </div>
          
          <div className="flex-1 py-6 overflow-y-auto">
            <ul className="space-y-1 px-2">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <Link 
                    to={item.path} 
                    className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                      location.pathname === item.path || 
                      (item.path !== "/mechanic" && location.pathname.startsWith(item.path))
                        ? "bg-white/20 text-white"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    {!collapsed && <span className="ml-3">{item.name}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="p-4 border-t border-white/20">
            <div className={`flex items-center ${collapsed ? "justify-center" : ""} mb-4`}>
              {collapsed ? (
                <div className="h-10 w-10 rounded-full bg-white/20 text-white flex items-center justify-center">
                  {profile?.first_name?.charAt(0)}{profile?.last_name?.charAt(0)}
                </div>
              ) : (
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-white/20 text-white flex items-center justify-center">
                    {profile?.first_name?.charAt(0)}{profile?.last_name?.charAt(0)}
                  </div>
                  <div className="ml-3">
                    <p className="font-medium">{profile?.first_name} {profile?.last_name}</p>
                    <p className="text-sm text-white/70">Механик</p>
                  </div>
                </div>
              )}
            </div>
            <Button 
              variant="secondary" 
              className={`${collapsed ? "p-2 w-full justify-center" : "w-full"} mb-2`}
              onClick={() => navigate('/')}
            >
              <Home className="h-5 w-5" />
              {!collapsed && <span className="ml-2">На главную</span>}
            </Button>
            <Button 
              variant="secondary" 
              className={`${collapsed ? "p-2 w-full justify-center" : "w-full"}`}
              onClick={() => signOut()}
            >
              <LogOut className="h-5 w-5" />
              {!collapsed && <span className="ml-2">Выйти</span>}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className={`flex-1 ${collapsed ? "md:ml-20" : "md:ml-64"}`}>
        <div className="p-6 min-h-screen bg-secondary/30">
          <Routes>
            <Route path="/" element={<MechanicHome />} />
            <Route path="/tasks" element={<MechanicTasks />} />
            <Route path="/tasks/:id" element={<MechanicTaskDetails />} />
            <Route path="/completed" element={<MechanicTasks completed />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default MechanicDashboard;

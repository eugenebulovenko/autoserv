
import MainLayout from "@/layouts/MainLayout";
import AuthForm from "@/components/auth/AuthForm"; // Updated import path
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Отладочная информация
    console.log("Login page: Auth status", { user, loading });
  }, [user, loading]);

  // Если пользователь уже авторизован, перенаправляем на страницу Dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <MainLayout>
      <div className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center">
        <div className="w-full max-w-md">
          <AuthForm type="login" />
        </div>
      </div>
    </MainLayout>
  );
};

export default Login;

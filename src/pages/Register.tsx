
import MainLayout from "@/layouts/MainLayout";
import AuthForm from "@/components/auth/AuthForm"; // Updated import path
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

const Register = () => {
  const { user } = useAuth();

  // Если пользователь уже авторизован, перенаправляем на страницу Dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <MainLayout>
      <div className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center">
        <div className="w-full max-w-md">
          <AuthForm type="register" />
        </div>
      </div>
    </MainLayout>
  );
};

export default Register;

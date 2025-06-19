
import { useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

interface AuthFormProps {
  type: "login" | "register";
}

const AuthForm = ({ type }: AuthFormProps) => {
  const { toast } = useToast();
  const { signIn, signUp, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    confirmPassword: "",
    acceptTerms: false,
  });
  
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const setAcceptTerms = (checked: boolean) => {
    setFormData(prev => ({...prev, acceptTerms: checked}));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (submitting) return;
    
    try {
      setSubmitting(true);
      console.log("Form submitted", { type, email: formData.email });
      
      // Basic validation
      if (type === "register") {
        if (!formData.firstName.trim()) {
          toast({
            title: "Ошибка",
            description: "Пожалуйста, введите ваше имя",
            variant: "destructive",
          });
          return;
        }
        
        if (!formData.lastName.trim()) {
          toast({
            title: "Ошибка",
            description: "Пожалуйста, введите вашу фамилию",
            variant: "destructive",
          });
          return;
        }
        
        if (formData.password !== formData.confirmPassword) {
          toast({
            title: "Ошибка",
            description: "Пароли не совпадают",
            variant: "destructive",
          });
          return;
        }
        
        if (!formData.acceptTerms) {
          toast({
            title: "Ошибка",
            description: "Необходимо принять условия использования",
            variant: "destructive",
          });
          return;
        }
      }
      
      if (!formData.email.trim()) {
        toast({
          title: "Ошибка",
          description: "Пожалуйста, введите email",
          variant: "destructive",
        });
        return;
      }
      
      if (!formData.password.trim()) {
        toast({
          title: "Ошибка",
          description: "Пожалуйста, введите пароль",
          variant: "destructive",
        });
        return;
      }

      if (type === "login") {
        console.log("Attempting to sign in with:", formData.email, "password length:", formData.password.length);
        await signIn(formData.email, formData.password);
      } else {
        console.log("Attempting to sign up");
        await signUp(
          formData.email, 
          formData.password, 
          formData.firstName, 
          formData.lastName,
          formData.phone
        );
      }
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="glass w-full max-w-md mx-auto rounded-lg p-6 sm:p-8 animate-fade-in">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {type === "login" ? "Вход в систему" : "Регистрация"}
      </h2>
      
      {type === "login" ? (
        <LoginForm 
          onSubmit={handleSubmit}
          handleChange={handleChange}
          formData={formData}
          loading={loading}
          submitting={submitting}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
        />
      ) : (
        <RegisterForm 
          onSubmit={handleSubmit}
          handleChange={handleChange}
          formData={formData}
          loading={loading}
          submitting={submitting}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          setAcceptTerms={setAcceptTerms}
        />
      )}
      
      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          {type === "login" ? "Нет аккаунта?" : "Уже есть аккаунт?"}
          <Link
            to={type === "login" ? "/register" : "/login"}
            className="ml-1 text-primary hover:underline"
          >
            {type === "login" ? "Зарегистрироваться" : "Войти"}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AuthForm;

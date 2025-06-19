
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import FormField from "./FormField";
import { Mail, Lock, User, Phone } from "lucide-react";

interface RegisterFormProps {
  onSubmit: (e: React.FormEvent) => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  formData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    confirmPassword: string;
    acceptTerms: boolean;
  };
  loading: boolean;
  submitting: boolean;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  setAcceptTerms: (checked: boolean) => void;
}

const RegisterForm = ({
  onSubmit,
  handleChange,
  formData,
  loading,
  submitting,
  showPassword,
  setShowPassword,
  setAcceptTerms,
}: RegisterFormProps) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormField
        id="firstName"
        name="firstName"
        type="text"
        label="Имя"
        placeholder="Иван"
        value={formData.firstName}
        onChange={handleChange}
        icon={<User className="h-4 w-4" />}
      />
      
      <FormField
        id="lastName"
        name="lastName"
        type="text"
        label="Фамилия"
        placeholder="Иванов"
        value={formData.lastName}
        onChange={handleChange}
        icon={<User className="h-4 w-4" />}
      />
      
      <FormField
        id="phone"
        name="phone"
        type="tel"
        label="Телефон"
        placeholder="+7 (XXX) XXX-XX-XX"
        value={formData.phone}
        onChange={handleChange}
        icon={<Phone className="h-4 w-4" />}
      />
      
      <FormField
        id="email"
        name="email"
        type="email"
        label="Email"
        placeholder="email@example.com"
        value={formData.email}
        onChange={handleChange}
        icon={<Mail className="h-4 w-4" />}
      />
      
      <FormField
        id="password"
        name="password"
        type="password"
        label="Пароль"
        value={formData.password}
        onChange={handleChange}
        icon={<Lock className="h-4 w-4" />}
        showPassword={showPassword}
        toggleShowPassword={() => setShowPassword(!showPassword)}
      />
      
      <FormField
        id="confirmPassword"
        name="confirmPassword"
        type="password"
        label="Подтверждение пароля"
        value={formData.confirmPassword}
        onChange={handleChange}
        icon={<Lock className="h-4 w-4" />}
        showPassword={showPassword}
        toggleShowPassword={() => setShowPassword(!showPassword)}
      />
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="acceptTerms" 
          name="acceptTerms"
          checked={formData.acceptTerms}
          onCheckedChange={(checked) => setAcceptTerms(!!checked)}
        />
        <Label htmlFor="acceptTerms" className="text-sm text-muted-foreground">
          Я согласен с <Link to="/terms" className="text-primary underline">условиями использования</Link> и <Link to="/privacy" className="text-primary underline">политикой конфиденциальности</Link>.
        </Label>
      </div>
      
      <Button type="submit" className="w-full mt-6" disabled={loading || submitting}>
        {loading || submitting ? "Загрузка..." : "Зарегистрироваться"}
      </Button>
    </form>
  );
};

export default RegisterForm;

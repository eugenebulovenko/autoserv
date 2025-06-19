
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import FormField from "./FormField";
import { Mail, Lock } from "lucide-react";

interface LoginFormProps {
  onSubmit: (e: React.FormEvent) => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  formData: {
    email: string;
    password: string;
  };
  loading: boolean;
  submitting: boolean;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
}

const LoginForm = ({
  onSubmit,
  handleChange,
  formData,
  loading,
  submitting,
  showPassword,
  setShowPassword,
}: LoginFormProps) => {
  const { toast } = useToast();

  // For testing purposes, provide defaults for the login form
  const populateTestCredentials = (userType: 'admin' | 'mechanic' | 'client') => {
    const credentials = {
      admin: { email: 'admin@test.com', password: 'admin123' },
      mechanic: { email: 'mechanic@test.com', password: 'mechanic123' },
      client: { email: 'client@test.com', password: 'client123' }
    };
    
    const testEmail = credentials[userType].email;
    const testPassword = credentials[userType].password;
    
    // Creating synthetic events to simulate user input
    const emailEvent = {
      target: { name: 'email', value: testEmail }
    } as React.ChangeEvent<HTMLInputElement>;
    
    const passwordEvent = {
      target: { name: 'password', value: testPassword }
    } as React.ChangeEvent<HTMLInputElement>;
    
    handleChange(emailEvent);
    handleChange(passwordEvent);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
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

      <div className="flex justify-end">
        <Link to="/forgot-password" className="text-sm text-primary hover:underline">
          Забыли пароль?
        </Link>
      </div>
      
      {/* Quick login buttons for testing */}
      <div className="flex flex-col gap-2 my-2 pt-2 border-t">
        <p className="text-sm text-muted-foreground">Тестовые аккаунты:</p>
        <div className="flex gap-2">
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={() => populateTestCredentials('admin')}
          >
            Админ
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={() => populateTestCredentials('mechanic')}
          >
            Механик
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={() => populateTestCredentials('client')}
          >
            Клиент
          </Button>
        </div>
      </div>
      
      <Button type="submit" className="w-full mt-6" disabled={loading || submitting}>
        {loading || submitting ? "Загрузка..." : "Войти"}
      </Button>
    </form>
  );
};

export default LoginForm;

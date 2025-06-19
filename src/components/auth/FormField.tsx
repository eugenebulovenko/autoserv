
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";

interface FormFieldProps {
  id: string;
  name: string;
  type: string;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon?: React.ReactNode;
  showPassword?: boolean;
  toggleShowPassword?: () => void;
}

const FormField = ({
  id,
  name,
  type,
  label,
  placeholder,
  value,
  onChange,
  icon,
  showPassword,
  toggleShowPassword,
}: FormFieldProps) => {
  // Determine actual input type based on password visibility
  const inputType = type === "password" && showPassword ? "text" : type;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground">
            {icon}
          </div>
        )}
        <Input
          id={id}
          name={name}
          type={inputType}
          placeholder={placeholder}
          className={icon ? "pl-10" : "" + (type === "password" ? " pr-10" : "")}
          value={value}
          onChange={onChange}
        />
        {type === "password" && toggleShowPassword && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            onClick={toggleShowPassword}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
};

export default FormField;

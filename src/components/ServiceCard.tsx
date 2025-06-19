
import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { ArrowRight } from "lucide-react";

interface ServiceCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  link: string;
  delay?: number;
}

const ServiceCard = ({ title, description, icon, link, delay = 0 }: ServiceCardProps) => {
  return (
    <div 
      className="glass rounded-xl p-6 transition-all duration-500 ease-out card-hover relative overflow-hidden animate-scale-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Decorative element */}
      <div className="absolute -top-20 -right-20 h-40 w-40 bg-primary/5 rounded-full"></div>
      
      <div className="mb-5 relative z-10">
        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
      </div>
      
      <h3 className="text-xl font-semibold mb-3 relative z-10">{title}</h3>
      
      <p className="text-foreground/70 mb-6 text-sm relative z-10">
        {description}
      </p>
      
      <Tooltip>
  <TooltipTrigger asChild>
    <Button asChild variant="ghost" size="icon" aria-label="Подробнее">
      <Link to={link}>
        <ArrowRight className="h-5 w-5" />
      </Link>
    </Button>
  </TooltipTrigger>
  <TooltipContent>Подробнее</TooltipContent>
</Tooltip>
    </div>
  );
};

export default ServiceCard;

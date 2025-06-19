import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Gift, Star, Percent } from "lucide-react";

interface LoyaltyProgramProps {
  id: string;
  name: string;
  description: string;
  points_required: number;
  discount_percentage: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const LoyaltyProgram = ({
  id,
  name,
  description,
  points_required,
  discount_percentage,
  is_active,
  created_at,
  updated_at,
}: LoyaltyProgramProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Gift className="h-5 w-5 text-primary" />
            <span>{name}</span>
          </div>
          <Badge variant={is_active ? "default" : "secondary"}>
            {is_active ? "Активна" : "Неактивна"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-muted-foreground">{description}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 text-primary" />
              <span>Требуется баллов: {points_required}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Percent className="h-4 w-4 text-primary" />
              <span>Скидка: {discount_percentage}%</span>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" size="sm">
              Редактировать
            </Button>
            <Button variant="destructive" size="sm">
              Удалить
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LoyaltyProgram;

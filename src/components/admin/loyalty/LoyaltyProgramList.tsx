import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Gift, Plus, Percent, Users, Edit, Trash } from "lucide-react";

interface LoyaltyProgram {
  id: string;
  name: string;
  discount_percentage: number;
  min_visits: number;
  created_at: string;
}

interface LoyaltyProgramListProps {
  programs: LoyaltyProgram[];
  loading: boolean;
  onProgramCreated: (program: LoyaltyProgram) => void;
}

const LoyaltyProgramList = ({ programs, loading, onProgramCreated }: LoyaltyProgramListProps) => {
  const { toast } = useToast();
  const [newProgram, setNewProgram] = useState({
    name: "",
    discount_percentage: 5,
    min_visits: 3
  });

  const createProgram = async () => {
    try {
      if (!newProgram.name) {
        toast({
          title: "Ошибка",
          description: "Укажите название программы",
          variant: "destructive"
        });
        return;
      }
      
      // Приведение типа для новой таблицы
      const { data, error } = await supabase
        .from('loyalty_programs')
        .insert({
          name: newProgram.name,
          discount_percentage: newProgram.discount_percentage,
          min_visits: newProgram.min_visits
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: "Программа создана",
        description: "Новая программа лояльности успешно создана"
      });
      
      // Приведение типа к нашему интерфейсу
      const newProgramData = data as unknown as LoyaltyProgram;
      onProgramCreated(newProgramData);
      setNewProgram({
        name: "",
        discount_percentage: 5,
        min_visits: 3
      });
    } catch (error) {
      console.error('Error creating loyalty program:', error);
      toast({
        title: "Ошибка создания",
        description: "Не удалось создать программу лояльности",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Gift className="h-5 w-5 mr-2 text-primary" />
          Список программ лояльности
        </CardTitle>
        <CardDescription>
          Управление скидками и бонусами для постоянных клиентов
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Новая программа
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Создать программу лояльности</DialogTitle>
                <DialogDescription>
                  Добавьте новую программу лояльности для клиентов
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Название программы</Label>
                  <Input
                    id="name"
                    value={newProgram.name}
                    onChange={(e) => setNewProgram({...newProgram, name: e.target.value})}
                    placeholder="VIP клиент"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="discount">Скидка (%)</Label>
                    <Input
                      id="discount"
                      type="number"
                      min="1"
                      max="100"
                      value={newProgram.discount_percentage}
                      onChange={(e) => setNewProgram({...newProgram, discount_percentage: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="visits">Мин. посещений</Label>
                    <Input
                      id="visits"
                      type="number"
                      min="1"
                      value={newProgram.min_visits}
                      onChange={(e) => setNewProgram({...newProgram, min_visits: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button onClick={createProgram}>Создать программу</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        {loading ? (
          <div className="flex justify-center p-4">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : programs.length > 0 ? (
          <div className="space-y-4">
            {programs.map((program) => (
              <div key={program.id} className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">{program.name}</h4>
                  <div className="flex space-x-3 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center">
                      <Percent className="h-3.5 w-3.5 mr-1" />
                      Скидка: {program.discount_percentage}%
                    </span>
                    <span className="flex items-center">
                      <Users className="h-3.5 w-3.5 mr-1" />
                      Мин. визитов: {program.min_visits}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive">
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            Нет созданных программ лояльности
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LoyaltyProgramList;

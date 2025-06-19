import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Users } from "lucide-react";

interface LoyaltyProgram {
  id: string;
  name: string;
  discount_percentage: number;
  min_visits: number;
  created_at: string;
}

interface ClientLoyalty {
  id: string;
  user_id: string;
  loyalty_program_id: string;
  active_from: string;
  full_name: string;
  program_name: string;
  discount_percentage: number;
}

interface ClientLoyaltyListProps {
  clientLoyalties: ClientLoyalty[];
  programs: LoyaltyProgram[];
  clients: {id: string, full_name: string}[];
  onClientLoyaltyAdded: () => void;
}

const ClientLoyaltyList = ({ 
  clientLoyalties, 
  programs, 
  clients, 
  onClientLoyaltyAdded 
}: ClientLoyaltyListProps) => {
  const { toast } = useToast();
  const [newClientLoyalty, setNewClientLoyalty] = useState({
    userId: "",
    programId: ""
  });

  const assignClientToProgram = async () => {
    try {
      if (!newClientLoyalty.userId || !newClientLoyalty.programId) {
        toast({
          title: "Ошибка",
          description: "Выберите клиента и программу лояльности",
          variant: "destructive"
        });
        return;
      }
      
      // Приведение типа для новой таблицы
      const { data, error } = await supabase
        .from('client_loyalty_programs')
        .insert({
          user_id: newClientLoyalty.userId,
          loyalty_program_id: newClientLoyalty.programId,
          active_from: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: "Программа назначена",
        description: "Клиент успешно добавлен в программу лояльности"
      });
      
      onClientLoyaltyAdded();
      setNewClientLoyalty({
        userId: "",
        programId: ""
      });
    } catch (error) {
      console.error('Error assigning client to loyalty program:', error);
      toast({
        title: "Ошибка назначения",
        description: "Не удалось добавить клиента в программу лояльности",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="h-5 w-5 mr-2 text-primary" />
          Клиенты в программах лояльности
        </CardTitle>
        <CardDescription>
          Управление участниками программ лояльности
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Добавить клиента в программу
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Добавить клиента в программу</DialogTitle>
                <DialogDescription>
                  Выберите клиента и программу лояльности
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="client">Клиент</Label>
                  <select 
                    id="client"
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    value={newClientLoyalty.userId}
                    onChange={(e) => setNewClientLoyalty({...newClientLoyalty, userId: e.target.value})}
                  >
                    <option value="">Выберите клиента</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.full_name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="program">Программа лояльности</Label>
                  <select 
                    id="program"
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    value={newClientLoyalty.programId}
                    onChange={(e) => setNewClientLoyalty({...newClientLoyalty, programId: e.target.value})}
                  >
                    <option value="">Выберите программу</option>
                    {programs.map((program) => (
                      <option key={program.id} value={program.id}>
                        {program.name} (скидка {program.discount_percentage}%)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <DialogFooter>
                <Button onClick={assignClientToProgram}>Добавить клиента</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        {clientLoyalties.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Клиент</TableHead>
                <TableHead>Программа</TableHead>
                <TableHead>Скидка</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientLoyalties.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.full_name}</TableCell>
                  <TableCell>{item.program_name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {item.discount_percentage}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            Нет клиентов в программах лояльности
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClientLoyaltyList;

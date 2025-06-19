import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import LoyaltyProgramList from "./LoyaltyProgramList";
import ClientLoyaltyList from "./ClientLoyaltyList";

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

const LoyaltyProgramContainer = () => {
  const { toast } = useToast();
  const [programs, setPrograms] = useState<LoyaltyProgram[]>([]);
  const [clientLoyalties, setClientLoyalties] = useState<ClientLoyalty[]>([]);
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<{id: string, full_name: string}[]>([]);

  useEffect(() => {
    fetchPrograms();
    fetchClientLoyalties();
    fetchClients();
  }, []);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      // Используем приведение типа для работы с новой таблицей, которая ещё не описана в типах
      const { data, error } = await supabase
        .from('loyalty_programs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Приведение типа к нашему интерфейсу
      setPrograms((data as unknown as LoyaltyProgram[]) || []);
    } catch (error) {
      console.error('Error fetching loyalty programs:', error);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить программы лояльности",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClientLoyalties = async () => {
    try {
      // Используем приведение типа для новой таблицы
      const { data, error } = await supabase
        .from('client_loyalty_programs')
        .select(`
          *,
          profiles(first_name, last_name),
          loyalty_programs(name, discount_percentage)
        `);
      
      if (error) throw error;
      
      // Преобразуем и типизируем данные корректно
      const formattedData = (data || []).map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        loyalty_program_id: item.loyalty_program_id,
        active_from: item.active_from,
        full_name: `${item.profiles?.first_name || ''} ${item.profiles?.last_name || ''}`,
        program_name: item.loyalty_programs?.name || '',
        discount_percentage: item.loyalty_programs?.discount_percentage || 0
      }));
      
      setClientLoyalties(formattedData);
    } catch (error) {
      console.error('Error fetching client loyalties:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('role', 'client');
      
      if (error) throw error;
      
      const formattedClients = (data || []).map(client => ({
        id: client.id,
        full_name: `${client.first_name} ${client.last_name}`
      }));
      
      setClients(formattedClients);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const handleProgramCreated = (newProgram: LoyaltyProgram) => {
    setPrograms([newProgram, ...programs]);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Программы лояльности</h2>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <LoyaltyProgramList 
          programs={programs} 
          loading={loading} 
          onProgramCreated={handleProgramCreated} 
        />
        
        <ClientLoyaltyList 
          clientLoyalties={clientLoyalties}
          programs={programs}
          clients={clients}
          onClientLoyaltyAdded={fetchClientLoyalties}
        />
      </div>
    </div>
  );
};

export default LoyaltyProgramContainer;

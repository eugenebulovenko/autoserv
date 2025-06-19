
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Minus, Save } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Part {
  id: string;
  name: string;
  price: number;
  quantity_in_stock: number;
}

interface PartsRequestProps {
  workOrderId: string;
  onSuccess?: () => void;
}

const PartsRequest = ({ workOrderId, onSuccess }: PartsRequestProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedParts, setSelectedParts] = useState<{
    partId: string;
    quantity: number;
  }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchParts = async () => {
      try {
        const { data, error } = await supabase
          .from('parts')
          .select('*')
          .order('name');

        if (error) throw error;
        if (data) setParts(data);
      } catch (error) {
        console.error('Error fetching parts:', error);
        toast({
          title: "Ошибка загрузки запчастей",
          description: "Не удалось загрузить список доступных запчастей",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchParts();
  }, [toast]);

  const addPartToRequest = () => {
    setSelectedParts([...selectedParts, { partId: "", quantity: 1 }]);
  };

  const removePart = (index: number) => {
    setSelectedParts(selectedParts.filter((_, i) => i !== index));
  };

  const updatePartId = (index: number, partId: string) => {
    const updatedParts = [...selectedParts];
    updatedParts[index].partId = partId;
    setSelectedParts(updatedParts);
  };

  const updateQuantity = (index: number, quantity: number) => {
    if (quantity < 1) return;
    
    const updatedParts = [...selectedParts];
    updatedParts[index].quantity = quantity;
    setSelectedParts(updatedParts);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Необходима авторизация",
        description: "Пожалуйста, войдите в систему для запроса запчастей",
        variant: "destructive",
      });
      return;
    }

    if (selectedParts.length === 0) {
      toast({
        title: "Выберите запчасти",
        description: "Пожалуйста, добавьте хотя бы одну запчасть в запрос",
        variant: "destructive",
      });
      return;
    }

    const invalidParts = selectedParts.filter(part => !part.partId);
    if (invalidParts.length > 0) {
      toast({
        title: "Некорректные данные",
        description: "Пожалуйста, выберите запчасть для каждой строки",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      // Prepare order parts data
      const orderPartsData = selectedParts.map(part => {
        const selectedPart = parts.find(p => p.id === part.partId);
        return {
          work_order_id: workOrderId,
          part_id: part.partId,
          quantity: part.quantity,
          price: selectedPart?.price || 0
        };
      });

      // Insert order parts
      const { error } = await supabase
        .from('order_parts')
        .insert(orderPartsData);

      if (error) throw error;

      // Add status update
      await supabase
        .from('order_status_updates')
        .insert({
          work_order_id: workOrderId,
          created_by: user.id,
          status: 'parts_requested',
          comment: `Запрошены запчасти: ${selectedParts.map(part => {
            const selectedPart = parts.find(p => p.id === part.partId);
            return `${selectedPart?.name} (${part.quantity} шт.)`;
          }).join(', ')}`
        });

      toast({
        title: "Запрос отправлен",
        description: "Запчасти были успешно запрошены",
      });

      // Reset form
      setSelectedParts([]);
      
      // Execute success callback if provided
      if (onSuccess) onSuccess();
      
    } catch (error) {
      console.error("Error requesting parts:", error);
      toast({
        title: "Ошибка при запросе запчастей",
        description: "Пожалуйста, попробуйте еще раз позже",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-3">
        {selectedParts.map((part, index) => (
          <div key={index} className="flex items-center gap-2">
            <Select 
              value={part.partId} 
              onValueChange={(value) => updatePartId(index, value)}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Выберите запчасть" />
              </SelectTrigger>
              <SelectContent>
                {parts.map((part) => (
                  <SelectItem key={part.id} value={part.id}>
                    {part.name} - {part.price} ₽ (в наличии: {part.quantity_in_stock})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex items-center">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => updateQuantity(index, part.quantity - 1)}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                min="1"
                value={part.quantity}
                onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 1)}
                className="w-16 text-center mx-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => updateQuantity(index, part.quantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={() => removePart(index)}
            >
              <Minus className="h-4 w-4" />
            </Button>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={addPartToRequest}
        >
          <Plus className="h-4 w-4 mr-2" /> Добавить запчасть
        </Button>
      </div>

      <Button 
        type="submit" 
        className="w-full" 
        disabled={submitting || selectedParts.length === 0}
      >
        {submitting ? (
          <span className="flex items-center">
            <span className="animate-spin mr-2">⟳</span> Отправка...
          </span>
        ) : (
          <span className="flex items-center">
            <Save className="h-4 w-4 mr-2" /> Запросить запчасти
          </span>
        )}
      </Button>
    </form>
  );
};

export default PartsRequest;

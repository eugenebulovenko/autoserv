import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { CreditCard, BanknoteIcon, CreditCardIcon } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { PaymentMethod } from "@/types/booking";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";

interface PaymentSelectorProps {
  workOrderId: string;
  amount: number;
  onSuccess?: () => void;
}

const PaymentSelector = ({ workOrderId, amount, onSuccess }: PaymentSelectorProps) => {
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [processing, setProcessing] = useState(false);

  const handlePayment = async () => {
    try {
      setProcessing(true);
      
      // В реальном приложении здесь была бы интеграция с платёжным шлюзом
      // Сейчас просто симулируем успешную оплату
      
      // Обновить статус заказ-наряда
      const { error } = await supabase
        .from('work_orders')
        .update({ 
          status: 'paid',
          total_cost: amount
        })
        .eq('id', workOrderId);
        
      if (error) throw error;
      
      // Добавить обновление статуса
      await supabase
        .from('order_status_updates')
        .insert({
          work_order_id: workOrderId,
          created_by: (await supabase.auth.getUser()).data.user?.id,
          status: 'paid',
          comment: `Оплата произведена через ${
            paymentMethod === 'online' ? 'онлайн-платеж' : 
            paymentMethod === 'card' ? 'карту' : 'наличные'
          }`
        });
      
      toast({
        title: "Оплата успешно произведена",
        description: `Сумма ${formatCurrency(amount)} успешно оплачена`,
      });
      
      if (onSuccess) onSuccess();
      
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Ошибка при оплате",
        description: "Пожалуйста, попробуйте позже или выберите другой способ оплаты",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <RadioGroup 
        value={paymentMethod} 
        onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        <div className="border rounded-lg p-4 cursor-pointer hover:bg-secondary/50 transition-colors flex items-start space-x-3">
          <RadioGroupItem value="online" id="online" className="mt-1" />
          <div className="flex-1">
            <Label htmlFor="online" className="font-medium text-base flex items-center">
              <CreditCard className="h-5 w-5 mr-2 text-primary" />
              Онлайн оплата
            </Label>
            <p className="text-muted-foreground text-sm mt-1">
              Оплата картой онлайн через защищенный шлюз
            </p>
          </div>
        </div>
        
        <div className="border rounded-lg p-4 cursor-pointer hover:bg-secondary/50 transition-colors flex items-start space-x-3">
          <RadioGroupItem value="card" id="card" className="mt-1" />
          <div className="flex-1">
            <Label htmlFor="card" className="font-medium text-base flex items-center">
              <CreditCardIcon className="h-5 w-5 mr-2 text-primary" />
              Картой при получении
            </Label>
            <p className="text-muted-foreground text-sm mt-1">
              Оплата картой на месте через терминал
            </p>
          </div>
        </div>
        
        <div className="border rounded-lg p-4 cursor-pointer hover:bg-secondary/50 transition-colors flex items-start space-x-3">
          <RadioGroupItem value="cash" id="cash" className="mt-1" />
          <div className="flex-1">
            <Label htmlFor="cash" className="font-medium text-base flex items-center">
              <BanknoteIcon className="h-5 w-5 mr-2 text-primary" />
              Наличными
            </Label>
            <p className="text-muted-foreground text-sm mt-1">
              Оплата наличными на месте
            </p>
          </div>
        </div>
      </RadioGroup>
      
      <div className="pt-4 border-t">
        <div className="flex justify-between mb-4">
          <span className="text-muted-foreground">Итого к оплате:</span>
          <span className="font-bold text-lg">{formatCurrency(amount)}</span>
        </div>
        
        <Tooltip>
  <TooltipTrigger asChild>
    <Button 
      onClick={handlePayment} 
      className="w-full"
      disabled={processing}
      variant="ghost"
      size="lg"
      aria-label="Оплатить"
    >
      <CreditCard className="mr-2 h-5 w-5" />
      {processing ? "Обработка платежа..." : "Оплатить"}
    </Button>
  </TooltipTrigger>
  <TooltipContent>Оплатить</TooltipContent>
</Tooltip>
        
        <p className="text-xs text-muted-foreground text-center mt-2">
          Нажимая кнопку "Оплатить", вы соглашаетесь с условиями оплаты и политикой возврата
        </p>
      </div>
    </div>
  );
};

export default PaymentSelector;

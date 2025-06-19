import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';

interface CancelAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: string | null;
  onCancelled: () => void;
}

export default function CancelAppointmentDialog({ open, onOpenChange, appointmentId, onCancelled }: CancelAppointmentDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    if (!appointmentId) return;
    setLoading(true);
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', appointmentId);
    setLoading(false);
    if (error) {
      toast({
        description: 'Ошибка при отмене записи',
        variant: 'destructive',
      });
    } else {
      toast({
        description: 'Запись успешно отменена',
        variant: 'default',
      });
      onOpenChange(false);
      onCancelled();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Отменить запись?</DialogTitle>
        </DialogHeader>
        <p>Вы уверены, что хотите отменить эту запись? Это действие нельзя будет отменить.</p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Отмена
          </Button>
          <Button variant="destructive" onClick={handleCancel} disabled={loading}>
            {loading ? 'Отмена...' : 'Да, отменить'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

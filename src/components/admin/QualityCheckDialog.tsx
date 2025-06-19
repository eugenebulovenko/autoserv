import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import QualityCheckAdmin from './QualityCheckAdmin';

interface QualityCheckDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workOrderId: string | null;
  onComplete: () => void;
}

const QualityCheckDialog: React.FC<QualityCheckDialogProps> = ({
  open,
  onOpenChange,
  workOrderId,
  onComplete
}) => {
  if (!workOrderId) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Проверка качества</DialogTitle>
          <DialogDescription>
            Оцените качество выполненных работ по заказу
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <QualityCheckAdmin
            workOrderId={workOrderId}
            onComplete={onComplete}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QualityCheckDialog;

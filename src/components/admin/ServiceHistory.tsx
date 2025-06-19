import { useState } from 'react';
import type { ServiceHistory as ServiceHistoryType } from '@/types/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { getRuStatusText } from "@/utils/statusUtils";

interface ServiceHistoryProps {
  vehicleId: string;
}

export function ServiceHistory({ vehicleId }: ServiceHistoryProps) {
  const [history, setHistory] = useState<ServiceHistoryType[]>([]);

  const getStatusBadge = (status: ServiceHistoryType['status']) => {
    const variants = {
      completed: 'bg-green-100 text-green-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      scheduled: 'bg-blue-100 text-blue-800',
    };
    return <Badge className={variants[status]}>{getRuStatusText(status)}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">История обслуживания</h3>
        <Button>Добавить запись</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Дата</TableHead>
            <TableHead>Тип услуги</TableHead>
            <TableHead>Описание</TableHead>
            <TableHead>Стоимость</TableHead>
            <TableHead>Статус</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((record) => (
            <TableRow key={record.id}>
              <TableCell>
                {format(new Date(record.serviceDate), 'dd MMMM yyyy', { locale: ru })}
              </TableCell>
              <TableCell>{record.serviceType}</TableCell>
              <TableCell>{record.description}</TableCell>
              <TableCell>{record.cost} ₽</TableCell>
              <TableCell>{getStatusBadge(record.status)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 
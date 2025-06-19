/**
 * Утилиты для работы со статусами заказов и этапов
 */

/**
 * Возвращает цвет для статуса
 * @param status - Статус заказ-наряда
 * @returns CSS класс с цветом
 */
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'created':
      return 'bg-yellow-100 text-yellow-800';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800';
    case 'parts_waiting':
      return 'bg-orange-100 text-orange-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'quality_passed':
      return 'bg-purple-100 text-purple-800';
    case 'quality_issues':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Возвращает текстовое описание статуса
 * @param status - Статус заказ-наряда
 * @returns Текстовое описание статуса
 */
export const getStatusText = (status: string): string => {
  return getRuStatusText(status);
};

/**
 * Возвращает статус на русском языке для любого статуса
 * @param status - статус заказа/записи
 */
export const getRuStatusText = (status: string): string => {
  // Проверяем, является ли статус этапом работ
  if (status.startsWith('stage_')) {
    return 'Этап работ завершен';
  }
  
  switch (status) {
    case 'created': return 'Создан';
    case 'confirmed': return 'Подтверждён';
    case 'in_progress': return 'В работе';
    case 'parts_waiting': return 'Ожидание запчастей';
    case 'completed': return 'Завершён';
    case 'cancelled': return 'Отменён';
    case 'waiting': return 'В ожидании';
    case 'quality_passed': return 'Проверка пройдена';
    case 'quality_issues': return 'Есть проблемы';
    case 'pending': return 'Ожидает';
    case 'diagnostic': return 'Диагностика';
    case 'disassembly': return 'Разборка';
    case 'repair': return 'Ремонт';
    case 'assembly': return 'Сборка';
    case 'testing': return 'Тестирование';
    case 'finishing': return 'Завершение';
    default: return 'Неизвестен';
  }
};

/**
 * Проверить, является ли статус этапом работ
 */
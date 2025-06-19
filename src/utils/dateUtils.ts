/**
 * Форматирует дату в русский формат
 * @param dateString - Строка с датой
 * @returns Отформатированная дата
 */
export const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'Не указана';
  return new Date(dateString).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Форматирует время, обрезая секунды
 * @param timeString - Строка со временем
 * @returns Отформатированное время
 */
export const formatTime = (timeString: string): string => {
  return timeString.substring(0, 5);
}; 
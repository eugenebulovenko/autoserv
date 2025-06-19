import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Форматирует число с разделителями тысяч
 * @param value Число для форматирования
 * @param decimals Количество десятичных знаков
 * @returns Отформатированное число в виде строки
 */
export function formatNumber(value: number, decimals = 0): string {
  if (value === null || value === undefined) return '0';
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Форматирует число как денежную сумму в BYN
 * @param value Число для форматирования
 * @returns Отформатированная денежная сумма в виде строки "100,00 BYN"
 */
export function formatCurrency(value: number): string {
  if (value === null || value === undefined) return '0,00 BYN';
  // Форматируем с двумя знаками после запятой и запятой как разделителем
  const formatted = value
    .toFixed(2)
    .replace('.', ',')
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' '); // Разделитель тысяч — пробел
  return `${formatted} BYN`;
}

/**
 * Форматирует дату в локализованный формат
 * @param date Дата для форматирования
 * @param format Формат (short, medium, long)
 * @returns Отформатированная дата в виде строки
 */
export function formatDate(date: Date | string, format: 'short' | 'medium' | 'long' = 'medium'): string {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: format,
  }).format(dateObj);
}

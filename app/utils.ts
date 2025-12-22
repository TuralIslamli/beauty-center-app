import { roles } from './components/consts';

/**
 * Получить название роли по ID
 */
export const getRoleName = (userRoleId: number): string | undefined => {
  return roles.find((role) => role.id === userRoleId)?.name;
};

/**
 * Форматирование даты в формат YYYY-MM-DD
 */
export const formatDate = (date: Date | null | undefined): string => {
  if (!date) return '';
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

/**
 * Форматирование даты в формат DD-MM-YYYY
 */
export const formatDateDMY = (date: Date | null | undefined): string => {
  if (!date) return '';
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${day}-${month}-${year}`;
};

/**
 * Форматирование цены в валюте AZN
 */
export const formatPrice = (amount: number | string): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  const formatter = new Intl.NumberFormat('az-AZ', {
    style: 'currency',
    currency: 'AZN',
  });

  const parts = formatter.formatToParts(numAmount);
  const currencySymbol = parts.find((part) => part.type === 'currency')?.value ?? 'AZN';
  const formattedPrice = parts
    .filter((part) => part.type !== 'currency')
    .map((part) => part.value)
    .join('');

  return `${formattedPrice} ${currencySymbol}`;
};

/**
 * Форматирование номера телефона
 */
export const formatPhone = (phone: string | null | undefined): string => {
  if (!phone) return '';
  return phone.startsWith('+') ? phone : `+${phone}`;
};

/**
 * Проверка наличия разрешений на фильтрацию
 */
export const haveFilterPermissions = (permissions: string[]): boolean => {
  const filters = [
    'service.filter.status',
    'service.filter.date',
    'service.filter.client_name',
    'service.filter.client_phone',
    'service.filter.service_type',
    'service.filter.doctor',
    'reservation.filter.status',
    'reservation.filter.date',
    'reservation.filter.client_name',
    'reservation.filter.client_phone',
    'reservation.filter.service_type',
    'reservation.filter.doctor',
  ];
  
  return filters.some((filter) => permissions.includes(filter));
};

/**
 * Проверка, является ли дата сегодняшней
 */
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
};

/**
 * Проверка, является ли строковая дата сегодняшней
 */
export const isTodayString = (dateString: string): boolean => {
  const inputDate = new Date(dateString);
  return isToday(inputDate);
};

/**
 * Проверка равенства двух дат (без учёта времени)
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

/**
 * Получить дату N дней назад
 */
export const getDaysAgo = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

export const roles = [
  { id: 2, name: 'Admin' },
  { id: 3, name: 'Cashier' },
  { id: 4, name: 'Doctor' },
  { id: 5, name: 'Reserver' },
] as const;

export const paymentTypes = [
  { id: 0, name: 'Cash' },
  { id: 1, name: 'Card' },
] as const;

export const serviceStatuses = [
  { id: 0, name: 'New' },
  { id: 1, name: 'Accepted' },
  { id: 2, name: 'Rejected' },
] as const;

export const bookingStatuses = [
  { id: 0, name: 'Ləğv' },
  { id: 1, name: 'Gəldi' },
  { id: 2, name: 'Gözlənilir' },
  { id: 3, name: 'Qəbul edildi' },
  { id: 4, name: 'Online' },
] as const;

export const daysOfWeek = [
  { id: 1, name: 'Bazar ertəsi' },
  { id: 2, name: 'İkinci gün' },
  { id: 3, name: 'Çərşənbə' },
  { id: 4, name: 'Cümə axşamı' },
  { id: 5, name: 'Cümə' },
  { id: 6, name: 'Şənbə' },
  { id: 7, name: 'Bazar' },
] as const;

import { ICredit, CreditSessionStatus, CreditStatus } from './types';

export const creditBanks = [
  { id: 'kapital', name: 'Kapital' },
  { id: 'pasha', name: 'Pasha' },
];

export const creditStatuses: Array<{ id: CreditStatus; name: string }> = [
  { id: 'active', name: 'Active' },
  { id: 'finished', name: 'Finished' },
  { id: 'rejected', name: 'Rejected' },
];

export const creditSessionStatuses: Array<{
  id: CreditSessionStatus;
  name: string;
}> = [
  { id: 'arrived', name: 'Gəldi' },
  { id: 'pending', name: 'Gözlənilir' },
  { id: 'rejected', name: 'İmtina' },
];

export const mockDoctors = [
  { id: 1, full_name: 'Aysel Mammadova' },
  { id: 2, full_name: 'Leyla Aliyeva' },
  { id: 3, full_name: 'Nigar Hasanli' },
];

export const mockServiceTypes = [
  { id: 1, name: 'Lazer epilyasiya', price: '120', customer_visible: true },
  { id: 2, name: 'Kosmetoloji qulluq', price: '90', customer_visible: true },
  { id: 3, name: 'Masaj', price: '70', customer_visible: true },
];

export const mockCredits: ICredit[] = [
  {
    id: 1,
    created_at: `${new Date().toISOString().slice(0, 10)} 10:20`,
    client_name: 'Ayla Karimova',
    client_phone: '994501112233',
    status: 'active',
    sessions_count: 3,
    bank: 'Kapital',
    amount: 210,
    received_amount: 190,
    comment: 'İlk kredit sifarişi',
    service_types: [mockServiceTypes[0], mockServiceTypes[2]],
    sessions: [
      { id: 1, date: new Date(), doctor: mockDoctors[0], status: 'arrived' },
      { id: 2, date: new Date(), doctor: mockDoctors[1], status: 'pending' },
      { id: 3, date: new Date(), doctor: mockDoctors[2], status: 'pending' },
    ],
  },
  {
    id: 2,
    created_at: `${new Date().toISOString().slice(0, 10)} 13:45`,
    client_name: 'Nermin Safarova',
    client_phone: '994552224455',
    status: 'finished',
    sessions_count: 4,
    bank: 'Pasha',
    amount: 360,
    received_amount: 360,
    service_types: [mockServiceTypes[1]],
    sessions: [
      { id: 1, date: new Date(), doctor: mockDoctors[1], status: 'arrived' },
      { id: 2, date: new Date(), doctor: mockDoctors[1], status: 'arrived' },
      { id: 3, date: new Date(), doctor: mockDoctors[0], status: 'arrived' },
      { id: 4, date: new Date(), doctor: mockDoctors[2], status: 'arrived' },
    ],
  },
  {
    id: 3,
    created_at: '2026-04-22 16:10',
    client_name: 'Gunel Abbasova',
    client_phone: '994701234567',
    status: 'rejected',
    sessions_count: 2,
    bank: 'Kapital',
    amount: 180,
    received_amount: 0,
    comment: 'Bank imtina etdi',
    service_types: [mockServiceTypes[1], mockServiceTypes[2]],
    sessions: [
      { id: 1, date: new Date('2026-04-24'), doctor: mockDoctors[0], status: 'rejected' },
      { id: 2, date: new Date('2026-04-29'), doctor: mockDoctors[2], status: 'rejected' },
    ],
  },
];

import { CreditSessionStatus, ICreditSession } from './types';

export const CREDIT_ROWS = 10;
export const DEFAULT_CREDIT_SESSION_COUNT = 3;

export const creditSessionStatuses: Array<{
  id: CreditSessionStatus;
  name: string;
}> = [
  { id: 'arrived', name: 'Gəldi' },
  { id: 'pending', name: 'Gözlənilir' },
  { id: 'rejected', name: 'İmtina' },
];

export const sessionStatusToReservationStatus: Record<CreditSessionStatus, number> = {
  rejected: 0,
  arrived: 1,
  pending: 2,
};

export const reservationStatusToSessionStatus: Record<number, CreditSessionStatus> = {
  0: 'rejected',
  1: 'arrived',
  2: 'pending',
  3: 'arrived',
  4: 'pending',
};

export const createDefaultCreditSessions = (
  count = DEFAULT_CREDIT_SESSION_COUNT,
): ICreditSession[] =>
  Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    date: null,
    status: 'pending',
  }));

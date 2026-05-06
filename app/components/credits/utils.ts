import {
  IDoctor,
  IServiceCreditBank,
  IServiceCreditBankData,
  IServiceCreditFields,
} from '@/app/types';
import { formatDate } from '@/app/utils';
import {
  createDefaultCreditSessions,
  reservationStatusToSessionStatus,
  sessionStatusToReservationStatus,
} from './consts';
import {
  ICredit,
  ICreditFormPayload,
  ICreditSession,
  IServiceCreditData,
} from './types';

export type ServiceCreditResponse = IServiceCreditData | ICredit | undefined;
export type ServiceCreditBankResponse = IServiceCreditBankData | IServiceCreditBank;

export const getCreditFromResponse = (
  response: ServiceCreditResponse,
): ICredit | undefined => {
  if (!response) return undefined;

  return 'data' in response ? response.data : response;
};

export const getBankFromResponse = (
  response: ServiceCreditBankResponse,
): IServiceCreditBank => ('data' in response ? response.data : response);

export const parseCreditDate = (value?: string): Date | null => {
  if (!value) return null;

  const [datePart] = value.split(' ');
  const parts = datePart.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return null;

  const isYearFirst = parts[0] > 31;
  const year = isYearFirst ? parts[0] : parts[2];
  const month = parts[1] - 1;
  const day = isYearFirst ? parts[2] : parts[0];
  const date = new Date(year, month, day);

  return Number.isNaN(date.getTime()) ? null : date;
};

export const getInitialCreditSessions = (
  credit: ICredit,
  doctors: IDoctor[],
): ICreditSession[] => {
  if (credit.visits?.length) {
    return credit.visits.map((visit, index) => {
      const doctor = visit.doctor
        ? doctors.find((item) => item.id === visit.doctor?.id) ?? {
            id: visit.doctor.id,
            full_name: `${visit.doctor.name} ${visit.doctor.surname}`.trim(),
          }
        : undefined;

      return {
        id: visit.id || index + 1,
        date: parseCreditDate(visit.reservation_date),
        doctor,
        status: reservationStatusToSessionStatus[visit.status] ?? 'pending',
      };
    });
  }

  return credit.sessions?.length ? credit.sessions : createDefaultCreditSessions();
};

export const getInitialCreditBank = (
  creditBank: ICredit['bank'],
  banks: IServiceCreditBank[],
): IServiceCreditBank | null => {
  if (!creditBank) return null;

  if (typeof creditBank === 'string') {
    return (
      banks.find(
        (bank) => bank.name.toLowerCase() === creditBank.toLowerCase(),
      ) ?? null
    );
  }

  return banks.find((bank) => bank.id === creditBank.id) ?? creditBank;
};

export const buildServiceCreditPayload = (
  payload: ICreditFormPayload,
  options: { includeBank?: boolean } = {},
): IServiceCreditFields => {
  const requestPayload: IServiceCreditFields = {
    client_name: payload.client_name,
    client_phone: payload.client_phone,
    service_types: payload.service_types.map((service) => ({ id: service.id })),
    comment: payload.comment,
    amount: payload.amount,
    visits: payload.sessions.map((session) => ({
      id: session.id,
      status: sessionStatusToReservationStatus[session.status],
      doctor_id: session.doctor?.id ?? null,
      reservation_date: session.doctor && session.date
        ? `${formatDate(session.date)} 00:00:00`
        : null,
    })),
  };

  if (options.includeBank !== false) {
    requestPayload.bank_id =
      typeof payload.bank === 'string'
        ? null
        : payload.bank?.id ?? null;
  }

  return requestPayload;
};

export const buildCreditFromPayload = (
  payload: ICreditFormPayload,
  credit?: ICredit,
): ICredit => {
  const now = new Date();
  const createdAt =
    credit?.created_at ?? `${formatDate(now)} ${now.toTimeString().slice(0, 5)}`;

  return {
    ...credit,
    id: credit?.id ?? 0,
    created_at: createdAt,
    client_name: payload.client_name,
    client_phone: payload.client_phone,
    status: credit?.status ?? 'active',
    sessions_count: payload.sessions_count,
    bank: payload.bank,
    amount: payload.amount,
    comment: payload.comment,
    service_types: payload.service_types,
    sessions: payload.sessions,
    visits: payload.sessions.map((session) => ({
      id: session.id,
      status: sessionStatusToReservationStatus[session.status],
      doctor: session.doctor
        ? {
            id: session.doctor.id,
            name: session.doctor.full_name ?? '',
            surname: '',
            email: '',
            role: { id: 0, name: '', permissions: [] },
          }
        : undefined,
      reservation_date: session.date
        ? `${formatDate(session.date)} 00:00:00`
        : '',
    })),
  };
};

export const getVisitStatusCounts = (credit: ICredit): Record<number, number> =>
  (credit.visits ?? []).reduce<Record<number, number>>((acc, visit) => {
    acc[visit.status] = (acc[visit.status] ?? 0) + 1;
    return acc;
  }, {});

export const getBookingStatusSeverity = (status?: string) => {
  switch (status) {
    case 'Ləğv':
    case 'İmtina':
      return 'danger';
    case 'Gəldi':
      return 'warning';
    case 'Qəbul edildi':
      return 'success';
    case 'Gözlənilir':
    case 'Online':
      return 'info';
    default:
      return undefined;
  }
};

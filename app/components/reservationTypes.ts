/**
 * Типы резервов: доктор и косметолог — два независимых процесса.
 *
 * Здесь собраны все различия между ними: id для бэкенда, лейблы и права.
 * Права у косметолога сейчас те же, что у доктора (`reservation.*`) — если
 * бэкенд их разделит, правится только этот файл.
 */
export enum ReservationType {
  DOCTOR = 1,
  COSMETOLOGIST = 2,
}

interface IReservationPermissions {
  update: string;
  delete: string;
  getPastData: string;
  filterStatus: string;
  filterDate: string;
  filterClientName: string;
  filterClientPhone: string;
  filterDoctor: string;
}

export interface IReservationTypeConfig {
  id: ReservationType;
  /** Подпись в дропдауне выбора типа */
  name: string;
  /** Заголовок колонки исполнителя и label в диалоге */
  performerLabel: string;
  performerPlaceholder: string;
  permissions: IReservationPermissions;
}

const reservationPermissions: IReservationPermissions = {
  update: 'reservation.update',
  delete: 'reservation.delete',
  getPastData: 'reservation.get_past_data',
  filterStatus: 'reservation.filter.status',
  filterDate: 'reservation.filter.date',
  filterClientName: 'reservation.filter.client_name',
  filterClientPhone: 'reservation.filter.client_phone',
  filterDoctor: 'reservation.filter.doctor',
};

export const reservationTypes: IReservationTypeConfig[] = [
  {
    id: ReservationType.DOCTOR,
    name: 'Doktor',
    performerLabel: 'Doktor',
    performerPlaceholder: 'Doktor seçin',
    permissions: reservationPermissions,
  },
  {
    id: ReservationType.COSMETOLOGIST,
    name: 'Kosmetoloq',
    performerLabel: 'Kosmetoloq',
    performerPlaceholder: 'Kosmetoloq seçin',
    permissions: reservationPermissions,
  },
];

export const RESERVATION_TYPE_STORAGE_KEY = 'reservationType';

const DEFAULT_TYPE = ReservationType.DOCTOR;

/**
 * Конфиг типа по id, с фолбэком на доктора
 */
export const getReservationTypeConfig = (
  type?: ReservationType,
): IReservationTypeConfig =>
  reservationTypes.find((item) => item.id === type) ?? reservationTypes[0];

/**
 * Тип из localStorage, по умолчанию — доктор
 */
export const getStoredReservationType = (): ReservationType => {
  if (typeof window === 'undefined') {
    return DEFAULT_TYPE;
  }

  const stored = Number(
    localStorage.getItem(RESERVATION_TYPE_STORAGE_KEY),
  ) as ReservationType;

  return reservationTypes.some((item) => item.id === stored)
    ? stored
    : DEFAULT_TYPE;
};

export const storeReservationType = (type: ReservationType): void => {
  localStorage.setItem(RESERVATION_TYPE_STORAGE_KEY, type.toString());
};

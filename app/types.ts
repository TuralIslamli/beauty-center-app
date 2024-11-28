import { Nullable } from 'primereact/ts-helpers';

export interface ITotalAmount {
  pos: string;
  cash: string;
  total: string;
}

export interface IUser {
  id: number;
  name: string;
  surname: string;
  email: string;
  role: IRole;
}

export interface IRole {
  id: number;
  name: string;
  permissions: Array<{ id: number; name: string }>;
}
export interface IUserFields {
  name: string;
  surname: string;
  email: string;
  roleId: number;
  password?: string;
  password_repeat?: string;
}

export interface IUpdateUser extends IUserFields {
  id: number;
}

export interface IUserData {
  data: IUser[];
  meta: { total: number };
}

export interface IUserRS {
  data: IUser;
}

export interface ILoginFields {
  email: string;
  password: string;
}

export interface INavigationProps {
  size?: number;
  page?: number;
}

export interface IServicesTableProps extends INavigationProps {
  status?: number;
  from_date: string;
  to_date: string;
  client_name?: string;
  client_phone?: number | null;
  service_types?: IServiceType[] | number[];
  user_id?: number;
}

export interface IBookingTableProps extends INavigationProps {
  status?: number;
  from_date: string;
  to_date: string;
  client_name?: string;
  client_phone?: number | null;
  service_types?: IServiceType[] | number[];
  doctor_id?: number;
}

export interface IServiceTypesData {
  data: IServiceType[];
  meta: { total: number };
}

export interface IServiceType {
  id: number;
  name: string;
  price: string;
}

export interface IBookingTimeData {
  data: IBookingTime[];
  meta: { total: number };
}

export interface IBookingTime {
  id: number;
  time: string;
  reservation_count: string;
}

export interface IServiceTypeFields {
  name: string;
  price: number;
}

export interface IBookingTimeFields {
  time: string;
  reservation_count: number;
}

export interface IServiceTypeRS {
  data: IServiceType[];
}

export interface IService {
  id: number;
  status: number;
  amount: string;
  cash_amount: string;
  card_amount: string;
  payment_type: number;
  service_types: IServiceType[];
  client_name: string;
  client_phone: string;
  created_at: string;
  user: IUser;
  reject_comment?: string;
}

export interface IBooking {
  id: number;
  status: number;
  reservation_date: string;
  client_name: string;
  client_phone: string;
  doctor: IUser;
}

export interface IServiceRS {
  data: IService;
}
export interface IServicesData {
  data: IService[];
  meta: { total: number };
}

export interface ILogsData {
  data: ILog[];
}

export interface ILog {
  activity_logs: any;
  price_difference: IPriceDifference;
  service: IService;
}

export interface IPriceDifference {
  is_different: boolean;
  service_price_sum: number;
  service_types_price_sum: number;
  updated_at: string;
  causer: IUser;
}

export interface IActivityLog {}

export interface IBookingsData {
  data: IBooking[];
  meta: { total: number };
}

export interface IServiceFields {
  service_types: { id: number }[];
  client_name: string;
  client_phone?: string;
  cash_amount?: number;
  card_amount?: number;
  payment_type?: number;
  user_id?: number;
  status?: number;
  reject_comment?: string | null;
  id?: number;
}

export interface IBookingFields {
  client_name: string;
  client_phone?: string;
  doctor_id?: number;
  reservation_date: Nullable<Date> | string;
  hour?: string;
  id?: number;
  status?: number;
}

export interface IDoctor {
  id: number;
  full_name?: string;
}

export interface IHour {
  id?: number;
  time?: string;
  active?: boolean;
  remaining_space: string;
}

export interface IDoctorRS {
  data: IDoctor[];
}

export interface IHourRS {
  data: IHour[];
}

export interface IBonusesProps {
  from_date?: string;
  to_date?: string;
  user_id?: number;
}

export interface IBonus {
  total_amount: string;
  user: IUser;
  bonus_per_days: IPerDayBonus[];
}

export interface IPerDayBonus {
  date: string;
  bonus_per_days: string;
}
export interface IBonusesRS {
  data: IBonus[];
}

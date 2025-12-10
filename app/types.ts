import { Nullable } from 'primereact/ts-helpers';

export interface ITotalAmount {
  advance: string;
  amount: string;
  total: string;
}

export interface IUser {
  id: number;
  name: string;
  surname: string;
  email: string;
  role: IRole;
  customer_visible?: boolean;
  day_off?: number;
}

export interface IAdvanceInfo {
  id: number;
  user: IUser;
  transferred_at: string;
}

export interface IAdvanceInfoRs {
  data: IAdvanceInfo;
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
  customer_visible?: boolean;
  day_off?: number;
}

export interface IUpdateUser extends IUserFields {
  id: number;
}

export interface IUserData {
  data: IUser[];
  meta: { total: number };
}

export interface IAdvanceListData {
  data: IAdvanceInfo[];
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

export interface IServiceTypesTableProps extends INavigationProps {
  name?: string;
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

export interface IReportsTableProps extends INavigationProps {
  from_date: string;
  to_date: string;
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
  customer_visible: boolean;
}

export interface IExpensesData {
  data: IExpense[];
  meta: { total: number };
}

export interface IExpense {
  id: number;
  name: string;
  amount: number;
  expense_date?: string;
  created_at?: string;
  description: string;
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

export interface IExpenseFields {
  name: string;
  description: string;
  amount: number;
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
  advance_amount: number;
  services_total: number;
  payment_type: number;
  service_types: IServiceType[];
  client_name: string;
  client_phone: string;
  created_at: string;
  user: IUser;
  reject_comment?: string;
  comment?: string;
}

export interface IReport {
  id: number;
  amount: string;
  service_type: string;
  client_name: string;
  client_phone: string;
  user: IUser;
  date_time: string;
  amount_change_history: IAmountChangeHistory[];
}

export interface IAmountChangeHistory {
  id: number;
  amount: string;
  created_at: string;
  causer: IUser;
}

export interface IBooking {
  service_types: IServiceType[];
  id: number;
  status: number;
  reservation_date: string;
  real_reservation_date: string;
  client_name: string;
  client_phone: string;
  doctor: IUser;
  is_out_of_turn: boolean;
  advance_amount: number;
}

export interface IServiceRS {
  data: IService;
}
export interface IServicesData {
  data: IService[];
  meta: { total: number };
}

export interface IReportsData {
  data: IReport[];
  meta: { total: number };
}

export interface ILogsData {
  data: ILog[];
  meta: { total: number };
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
  client_phone?: string | null;
  amount?: number;
  advance_amount?: number;
  user_id?: number;
  status?: number;
  reject_comment?: string | null;
  comment?: string | null;
  id?: number;
}

export interface ITimeZone {
  date_time: string;
}

export interface IBookingFields {
  client_name: string;
  client_phone?: string;
  doctor_id?: number;
  reservation_date?: Nullable<Date> | string;
  hour: string;
  id?: number;
  status?: number;
  service_types?: { id: number }[];
  is_out_of_turn?: boolean;
  advance_amount?: number;
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

export interface ILogsProps {
  from_date?: string;
  to_date?: string;
  page?: number;
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

export interface IBonusesCoefficientRS {
  data: ICoefficinet;
}

export interface ICoefficinet {
  coefficient: number;
}

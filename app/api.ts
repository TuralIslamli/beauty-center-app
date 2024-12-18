import { axiosApi } from '../lib/axios';
import {
  IBonusesProps,
  IBookingFields,
  IBookingTableProps,
  IBookingTime,
  IBookingTimeFields,
  ILoginFields,
  ILogsProps,
  INavigationProps,
  IServiceFields,
  IServiceType,
  IServiceTypeFields,
  IServicesTableProps,
  IUpdateUser,
  IUserFields,
} from './types';

export default {
  postLogin: <T>(payload: ILoginFields): Promise<T> =>
    axiosApi.post('login', payload),
  getSelfInfo: <T>(): Promise<T> => axiosApi.get('users/self-info'),
  getServiceTypes: <T>({ page, size }: INavigationProps): Promise<T> =>
    axiosApi.get(`service-types?page=${page}&size=${size}`),
  getBookingTimes: <T>({ page, size }: INavigationProps): Promise<T> =>
    axiosApi.get(`reservation-times?page=${page}&size=${size}`),
  createBookingTime: <T>({
    time,
    reservation_count,
  }: IBookingTimeFields): Promise<T> =>
    axiosApi.post('reservation-times', { time, reservation_count }),
  updateBookingTime: <T>({
    id,
    time,
    reservation_count,
  }: IBookingTime): Promise<T> =>
    axiosApi.put(`reservation-times/${id}`, { time, reservation_count }),
  deleteBookingTime: (id: number | undefined) =>
    axiosApi.delete(`reservation-times/${id}`),
  deleteUser: (id: number | undefined) => axiosApi.delete(`users/${id}`),
  createUser: <T>(payload: IUserFields): Promise<T> =>
    axiosApi.post('users', payload),
  updateUser: <T>({
    name,
    surname,
    email,
    roleId,
    password,
    password_repeat,
    id,
  }: IUpdateUser): Promise<T> =>
    axiosApi.put(`users/${id}`, {
      name,
      surname,
      email,
      role_id: roleId,
      password,
      password_repeat,
    }),
  updateServiceType: <T>({ id, name, price }: IServiceType): Promise<T> =>
    axiosApi.put(`service-types/${id}`, { name, price }),
  createServiceType: <T>({ name, price }: IServiceTypeFields): Promise<T> =>
    axiosApi.post('service-types', { name, price }),
  deleteServiceType: (id: number | undefined) =>
    axiosApi.delete(`service-types/${id}`),
  getUsers: <T>({ page, size }: INavigationProps): Promise<T> =>
    axiosApi.get(`users?page=${page}&size=${size}`),
  getBookings: <T>({
    page,
    size,
    status,
    from_date,
    to_date,
    client_name,
    client_phone,
    service_types,
    doctor_id,
  }: IBookingTableProps): Promise<T> =>
    axiosApi.get(`reservations?&sort=asc&sorted_column=date_time`, {
      params: {
        status,
        from_date,
        to_date,
        client_name,
        client_phone,
        service_types,
        doctor_id,
      },
    }),
  getServices: <T>({
    page,
    size,
    status,
    from_date,
    to_date,
    client_name,
    client_phone,
    service_types,
    user_id,
  }: IServicesTableProps): Promise<T> =>
    axiosApi.get(`services?page=${page}&size=${size}&sort=desc`, {
      params: {
        status,
        from_date,
        to_date,
        client_name,
        client_phone,
        service_types,
        user_id,
      },
    }),
  getLogs: <T>({ from_date, to_date, page }: ILogsProps): Promise<T> =>
    axiosApi.get(`logs?page=${page}&size=${10}`, {
      params: {
        from_date,
        to_date,
      },
    }),
  deleteService: (id: number | undefined) => axiosApi.delete(`services/${id}`),
  deleteBooking: (id: number | undefined) =>
    axiosApi.delete(`reservations/${id}`),
  getBookingDoctors: <T>(dateTime: string): Promise<T> =>
    axiosApi.get(`reservations/users/input-search?date_time=${dateTime}`),
  getTotalAmount: <T>({
    status,
    from_date,
    to_date,
    client_name,
    client_phone,
    service_types,
    user_id,
  }: IServicesTableProps): Promise<T> =>
    axiosApi.get(`services/total-amounts`, {
      params: {
        status,
        from_date,
        to_date,
        client_name,
        client_phone,
        service_types,
        user_id,
      },
    }),
  getDoctors: <T>(): Promise<T> => axiosApi.get('users/input-search'),
  getDoctorById: <T>(id: number): Promise<T> => axiosApi.get(`users/${id}`),
  getHours: <T>(date: string): Promise<T> =>
    axiosApi.get(`reservation-times/input-search?date=${date}`),
  getInputServices: <T>(): Promise<T> =>
    axiosApi.get('service-types/input-search'),
  createService: <T>(payload: IServiceFields): Promise<T> =>
    axiosApi.post('services', payload),
  createBooking: <T>(payload: IBookingFields): Promise<T> =>
    axiosApi.post('reservations', payload),
  updateService: <T>(payload: IServiceFields): Promise<T> => {
    return axiosApi.put(`services/${payload.id}`, payload);
  },
  updateBooking: <T>(payload: IBookingFields): Promise<T> =>
    axiosApi.put(`reservations/${payload.id}`, payload),
  getDailyReportExcel: async (day: string) => {
    try {
      await axiosApi
        .get(`services/daily-report?excel_export=true&sorted_day=${day}`, {
          responseType: 'blob',
        })
        .then((data: any) => {
          {
            const blob = new Blob([data], {
              type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `daily_report_${day}.xlsx`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        });
    } catch (error) {
      console.error('Error downloading the file', error);
    }
  },
  getAllReportsExcel: async ({
    status,
    from_date,
    to_date,
    client_name,
    client_phone,
    service_types,
    user_id,
  }: IServicesTableProps) => {
    try {
      await axiosApi
        .get(`services/all-reports?excel_export=true&sort=desc`, {
          responseType: 'blob',
          params: {
            status,
            from_date,
            to_date,
            client_name,
            client_phone,
            service_types,
            user_id,
          },
        })
        .then((data: any) => {
          const blob = new Blob([data], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute(
            'download',
            `general_report_${from_date}/${to_date}.xlsx`
          );
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        });
    } catch (error) {
      console.error('Error downloading the file', error);
    }
  },
  getBonuses: <T>({ from_date, to_date, user_id }: IBonusesProps): Promise<T> =>
    axiosApi.get(`services/bonus-reports`, {
      params: {
        from_date,
        to_date,
        user_id,
      },
    }),

  patchBonusCoefficient: <T>(coefficient: number): Promise<T> =>
    axiosApi.patch('settings/bonus-coefficient', {
      coefficient,
    }),
  getBonusesCoefficient: <T>(): Promise<T> =>
    axiosApi.get(`settings/bonus-coefficient`),
  getBonusesExcel: async ({ from_date, to_date, user_id }: IBonusesProps) => {
    try {
      await axiosApi
        .get(`services/bonus-reports?excel_export=true`, {
          responseType: 'blob',
          params: {
            from_date,
            to_date,
            user_id,
          },
        })
        .then((data: any) => {
          const blob = new Blob([data], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute(
            'download',
            `bonus_report_${from_date}/${to_date}.xlsx`
          );
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        });
    } catch (error) {
      console.error('Error downloading the file', error);
    }
  },
};

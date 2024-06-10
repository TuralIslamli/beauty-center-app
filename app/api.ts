import { axiosApi } from "../lib/axios";
import {
  ILoginFields,
  INavigationProps,
  IServiceFields,
  IServiceType,
  IServiceTypeFields,
  IServicesTableProps,
  IUpdateUser,
  IUserFields,
} from "./types";

export default {
  postLogin: <T>(payload: ILoginFields): Promise<T> =>
    axiosApi.post("login", payload),
  getSelfInfo: <T>(): Promise<T> => axiosApi.get("users/self-info"),
  getServiceTypes: <T>({ page, size }: INavigationProps): Promise<T> =>
    axiosApi.get(`service-types?page=${page}&size=${size}`),
  deleteUser: (id: number | undefined) => axiosApi.delete(`users/${id}`),
  createUser: <T>(payload: IUserFields): Promise<T> =>
    axiosApi.post("users", payload),
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
      roleId,
      password,
      password_repeat,
    }),
  updateServiceType: <T>({ id, name, price }: IServiceType): Promise<T> =>
    axiosApi.put(`service-types/${id}`, { name, price }),
  createServiceType: <T>({ name, price }: IServiceTypeFields): Promise<T> =>
    axiosApi.post("service-types", { name, price }),
  deleteServiceType: (id: number | undefined) =>
    axiosApi.delete(`service-types/${id}`),
  getUsers: <T>({ page, size }: INavigationProps): Promise<T> =>
    axiosApi.get(`users?page=${page}&size=${size}`),
  getServices: <T>({
    page,
    size,
    status,
    from_date,
    to_date,
    client_name,
    client_phone,
    service_type_name,
    user_name,
  }: IServicesTableProps): Promise<T> =>
    axiosApi.get(`services?page=${page}&size=${size}&sort=desc`, {
      params: {
        status,
        from_date,
        to_date,
        client_name,
        client_phone,
        service_type_name,
        user_name,
      },
    }),
  getDoctors: <T>(): Promise<T> => axiosApi.get("users/input-search"),
  getInputServices: <T>(): Promise<T> =>
    axiosApi.get("service-types/input-search"),
  createService: <T>(payload: IServiceFields): Promise<T> =>
    axiosApi.post("services", payload),
  updateService: <T>(payload: IServiceFields): Promise<T> =>
    axiosApi.put(`services/${payload.id}`, payload),

  getDailyReportExcel: async (day: string) => {
    try {
      await axiosApi
        .get(`services/daily-report?excel_export=true&sorted_day=${day}`, {
          responseType: "blob", // Указываем тип ответа
        })
        .then((data: any) => {
          {
            const blob = new Blob([data], {
              type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `daily_report_${day}.xlsx`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        });
    } catch (error) {
      console.error("Error downloading the file", error);
    }
  },
  getAllReportsExcel: async ({
    status,
    from_date,
    to_date,
    client_name,
    client_phone,
    service_type_name,
    user_name,
  }: IServicesTableProps) => {
    try {
      await axiosApi
        .get(`services/all-reports?excel_export=true&sort=desc`, {
          responseType: "blob",
          params: {
            status,
            from_date,
            to_date,
            client_name,
            client_phone,
            service_type_name,
            user_name,
          },
        })
        .then((data: any) => {
          const blob = new Blob([data], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute(
            "download",
            `general_report_${from_date}/${to_date}.xlsx`
          );
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        });
    } catch (error) {
      console.error("Error downloading the file", error);
    }
  },
};

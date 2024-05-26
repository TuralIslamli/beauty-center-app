import { axiosApi } from "../lib/axios";
import {
  ILoginFields,
  INavigationProps,
  IServiceFields,
  IServiceType,
  IServiceTypeFields,
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
  getServices: <T>({ page, size }: INavigationProps): Promise<T> =>
    axiosApi.get(`services?page=${page}&size=${size}`),
  getDoctors: <T>(): Promise<T> => axiosApi.get("users/input-search"),
  getInputServices: <T>(): Promise<T> =>
    axiosApi.get("service-types/input-search"),
  createService: <T>(payload: IServiceFields): Promise<T> =>
    axiosApi.post("services", payload),
  updateService: <T>(payload: IServiceFields): Promise<T> =>
    axiosApi.put(`services/${payload.id}`, payload),
};

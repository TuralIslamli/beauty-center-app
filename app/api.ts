import { axiosApi } from "../lib/axios";
import {
  ILoginFields,
  INavigationProps,
  IServiceType,
  IServiceTypeFields,
  IUpdateUser,
  IUserFields,
} from "./types";

export default {
  postLogin: <T>(payload: ILoginFields): Promise<T> =>
    axiosApi.post("login", payload),
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
};

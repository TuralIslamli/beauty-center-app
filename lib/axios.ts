import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { redirect } from "next/navigation";

let toast: any = null;

export const setToastInstance = (toastInstance: any) => {
  toast = toastInstance;
};

const axiosInstance = axios.create({
  baseURL: "https://api.nargizestetik.az/api",
});

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig<any>) => {
    const accessToken = localStorage.getItem("token");

    if (accessToken) {
      config.headers = config.headers || {};
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }

    return config;
  }
);

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  async (error: AxiosError<any>) => {
    if (error.response && error.response.data.message === "USER_NOT_AUTHORIZED") {
      localStorage.clear();
      redirect("/login");
    } else if (error.response && error.response.data.message) {
      if (toast) {
        toast.show({
          severity: "error",
          summary: "Error",
          detail: error.response.data.message,
          life: 3000,
        });
      }
    }

    if (!error || !error.response) {
      return Promise.reject();
    }

    return Promise.reject(error);
  }
);

export const axiosApi: AxiosInstance = axiosInstance;

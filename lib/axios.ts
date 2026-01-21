import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { redirect } from "next/navigation";

let toast: any = null;

export const setToastInstance = (toastInstance: any) => {
  toast = toastInstance;
};
console.log(toast, 'toast');

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACK_API + "/api",
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
  (response: AxiosResponse) => response?.data,
  async (error: AxiosError<any>) => {
    console.log(error?.message, 'error');

    if (
      error.response &&
      error.response?.data.message === "USER_NOT_AUTHORIZED"
    ) {
      localStorage.clear();
      redirect("/login");
    } else if (
      (error.response && error.response?.data.message) ||
      error.message
    ) {
      if (toast) {
        let detailMessage = error.response?.data.message || error.message;

        if (error.response?.data?.errors) {
          const errors = error.response.data.errors;
          const errorMessages = Object.keys(errors).map(
            (key) => errors[key][0],
          ); // Taking the first error message for each field
          if (errorMessages.length > 0) {
            detailMessage = errorMessages.join('\n');
          }
        }

        toast.show({
          severity: 'error',
          summary: 'Error',
          detail: detailMessage,
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

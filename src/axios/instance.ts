import axios from "axios";
import type { AxiosError, AxiosHeaders, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import toast from "react-hot-toast";
import { getStoredAppSession } from "../lib/appSession";

// Centralized axios instance with sensible defaults for the app
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "https://api.example.com",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const session = getStoredAppSession();
    if (session?.accessToken) {
      if (config.headers && typeof (config.headers as AxiosHeaders).set === "function") {
        (config.headers as AxiosHeaders).set("Authorization", `Bearer ${session.accessToken}`);
      } else {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${session.accessToken}`,
        } as InternalAxiosRequestConfig["headers"];
      }
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      toast.error("Your session has expired. Please sign in again.");
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;

import axios from "axios";
import { showErrorToast } from "./toast";
import { siteConfig } from "./siteConfig";

const instance = axios.create({
  baseURL: `http://${siteConfig.backUrl}/api`,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

instance.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

instance.interceptors.response.use(
  (response) => {
    const result = response.data as { code: number; message?: string; data?: unknown };
    if (result.code !== 1) {
      const msg = result.message || "Request failed";
      const detail = `${response.config.method?.toUpperCase()} ${response.config.url}  →  code=${result.code}`;
      showErrorToast(msg, detail);
      return Promise.reject(new Error(msg));
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return result.data as any;
  },
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        window.dispatchEvent(new CustomEvent("auth:logout"));
      }
    }
    const status = error.response?.status || "NET";
    const url = error.config?.url || "?";
    const msg = error.response?.data?.message || error.message || "Network error";
    showErrorToast(`[${status}] ${msg}`, `${error.config?.method?.toUpperCase() || ""} ${url}`);
    return Promise.reject(new Error(msg));
  },
);

export default instance;

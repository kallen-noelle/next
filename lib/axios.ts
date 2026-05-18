import axios from "axios";
import type { Result } from "./types";

const instance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE || "/api",
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
    const result = response.data as Result<unknown>;
    if (result.code !== 0) {
      return Promise.reject(new Error(result.message || "Request failed"));
    }
    return result.data as never;
  },
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        window.dispatchEvent(new CustomEvent("auth:logout"));
      }
    }
    const message = error.response?.data?.message || error.message || "Network error";
    return Promise.reject(new Error(message));
  },
);

export default instance;

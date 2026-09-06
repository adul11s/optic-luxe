import axios from "axios";
import type { AxiosError, AxiosRequestConfig } from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export function getApiWithAuth() {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      return axios.create({
        baseURL: API_BASE_URL,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    }
  }
  return api;
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export async function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await api.get(url, config);
  return response.data;
}

export async function post<T>(url: string, data?: Record<string, unknown>): Promise<T> {
  const response = await api.post(url, data);
  return response.data;
}

export async function put<T>(url: string, data?: Record<string, unknown>): Promise<T> {
  const response = await api.put(url, data);
  return response.data;
}

export async function del<T>(url: string): Promise<T> {
  const response = await api.delete(url);
  return response.data;
}

export async function authGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const instance = getApiWithAuth();
  const response = await instance.get(url, config);
  return response.data;
}

export async function authPost<T>(url: string, data?: Record<string, unknown>): Promise<T> {
  const instance = getApiWithAuth();
  const response = await instance.post(url, data);
  return response.data;
}

export async function authPut<T>(url: string, data?: Record<string, unknown>): Promise<T> {
  const instance = getApiWithAuth();
  const response = await instance.put(url, data);
  return response.data;
}

export async function authDelete<T>(url: string): Promise<T> {
  const instance = getApiWithAuth();
  const response = await instance.delete(url);
  return response.data;
}
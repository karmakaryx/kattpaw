import axios from "axios";
import { authManager } from "./auth";

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000",
});

instance.interceptors.request.use((config) => {
  const key = authManager.getKey();
  if (key) {
    config.headers["x-katt-key"] = key;
  }
  return config;
});

export default instance;

import axios from "axios";
// import { BaseURL, getSession } from "@esub/core";
import { BaseURL, ESUB_SESSION_KEY, TOKEN_SESSION_KEY } from "../constants/auth-keys";
import { getSession } from "../session/sessionmanagers";
// import { ESUB_SESSION_KEY, TOKEN_SESSION_KEY } from "@esub/constants";

export const axiosInstance = axios.create({
  baseURL: BaseURL,
  headers: { "Content-Type": "application/json" },
  timeout: 30 * 60 * 1000,
});

axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await getSession(TOKEN_SESSION_KEY);
    const userInfo = (await getSession(ESUB_SESSION_KEY)) as {
      storeName?: string;
    } | null;
    const storeName = userInfo?.storeName;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (storeName) config.headers["store-name"] = storeName;
    return config;
  },
  (error) => Promise.reject(error),
);

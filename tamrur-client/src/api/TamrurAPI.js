// External
import axios from "axios";

/**
 * Base URL for the API server, read from the client's .env file.
 * @type {string}
 */
const API_URL = import.meta.env.VITE_API_URL;

/**
 * Shared axios instance for all API calls.
 * Attaches the auth token (once available) to every outgoing request.
 */
const TamrurAPI = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Request interceptor: attaches the JWT from localStorage, if present.
 */
TamrurAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default TamrurAPI;

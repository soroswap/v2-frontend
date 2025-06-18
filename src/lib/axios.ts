import axios from "axios";

// Create axios instance with default config
export const api = axios.create({
  baseURL: process.env.SOROSWAP_API_URL,
  timeout: 10000, // 10 seconds
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor for authentication
api.interceptors.request.use(
  async (config) => {
    // If the request is not for login, add auth token
    if (!config.url?.includes("/login")) {
      try {
        const loginResponse = await api.post("/login", {
          email: process.env.SOROSWAP_API_EMAIL,
          password: process.env.SOROSWAP_API_PASSWORD,
        });
        config.headers.Authorization = `Bearer ${loginResponse.data.access_token}`;
      } catch (error) {
        console.error("Auth token fetch failed:", error);
        throw error;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle specific error cases
    if (error.response?.status === 401) {
      // Handle unauthorized
      console.error("Unauthorized request");
    }
    return Promise.reject(error);
  },
);

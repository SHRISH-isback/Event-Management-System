import axios from "axios";

// Use environment variable or fallback to production backend
const baseURL = process.env.REACT_APP_API_URL || 
                process.env.NEXT_PUBLIC_API_URL || 
                "https://event-management-system-uruy.onrender.com/api";

const api = axios.create({
  baseURL,
  timeout: 30000, // Increased timeout for Render cold starts
  withCredentials: false, // Set to true if using cookies
});

api.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;

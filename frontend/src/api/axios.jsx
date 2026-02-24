import axios from "axios";

const baseURL = process.env.REACT_APP_API_URL || 
                process.env.NEXT_PUBLIC_API_URL || 
                "https://event-management-system-uruy.onrender.com/api";

const api = axios.create({
  baseURL,
  timeout: 30000,
  withCredentials: false, 
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

    // If the server rejects the token (expired / invalid), clear the session
    // and force the user back to the login page
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      if (window.location.pathname !== "/") {
        window.location.href = "/";
      }
    }

    return Promise.reject(error);
  }
);

export default api;

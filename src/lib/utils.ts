import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

// 1. Cấu hình Axios Client
const apiClient = axios.create({
  baseURL: "http://localhost:3000", // Đổi thành URL server của bạn (Backend hoặc Mock)
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// 2. Tự động gắn Token vào Header (nếu có)
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("accessToken");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// 3. Xử lý dữ liệu trả về và lỗi
apiClient.interceptors.response.use(
  (response) => response.data, // Chỉ lấy data, bỏ qua wrapper của axios
  (error: AxiosError<{ message: string }>) => {
    const message = error.response?.data?.message || error.message || "Có lỗi xảy ra";
    return Promise.reject(new Error(message));
  }
);

// Helper functions
const get = <T>(url: string) => apiClient.get<T, T>(url);
const post = <T>(url: string, data?: unknown) => apiClient.post<T, T>(url, data);

// 4. Định nghĩa các API (Khớp với Postman)
export const api = {
  // --- Auth ---
  login: (email: string, password: string) => {
    return post<{ token: string; user: { role: string } }>("/login", { email, password });
  },
  
  register: (name: string, role: string, email: string, password: string) => {
    return post("/register", { name, role, email, password });
  },

  forgotPassword: (email: string) => {
    return post("/forgot-password", { email });
  },

  // --- Questions ---
  getQuestions: () => {
    return get<any[]>("/questions");
  },

  // [POSTMAN] Create Question: POST /questions
  createQuestion: (data: { title: string; content: string; category: string }) => {
    return post("/questions", data);
  },

  // [POSTMAN] Answer Question: POST /questions/:id/answers
  answerQuestion: (questionId: number, content: string) => {
    return post(`/questions/${questionId}/answers`, { content });
  },
};

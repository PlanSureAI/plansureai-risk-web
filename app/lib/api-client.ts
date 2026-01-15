const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
}

export async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP ${response.status}`,
        details: data.details,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: "Network error",
      details: String(error),
    };
  }
}

export const api = {
  get: <T,>(endpoint: string) => apiCall<T>(endpoint, { method: "GET" }),

  post: <T,>(endpoint: string, body: any) =>
    apiCall<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  put: <T,>(endpoint: string, body: any) =>
    apiCall<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  delete: <T,>(endpoint: string) =>
    apiCall<T>(endpoint, { method: "DELETE" }),
};

export const apiClient = api;

import { User, NewUser, UpdateUser, ApiResponse } from "@/types/user";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const config: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      throw new ApiError(
        response.status,
        errorData.error || `HTTP ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      0,
      `Network error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// ユーザー一覧取得
export async function getUsers(): Promise<User[]> {
  const response = await apiRequest<ApiResponse<User>>("/api/users");
  return response.users || [];
}

// 単一ユーザー取得
export async function getUser(id: number): Promise<User> {
  const response = await apiRequest<ApiResponse<User>>(`/api/users/${id}`);
  if (!response.user) {
    throw new ApiError(404, "User not found");
  }
  return response.user;
}

// ユーザー作成
export async function createUser(userData: NewUser): Promise<User> {
  const response = await apiRequest<ApiResponse<User>>("/api/users", {
    method: "POST",
    body: JSON.stringify(userData),
  });
  if (!response.user) {
    throw new ApiError(500, "Failed to create user");
  }
  return response.user;
}

// ユーザー更新
export async function updateUser(
  id: number,
  userData: UpdateUser
): Promise<User> {
  const response = await apiRequest<ApiResponse<User>>(`/api/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(userData),
  });
  if (!response.user) {
    throw new ApiError(500, "Failed to update user");
  }
  return response.user;
}

// ユーザー削除
export async function deleteUser(id: number): Promise<void> {
  await apiRequest(`/api/users/${id}`, {
    method: "DELETE",
  });
}

export { ApiError };

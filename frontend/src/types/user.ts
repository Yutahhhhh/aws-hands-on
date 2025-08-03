export interface User {
  id: number;
  name: string;
  email: string;
  age: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface NewUser {
  name: string;
  email: string;
  age?: number | null;
}

export interface UpdateUser {
  name?: string;
  email?: string;
  age?: number | null;
}

export interface ApiResponse<T> {
  user?: T;
  users?: T[];
  message?: string;
  error?: string;
}

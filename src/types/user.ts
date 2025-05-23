export type User = {
  id: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
};

export type AuthState = {
  user: User | null;
  loading: boolean;
  error: string | null;
}; 
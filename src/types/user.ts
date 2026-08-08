export type User = {
  id: string;
  email: string;
  name?: string | null;
};

export type AuthState = {
  user: User | null;
  loading: boolean;
  error: string | null;
};

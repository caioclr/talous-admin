export interface ApiError {
  detail?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  plan: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

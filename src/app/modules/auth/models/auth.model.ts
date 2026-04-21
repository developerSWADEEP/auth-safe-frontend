export interface LoginRequest {
  masterPassword: string;
}

export interface LoginResponse {
  token: string;
  expiresAt?: string;
}

export interface MasterPasswordRequest {
  masterPassword: string;
}

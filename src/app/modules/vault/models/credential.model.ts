export interface VaultCredential {
  id: number;
  siteName: string;
  username: string;
  passwordMasked?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CredentialPayload {
  siteName: string;
  username: string;
  password: string;
  notes?: string;
  masterPassword: string;
}

export interface DecryptResponse {
  password: string;
}

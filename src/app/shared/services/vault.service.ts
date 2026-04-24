import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  CredentialPayload,
  DecryptResponse,
  VaultCredential
} from '../../modules/vault/models/credential.model';
import { MasterPasswordRequest } from '../../modules/auth/models/auth.model';

@Injectable({ providedIn: 'root' })
export class VaultService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api';

  public list(): Observable<VaultCredential[]> {
    return this.http.get<VaultCredential[]>(`${this.apiUrl}/vault/list`).pipe(
      map((credentials) =>
        credentials.map((credential) => ({
          ...credential,
          passwordMasked: '******'
        }))
      )
    );
  }

  public add(payload: CredentialPayload): Observable<VaultCredential> {
    return this.http.post<VaultCredential>(`${this.apiUrl}/vault/add`, payload);
  }

  public update(id: number, payload: CredentialPayload): Observable<VaultCredential> {
    return this.http.put<VaultCredential>(
      `${this.apiUrl}/vault/update/${id}`,
      payload
    );
  }

  public delete(id: number, request: MasterPasswordRequest): Observable<void> {
    return this.http.request<void>('DELETE', `${this.apiUrl}/vault/delete/${id}`, {
      body: request
    });
  }

  public decrypt(
    id: number,
    request: MasterPasswordRequest
  ): Observable<DecryptResponse> {
    return this.http.post<DecryptResponse>(
      `${this.apiUrl}/vault/decrypt/${id}`,
      request
    );
  }
}

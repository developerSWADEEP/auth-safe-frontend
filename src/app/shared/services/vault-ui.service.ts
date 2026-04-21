import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class VaultUiService {
  private readonly addCredentialSubject = new Subject<void>();
  public readonly addCredential$ = this.addCredentialSubject.asObservable();

  public openAddCredential(): void {
    this.addCredentialSubject.next();
  }
}

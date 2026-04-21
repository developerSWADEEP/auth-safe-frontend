import { Clipboard } from '@angular/cdk/clipboard';
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil } from 'rxjs';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { VaultService } from '../../../../shared/services/vault.service';
import { CredentialPayload, VaultCredential } from '../../models/credential.model';
import {
  CredentialFormDialogComponent,
  CredentialFormDialogData
} from '../credential-form-dialog/credential-form-dialog.component';
import { MasterPasswordDialogComponent } from '../master-password-dialog/master-password-dialog.component';
import { VaultUiService } from '../../../../shared/services/vault-ui.service';

@Component({
  selector: 'app-credential-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './credential-list.component.html',
  styleUrl: './credential-list.component.css'
})
export class CredentialListComponent implements OnInit, OnDestroy {
  private readonly vaultService = inject(VaultService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly clipboard = inject(Clipboard);
  private readonly vaultUiService = inject(VaultUiService);
  private readonly destroy$ = new Subject<void>();

  protected readonly loading = signal(false);
  protected readonly search = signal('');
  protected readonly credentials = signal<VaultCredential[]>([]);
  protected readonly revealedPasswords = signal<Record<number, string>>({});

  protected readonly displayedColumns = ['siteName', 'username', 'password', 'actions'];
  protected readonly filteredCredentials = computed(() => {
    const term = this.search().trim().toLowerCase();
    if (!term) {
      return this.credentials();
    }

    return this.credentials().filter((credential) =>
      [credential.siteName, credential.username, credential.notes ?? '']
        .join(' ')
        .toLowerCase()
        .includes(term)
    );
  });

  public ngOnInit(): void {
    this.loadCredentials();
    this.vaultUiService.addCredential$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.openAddDialog());
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.clearSensitiveCache();
  }

  protected onSearch(value: string): void {
    this.search.set(value);
  }

  protected openAddDialog(): void {
    const data: CredentialFormDialogData = { mode: 'add' };
    this.dialog
      .open(CredentialFormDialogComponent, { data })
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((payload?: CredentialPayload) => {
        if (!payload) {
          return;
        }
        this.promptMasterPassword((masterPassword) => {
          this.vaultService.add({ ...payload, masterPassword }).subscribe({
            next: () => {
              this.snackBar.open('Credential added.', 'Close', { duration: 2000 });
              this.loadCredentials();
            },
            error: () => this.snackBar.open('Failed to add credential.', 'Close', { duration: 3000 })
          });
        });
      });
  }

  protected requestViewPassword(credential: VaultCredential): void {
    this.promptMasterPassword((masterPassword) => {
      this.vaultService.decrypt(credential.id, { masterPassword }).subscribe({
        next: ({ password }) => this.revealPasswordTemporarily(credential.id, password),
        error: () =>
          this.snackBar.open('Master password validation failed.', 'Close', {
            duration: 3000
          })
      });
    });
  }

  protected requestEdit(credential: VaultCredential): void {
    this.promptMasterPassword((masterPassword) => {
      this.vaultService.decrypt(credential.id, { masterPassword }).subscribe({
        next: ({ password }) => this.openEditDialog(credential, password),
        error: () =>
          this.snackBar.open('Master password validation failed.', 'Close', {
            duration: 3000
          })
      });
    });
  }

  protected requestDelete(credential: VaultCredential): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Delete credential?',
          message: `This will permanently remove ${credential.siteName}.`,
          confirmText: 'Delete'
        }
      })
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((confirmed: boolean) => {
        if (!confirmed) {
          return;
        }
        this.promptMasterPassword((masterPassword) => {
          this.vaultService.decrypt(credential.id, { masterPassword }).subscribe({
            next: () => {
              this.vaultService.delete(credential.id, { masterPassword }).subscribe({
                next: () => {
                  this.snackBar.open('Credential deleted.', 'Close', { duration: 2000 });
                  this.loadCredentials();
                },
                error: () =>
                  this.snackBar.open('Failed to delete credential.', 'Close', {
                    duration: 3000
                  })
              });
            },
            error: () =>
              this.snackBar.open('Master password validation failed.', 'Close', {
                duration: 3000
              })
          });
        });
      });
  }

  protected copyPassword(credentialId: number): void {
    const plainPassword = this.revealedPasswords()[credentialId];
    if (!plainPassword) {
      this.snackBar.open('Reveal the password before copying.', 'Close', { duration: 2500 });
      return;
    }

    this.clipboard.copy(plainPassword);
    this.snackBar.open('Password copied to clipboard.', 'Close', { duration: 1500 });
  }

  protected getPasswordLabel(credentialId: number): string {
    return this.revealedPasswords()[credentialId] ?? '******';
  }

  private loadCredentials(): void {
    this.loading.set(true);
    this.clearSensitiveCache();
    this.vaultService.list().subscribe({
      next: (credentials) => {
        this.loading.set(false);
        this.credentials.set(credentials);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Unable to fetch credentials.', 'Close', { duration: 3000 });
      }
    });
  }

  private openEditDialog(credential: VaultCredential, decryptedPassword: string): void {
    const data: CredentialFormDialogData = {
      mode: 'edit',
      credential,
      decryptedPassword
    };

    this.dialog
      .open(CredentialFormDialogComponent, { data })
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((payload?: CredentialPayload) => {
        if (!payload) {
          return;
        }
        this.promptMasterPassword((masterPassword) => {
          this.vaultService.update(credential.id, { ...payload, masterPassword }).subscribe({
            next: () => {
              this.snackBar.open('Credential updated.', 'Close', { duration: 2000 });
              this.loadCredentials();
            },
            error: () =>
              this.snackBar.open('Unable to update credential.', 'Close', { duration: 3000 })
          });
        });
      });
  }

  private promptMasterPassword(onConfirmed: (masterPassword: string) => void): void {
    this.dialog
      .open(MasterPasswordDialogComponent)
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((masterPassword?: string) => {
        if (masterPassword) {
          onConfirmed(masterPassword);
        }
      });
  }

  private revealPasswordTemporarily(credentialId: number, password: string): void {
    this.revealedPasswords.update((current) => ({ ...current, [credentialId]: password }));
    setTimeout(() => {
      this.revealedPasswords.update((current) => {
        const next = { ...current };
        delete next[credentialId];
        return next;
      });
    }, 8000);
  }

  private clearSensitiveCache(): void {
    this.revealedPasswords.set({});
  }
}

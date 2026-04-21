import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  CredentialPayload,
  VaultCredential
} from '../../models/credential.model';
import { PasswordGeneratorService } from '../../../../shared/services/password-generator.service';

export interface CredentialFormDialogData {
  mode: 'add' | 'edit';
  credential?: VaultCredential;
  decryptedPassword?: string;
}

@Component({
  selector: 'app-credential-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatSnackBarModule
  ],
  templateUrl: './credential-form-dialog.component.html',
  styleUrl: './credential-form-dialog.component.css'
})
export class CredentialFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly generator = inject(PasswordGeneratorService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialogRef = inject(MatDialogRef<CredentialFormDialogComponent>);
  protected readonly data = inject<CredentialFormDialogData>(MAT_DIALOG_DATA);

  protected readonly hidePassword = signal(true);

  protected readonly form = this.fb.group({
    siteName: [this.data.credential?.siteName ?? '', [Validators.required]],
    username: [this.data.credential?.username ?? '', [Validators.required]],
    password: [this.data.decryptedPassword ?? '', [Validators.required, Validators.minLength(8)]],
    notes: [this.data.credential?.notes ?? '']
  });

  protected generatePassword(): void {
    this.form.controls.password.setValue(this.generator.generate(18));
    this.snackBar.open('Strong password generated.', 'Close', { duration: 2000 });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: CredentialPayload = {
      siteName: this.form.controls.siteName.value ?? '',
      username: this.form.controls.username.value ?? '',
      password: this.form.controls.password.value ?? '',
      notes: this.form.controls.notes.value ?? '',
      masterPassword: ''
    };
    this.dialogRef.close(payload);
  }
}

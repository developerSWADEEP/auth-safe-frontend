import { BreakpointObserver } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { map } from 'rxjs';
import { AuthService } from '../../../../shared/services/auth.service';
import { VaultUiService } from '../../../../shared/services/vault-ui.service';
import { CredentialListComponent } from '../../../vault/components/credential-list/credential-list.component';

@Component({
  selector: 'app-dashboard-shell',
  standalone: true,
  imports: [
    CommonModule,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatListModule,
    MatButtonModule,
    CredentialListComponent
  ],
  templateUrl: './dashboard-shell.component.html',
  styleUrl: './dashboard-shell.component.css'
})
export class DashboardShellComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly breakpoints = inject(BreakpointObserver);
  private readonly vaultUiService = inject(VaultUiService);

  protected readonly isMobile = signal(false);
  protected readonly sidenavMode = computed(() =>
    this.isMobile() ? 'over' : ('side' as const)
  );
  protected readonly sidenavOpened = computed(() => !this.isMobile());

  public ngOnInit(): void {
    this.breakpoints
      .observe('(max-width: 960px)')
      .pipe(map((state) => state.matches))
      .subscribe((mobile) => this.isMobile.set(mobile));
  }

  protected navigateHome(): void {
    void this.router.navigate(['/dashboard']);
  }

  protected openAddCredential(): void {
    this.vaultUiService.openAddCredential();
  }

  protected logout(): void {
    this.authService.logout();
  }
}

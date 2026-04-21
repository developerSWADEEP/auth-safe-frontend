import { DOCUMENT } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { Injectable, NgZone, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { fromEvent, merge, Subscription, timer } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class InactivityService implements OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly zone = inject(NgZone);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly inactivityDurationMs = 5 * 60 * 1000;
  private resetEventsSubscription?: Subscription;
  private lockTimerSubscription?: Subscription;

  public startMonitoring(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (this.resetEventsSubscription) {
      return;
    }

    this.zone.runOutsideAngular(() => {
      const resetEvents$ = merge(
        fromEvent(this.document, 'mousemove'),
        fromEvent(this.document, 'keydown'),
        fromEvent(this.document, 'mousedown'),
        fromEvent(this.document, 'touchstart'),
        fromEvent(this.document, 'scroll')
      );

      this.resetEventsSubscription = resetEvents$.subscribe(() =>
        this.resetLockTimer()
      );
    });

    this.resetLockTimer();
  }

  public ngOnDestroy(): void {
    this.resetEventsSubscription?.unsubscribe();
    this.lockTimerSubscription?.unsubscribe();
  }

  private resetLockTimer(): void {
    this.lockTimerSubscription?.unsubscribe();
    this.lockTimerSubscription = timer(this.inactivityDurationMs).subscribe(() => {
      if (this.authService.isAuthenticated()) {
        this.zone.run(() => this.authService.lockSession());
      }
    });
  }
}

import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { InactivityService } from './shared/services/inactivity.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html'
})
export class App implements OnInit {
  private readonly inactivityService = inject(InactivityService);

  public ngOnInit(): void {
    this.inactivityService.startMonitoring();
  }
}

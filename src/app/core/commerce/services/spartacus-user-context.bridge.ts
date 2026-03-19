import { Injectable } from '@angular/core';
import { UserIdService } from '@spartacus/core';
import { Subscription } from 'rxjs';
import { AuthService } from '../../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class SpartacusUserContextBridgeService {
  private subscription?: Subscription;

  constructor(
    private readonly authService: AuthService,
    private readonly userIdService: UserIdService
  ) {}

  init(): void {
    if (this.subscription) {
      return;
    }

    this.subscription = this.authService.session$.subscribe(session => {
      if (session?.username) {
        this.userIdService.setUserId(session.username);
        return;
      }
      this.userIdService.clearUserId();
    });
  }
}

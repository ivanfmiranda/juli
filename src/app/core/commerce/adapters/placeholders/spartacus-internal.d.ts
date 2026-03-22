/**
 * Declarações de tipos para módulos internos do Spartacus
 * que não são exportados no index principal.
 * 
 * Estes módulos são necessários para o UserTransitional_4_2_Module
 * mas não fazem parte do public API do Spartacus.
 */

declare module '@spartacus/core/esm2015/src/user/connectors/notification-preference/user-notification-preference.adapter' {
  import { Observable } from 'rxjs';
  import { NotificationPreference } from '@spartacus/core';
  
  export abstract class UserNotificationPreferenceAdapter {
    abstract loadAll(userId: string): Observable<NotificationPreference[]>;
    abstract update(userId: string, preferences: NotificationPreference[]): Observable<{}>;
  }
}

declare module '@spartacus/core/esm2015/src/user/connectors/notification-preference/user-notification-preference.connector' {
  import { Observable } from 'rxjs';
  import { NotificationPreference } from '@spartacus/core';
  import { UserNotificationPreferenceAdapter } from '@spartacus/core/esm2015/src/user/connectors/notification-preference/user-notification-preference.adapter';
  
  export class UserNotificationPreferenceConnector {
    protected adapter: UserNotificationPreferenceAdapter;
    loadAll(userId: string): Observable<NotificationPreference[]>;
    update(userId: string, preferences: NotificationPreference[]): Observable<{}>;
  }
}

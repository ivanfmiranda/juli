/**
 * SmartEdit Bridge Service — Angular side (Juli Storefront)
 *
 * Escuta mensagens PostMessage do CMS Editor (parent) e emite eventos
 * para os componentes da storefront reagirem em modo SmartEdit.
 */
import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

// Mirror SE_MSG constants (avoid cross-project import)
const SE_MSG = {
  READY: 'SMARTEDIT_READY',
  PAGE_DATA: 'SMARTEDIT_PAGE_DATA',
  SELECT: 'SMARTEDIT_SELECT',
  UPDATE: 'SMARTEDIT_UPDATE',
  HIGHLIGHT: 'SMARTEDIT_HIGHLIGHT',
  COMPONENT_CLICK: 'SMARTEDIT_COMPONENT_CLICK',
  ADD_COMPONENT: 'SMARTEDIT_ADD_COMPONENT',
  REMOVE_COMPONENT: 'SMARTEDIT_REMOVE_COMPONENT',
  REORDER: 'SMARTEDIT_REORDER',
} as const;

const SMARTEDIT_PREFIX = 'SMARTEDIT_';

export interface SmartEditSelection {
  slotName: string;
  componentIndex: number;
}

export interface SmartEditUpdate {
  slotName: string;
  componentIndex: number;
  component: Record<string, unknown>;
}

@Injectable({ providedIn: 'root' })
export class SmartEditBridgeService implements OnDestroy {
  /** Whether SmartEdit mode is currently active */
  private readonly activeSubject = new BehaviorSubject<boolean>(false);
  readonly isActive$ = this.activeSubject.asObservable();

  /** Currently selected component */
  private readonly selectionSubject = new BehaviorSubject<SmartEditSelection | null>(null);
  readonly selection$ = this.selectionSubject.asObservable();

  /** Currently highlighted (hovered) component */
  private readonly highlightSubject = new BehaviorSubject<SmartEditSelection | null>(null);
  readonly highlight$ = this.highlightSubject.asObservable();

  /** Component update stream */
  private readonly updateSubject = new Subject<SmartEditUpdate>();
  readonly update$ = this.updateSubject.asObservable();

  /** Full page data received from CMS */
  private readonly pageDataSubject = new Subject<unknown>();
  readonly pageData$ = this.pageDataSubject.asObservable();

  private messageHandler: ((event: MessageEvent) => void) | null = null;

  constructor(private readonly ngZone: NgZone) {}

  /** Activate SmartEdit mode and start listening for messages */
  activate(): void {
    if (this.activeSubject.value) return;
    this.activeSubject.next(true);

    this.messageHandler = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return;
      const msg = event.data as { type?: string; payload?: unknown };
      if (typeof msg.type !== 'string' || !msg.type.startsWith(SMARTEDIT_PREFIX)) return;

      this.ngZone.run(() => this.handleMessage(msg.type!, msg.payload));
    };

    window.addEventListener('message', this.messageHandler);

    // Notify parent we're ready
    this.postToParent(SE_MSG.READY, { version: 1 });
  }

  /** Deactivate SmartEdit mode */
  deactivate(): void {
    this.activeSubject.next(false);
    if (this.messageHandler) {
      window.removeEventListener('message', this.messageHandler);
      this.messageHandler = null;
    }
  }

  ngOnDestroy(): void {
    this.deactivate();
  }

  get isActive(): boolean {
    return this.activeSubject.value;
  }

  /** Send component click event to parent CMS editor */
  notifyComponentClick(slotName: string, componentIndex: number, componentType: string): void {
    this.postToParent(SE_MSG.COMPONENT_CLICK, { slotName, componentIndex, componentType });
  }

  private handleMessage(type: string, payload: unknown): void {
    const data = payload as Record<string, unknown>;

    switch (type) {
      case SE_MSG.PAGE_DATA:
        this.pageDataSubject.next(data['page']);
        break;

      case SE_MSG.SELECT:
        this.selectionSubject.next({
          slotName: data['slotName'] as string,
          componentIndex: data['componentIndex'] as number,
        });
        break;

      case SE_MSG.HIGHLIGHT:
        if (data['slotName'] === null) {
          this.highlightSubject.next(null);
        } else {
          this.highlightSubject.next({
            slotName: data['slotName'] as string,
            componentIndex: data['componentIndex'] as number,
          });
        }
        break;

      case SE_MSG.UPDATE:
        this.updateSubject.next({
          slotName: data['slotName'] as string,
          componentIndex: data['componentIndex'] as number,
          component: data['component'] as Record<string, unknown>,
        });
        break;
    }
  }

  private postToParent(type: string, payload: unknown): void {
    if (typeof window === 'undefined') return;
    try {
      window.parent.postMessage({ type, payload }, '*');
    } catch {
      // noop — not in iframe
    }
  }
}

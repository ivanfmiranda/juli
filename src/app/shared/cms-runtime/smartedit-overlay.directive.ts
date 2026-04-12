/**
 * SmartEdit Overlay Directive
 *
 * Adiciona overlays visuais em componentes CMS quando o modo SmartEdit está ativo.
 * Mostra borda azul pontilhada no hover e borda sólida quando selecionado.
 * Click no componente notifica o CMS editor parent.
 */
import {
  Directive,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  Renderer2,
} from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, combineLatest as combineLatestWith } from 'rxjs/operators';
import { SmartEditBridgeService } from '../../core/cms/services/smartedit-bridge.service';

@Directive({
  selector: '[appSmartEditOverlay]',
})
export class SmartEditOverlayDirective implements OnInit, OnDestroy {
  @Input('appSmartEditOverlay') componentType = '';
  @Input() seSlotName = '';
  @Input() seComponentIndex = 0;

  private readonly destroy$ = new Subject<void>();
  private labelEl: HTMLElement | null = null;
  private unlisten: (() => void)[] = [];

  constructor(
    private readonly el: ElementRef<HTMLElement>,
    private readonly renderer: Renderer2,
    private readonly bridge: SmartEditBridgeService,
  ) {}

  ngOnInit(): void {
    // Only do anything if SmartEdit is active
    this.bridge.isActive$.pipe(
      takeUntil(this.destroy$),
    ).subscribe(active => {
      if (active) {
        this.enableOverlay();
      } else {
        this.disableOverlay();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.disableOverlay();
  }

  private enableOverlay(): void {
    const host = this.el.nativeElement;
    this.renderer.addClass(host, 'se-overlay');
    this.renderer.setStyle(host, 'position', 'relative');

    // Create type label badge
    this.labelEl = this.renderer.createElement('span');
    this.renderer.addClass(this.labelEl, 'se-overlay__label');
    const text = this.renderer.createText(this.componentType || 'Component');
    this.renderer.appendChild(this.labelEl, text);
    this.renderer.appendChild(host, this.labelEl);

    // Mouse events
    const onEnter = this.renderer.listen(host, 'mouseenter', () => {
      this.renderer.addClass(host, 'se-overlay--hover');
    });
    const onLeave = this.renderer.listen(host, 'mouseleave', () => {
      this.renderer.removeClass(host, 'se-overlay--hover');
    });
    const onClick = this.renderer.listen(host, 'click', (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      this.bridge.notifyComponentClick(this.seSlotName, this.seComponentIndex, this.componentType);
    });
    this.unlisten.push(onEnter, onLeave, onClick);

    // Subscribe to selection changes
    this.bridge.selection$.pipe(
      takeUntil(this.destroy$),
    ).subscribe(sel => {
      if (sel && sel.slotName === this.seSlotName && sel.componentIndex === this.seComponentIndex) {
        this.renderer.addClass(host, 'se-overlay--selected');
      } else {
        this.renderer.removeClass(host, 'se-overlay--selected');
      }
    });

    // Subscribe to highlight changes
    this.bridge.highlight$.pipe(
      takeUntil(this.destroy$),
    ).subscribe(hl => {
      if (hl && hl.slotName === this.seSlotName && hl.componentIndex === this.seComponentIndex) {
        this.renderer.addClass(host, 'se-overlay--highlight');
      } else {
        this.renderer.removeClass(host, 'se-overlay--highlight');
      }
    });
  }

  private disableOverlay(): void {
    const host = this.el.nativeElement;
    this.renderer.removeClass(host, 'se-overlay');
    this.renderer.removeClass(host, 'se-overlay--hover');
    this.renderer.removeClass(host, 'se-overlay--selected');
    this.renderer.removeClass(host, 'se-overlay--highlight');
    this.renderer.removeStyle(host, 'position');

    if (this.labelEl) {
      this.renderer.removeChild(host, this.labelEl);
      this.labelEl = null;
    }

    this.unlisten.forEach(fn => fn());
    this.unlisten = [];
  }
}

/**
 * Fallback Components Tests
 * 
 * Testa os componentes de fallback individuais.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { UnknownComponent } from '../unknown-component.component';
import { ErrorComponent } from '../error-component.component';
import { EmptyStateComponent } from '../empty-state.component';
import { LoadingStateRenderer } from '../loading-state.component';
import { NotFoundPageComponent } from '../not-found-page.component';

describe('UnknownComponent', () => {
  let component: UnknownComponent;
  let fixture: ComponentFixture<UnknownComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UnknownComponent]
    });
    fixture = TestBed.createComponent(UnknownComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display typeCode when provided', () => {
    component.typeCode = 'UnknownWidget';
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('UnknownWidget');
  });

  it('should show default message when typeCode is N/A', () => {
    component.typeCode = 'N/A';
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Componente Não Mapeado');
  });

  it('should have correct CSS classes', () => {
    fixture.detectChanges();
    
    const element = fixture.debugElement.query(By.css('.juli-fallback.unknown'));
    expect(element).toBeTruthy();
  });
});

describe('ErrorComponent', () => {
  let component: ErrorComponent;
  let fixture: ComponentFixture<ErrorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ErrorComponent]
    });
    fixture = TestBed.createComponent(ErrorComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display typeCode when provided', () => {
    component.typeCode = 'HeroBanner';
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('HeroBanner');
  });

  it('should display error message when provided', () => {
    component.errorMessage = 'Connection timeout';
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Connection timeout');
  });

  it('should show retry button when showRetry is true', () => {
    component.showRetry = true;
    fixture.detectChanges();
    
    const button = fixture.debugElement.query(By.css('.juli-retry-btn'));
    expect(button).toBeTruthy();
  });

  it('should not show retry button by default', () => {
    fixture.detectChanges();
    
    const button = fixture.debugElement.query(By.css('.juli-retry-btn'));
    expect(button).toBeFalsy();
  });

  it('should call retryHandler when retry button clicked', () => {
    const spy = jasmine.createSpy('retryHandler');
    component.retryHandler = spy;
    component.showRetry = true;
    fixture.detectChanges();
    
    const button = fixture.debugElement.query(By.css('.juli-retry-btn'));
    button.nativeElement.click();
    
    expect(spy).toHaveBeenCalled();
  });

  it('should reload page when retry clicked without handler', () => {
    spyOn(window.location, 'reload');
    component.showRetry = true;
    fixture.detectChanges();
    
    const button = fixture.debugElement.query(By.css('.juli-retry-btn'));
    button.nativeElement.click();
    
    expect(window.location.reload).toHaveBeenCalled();
  });
});

describe('EmptyStateComponent', () => {
  let component: EmptyStateComponent;
  let fixture: ComponentFixture<EmptyStateComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EmptyStateComponent]
    });
    fixture = TestBed.createComponent(EmptyStateComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display slotName when provided', () => {
    component.slotName = 'Section1';
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Section1');
  });

  it('should display contentType when provided', () => {
    component.contentType = 'HeroBanner';
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('HeroBanner');
  });

  it('should have correct CSS classes', () => {
    fixture.detectChanges();
    
    const element = fixture.debugElement.query(By.css('.juli-fallback.empty'));
    expect(element).toBeTruthy();
  });
});

describe('LoadingStateRenderer', () => {
  let component: LoadingStateRenderer;
  let fixture: ComponentFixture<LoadingStateRenderer>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [LoadingStateRenderer]
    });
    fixture = TestBed.createComponent(LoadingStateRenderer);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display default loading text', () => {
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Carregando conteúdo');
  });

  it('should display custom loading text when provided', () => {
    component.loadingText = 'Loading products...';
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Loading products');
  });

  it('should hide text when showText is false', () => {
    component.showText = false;
    fixture.detectChanges();
    
    const text = fixture.debugElement.query(By.css('.juli-loading-text'));
    expect(text).toBeFalsy();
  });

  it('should show minimal view when minimal is true', () => {
    component.minimal = true;
    fixture.detectChanges();
    
    const element = fixture.debugElement.query(By.css('.minimal'));
    expect(element).toBeTruthy();
  });

  it('should show spinner by default', () => {
    fixture.detectChanges();
    
    const spinner = fixture.debugElement.query(By.css('.juli-spinner'));
    expect(spinner).toBeTruthy();
  });

  it('should show pulse in minimal mode', () => {
    component.minimal = true;
    fixture.detectChanges();
    
    const pulse = fixture.debugElement.query(By.css('.juli-pulse'));
    expect(pulse).toBeTruthy();
  });
});

describe('NotFoundPageComponent', () => {
  let component: NotFoundPageComponent;
  let fixture: ComponentFixture<NotFoundPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [NotFoundPageComponent]
    });
    fixture = TestBed.createComponent(NotFoundPageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display 404 code', () => {
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('404');
  });

  it('should display not found message', () => {
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Página Não Encontrada');
  });

  it('should have link to home', () => {
    fixture.detectChanges();
    
    const homeLink = fixture.debugElement.query(By.css('a[routerLink="/"]'));
    expect(homeLink).toBeTruthy();
  });

  it('should have go back button', () => {
    fixture.detectChanges();
    
    const button = fixture.debugElement.query(By.css('button'));
    expect(button).toBeTruthy();
    expect(button.nativeElement.textContent).toContain('Voltar');
  });

  it('should call goBack when back button clicked', () => {
    spyOn(window.history, 'back');
    fixture.detectChanges();
    
    const button = fixture.debugElement.query(By.css('button'));
    button.nativeElement.click();
    
    expect(window.history.back).toHaveBeenCalled();
  });
});

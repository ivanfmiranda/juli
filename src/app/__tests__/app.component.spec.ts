import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { AppComponent } from '../app.component';
import { AuthService } from '../core/auth/auth.service';
import { JuliCartFacade } from '../core/commerce';

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let component: AppComponent;
  let authService: jasmine.SpyObj<AuthService>;
  let cartFacade: jasmine.SpyObj<JuliCartFacade>;

  beforeEach(async () => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['logout'], {
      session$: of(null)
    });
    cartFacade = jasmine.createSpyObj<JuliCartFacade>('JuliCartFacade', ['clear'], {
      itemCount$: of(0)
    });

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, RouterTestingModule],
      declarations: [AppComponent],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: JuliCartFacade, useValue: cartFacade }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
  });

  it('logs out without clearing the authenticated cart remotely', () => {
    component.logout();

    expect(authService.logout).toHaveBeenCalled();
    expect(cartFacade.clear).not.toHaveBeenCalled();
  });
});

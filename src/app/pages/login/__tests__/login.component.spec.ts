import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { JuliCartFacade } from '../../../core/commerce';
import { LoginComponent } from '../login.component';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let authService: jasmine.SpyObj<AuthService>;
  let cartFacade: jasmine.SpyObj<JuliCartFacade>;
  let router: Router;

  beforeEach(async () => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['login', 'hasAnonymousCart']);
    cartFacade = jasmine.createSpyObj<JuliCartFacade>('JuliCartFacade', ['promoteAnonymousCart', 'discardAnonymousCart']);

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, RouterTestingModule],
      declarations: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: JuliCartFacade, useValue: cartFacade }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);

    spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true));
    authService.login.and.returnValue(of({
      accessToken: 'token',
      tokenType: 'Bearer',
      expiresIn: 3600,
      username: 'demo',
      roles: []
    }));
    authService.hasAnonymousCart.and.returnValue(false);
    cartFacade.promoteAnonymousCart.and.returnValue(of({
      cart: { code: 'cart-1' } as any,
      mergeOccurred: false,
      cartChanged: true,
      warnings: []
    }));
  });

  it('promotes an anonymous cart after a successful login', () => {
    authService.hasAnonymousCart.and.returnValue(true);
    component.form.setValue({ username: 'demo', password: 'secret' });

    component.submit();

    expect(authService.login).toHaveBeenCalledWith('demo', 'secret');
    expect(cartFacade.promoteAnonymousCart).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('falls back gracefully when anonymous cart promotion fails', () => {
    authService.hasAnonymousCart.and.returnValue(true);
    cartFacade.promoteAnonymousCart.and.returnValue(
      throwError(new Error('promotion failed'))
    );
    component.form.setValue({ username: 'demo', password: 'secret' });

    component.submit();

    expect(cartFacade.discardAnonymousCart).toHaveBeenCalled();
    expect(component.warningMessage).toContain('Login concluído');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });
});

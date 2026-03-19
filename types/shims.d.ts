declare function describe(name: string, spec: () => void): void;
declare function it(name: string, spec: (done?: () => void) => void): void;
declare function beforeEach(spec: () => void): void;
declare function afterEach(spec: () => void): void;
declare function expect(actual: any): any;

declare module '@angular/core' {
  export const Injectable: any;
  export const Component: any;
  export const NgModule: any;
  export const ChangeDetectionStrategy: { OnPush: any };
  export const Input: any;
  export const Optional: any;
  export const Inject: any;
  export function isDevMode(): boolean;
  export type ModuleWithProviders<T> = any;
}

declare module '@angular/common' {
  export const CommonModule: any;
}

declare module '@angular/router' {
  export const RouterModule: any;
}

declare module '@angular/common/http' {
  export class HttpClient {
    get<T>(url: string): any;
  }
}

declare module '@angular/core/testing' {
  export const TestBed: any;
}

declare module '@angular/common/http/testing' {
  export const HttpClientTestingModule: any;
  export class HttpTestingController {
    expectOne(match: any): any;
    verify(): void;
  }
}

declare module '@spartacus/core' {
  export interface PageContext {
    id?: string;
    type?: any;
  }
  export interface Page {
    label?: string;
    title?: string;
    type?: any;
    template?: string;
    slots?: any;
  }
  export const PageType: {
    CONTENT_PAGE: any;
    PRODUCT_PAGE: any;
  };
  export abstract class CmsAdapter {
    abstract load(pageContext: PageContext): any;
    abstract loadComponent(id: string, pageContext: PageContext): any;
  }
  export const ConfigModule: {
    withConfig(config: any): any;
  };
  export class ProductService {
    get(code: string): any;
  }
  export interface Product {
    code?: string;
    name?: string;
    summary?: string;
    images?: any;
    price?: any;
  }
}

declare module '@spartacus/storefront' {
  export class CmsComponentData<T> {
    data$: import('rxjs').Observable<T>;
  }
}

declare module 'rxjs' {
  export class Observable<T = any> {
    pipe(...args: any[]): any;
    subscribe(...args: any[]): any;
  }
  export function of<T = any>(...args: T[]): Observable<T>;
}

declare module 'rxjs/operators' {
  export function map(project: any): any;
  export function catchError(project: any): any;
  export function switchMap(project: any): any;
}

import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  BaseSiteService,
  ConverterService,
  OccConfig,
  OccEndpointsService,
  OccUserAddressAdapter,
  OccUserConsentAdapter,
  OccUserPaymentAdapter,
} from '@spartacus/core';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';

describe('JULI OCC compatibility smoke', () => {
  const baseUrl = 'https://mock-hybris.local';
  const baseSite = 'electronics';

  let http: HttpClient;
  let httpMock: HttpTestingController;
  let occEndpoints: OccEndpointsService;
  let converter: ConverterService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);

    const occConfig: OccConfig = {
      backend: {
        occ: {
          baseUrl,
          prefix: '/occ/v2',
          endpoints: {
            addresses: 'users/${userId}/addresses',
            addressDetail: 'users/${userId}/addresses/${addressId}',
            addressVerification: 'users/${userId}/addresses/verification',
            consentTemplates: 'users/${userId}/consenttemplates',
            consents: 'users/${userId}/consents',
            consentDetail: 'users/${userId}/consents/${consentId}',
            paymentDetailsAll: 'users/${userId}/paymentdetails',
            paymentDetail: 'users/${userId}/paymentdetails/${paymentDetailId}',
          },
        },
      },
      context: {
        baseSite: [baseSite],
      },
    };

    const baseSiteService = {
      getActive: () => of(baseSite),
    } as Partial<BaseSiteService> as BaseSiteService;

    occEndpoints = new OccEndpointsService(occConfig, baseSiteService);
    converter = {
      convert: <T>(value: T) => value,
      pipeable: () => map((value: unknown) => value),
      pipeableMany: () => map((value: unknown) => value),
    } as Partial<ConverterService> as ConverterService;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('calls OCC address endpoints with Hybris URL shape', () => {
    const adapter = new OccUserAddressAdapter(http, occEndpoints, converter);
    const address = {
      firstName: 'Ada',
      lastName: 'Lovelace',
      line1: '42 Infinite Loop',
      town: 'London',
      postalCode: '12345',
      country: { isocode: 'GB' },
    };

    let loadedAddresses: any[] | undefined;
    let validation: any;

    adapter.loadAll('current').subscribe(result => (loadedAddresses = result));
    const loadReq = httpMock.expectOne(
      `${baseUrl}/occ/v2/${baseSite}/users/current/addresses`
    );
    expect(loadReq.request.method).toBe('GET');
    loadReq.flush({
      addresses: [
        {
          id: 'addr-1',
          firstName: 'Ada',
          lastName: 'Lovelace',
        },
      ],
    });
    expect(loadedAddresses?.length).toBe(1);
    expect(loadedAddresses?.[0].id).toBe('addr-1');

    adapter.add('current', address as any).subscribe();
    const addReq = httpMock.expectOne(
      `${baseUrl}/occ/v2/${baseSite}/users/current/addresses`
    );
    expect(addReq.request.method).toBe('POST');
    expect(addReq.request.body.firstName).toBe('Ada');
    addReq.flush({});

    adapter.update('current', 'addr-1', address as any).subscribe();
    const updateReq = httpMock.expectOne(
      `${baseUrl}/occ/v2/${baseSite}/users/current/addresses/addr-1`
    );
    expect(updateReq.request.method).toBe('PATCH');
    expect(updateReq.request.body.lastName).toBe('Lovelace');
    updateReq.flush({});

    adapter.verify('anonymous', address as any).subscribe(result => (validation = result));
    const verifyReq = httpMock.expectOne(
      `${baseUrl}/occ/v2/${baseSite}/users/anonymous/addresses/verification`
    );
    expect(verifyReq.request.method).toBe('POST');
    expect(verifyReq.request.headers.get('cx-use-client-token')).toBe('true');
    verifyReq.flush({ decision: 'ACCEPT', suggestedAddresses: [] });
    expect(validation.decision).toBe('ACCEPT');

    adapter.delete('current', 'addr-1').subscribe();
    const deleteReq = httpMock.expectOne(
      `${baseUrl}/occ/v2/${baseSite}/users/current/addresses/addr-1`
    );
    expect(deleteReq.request.method).toBe('DELETE');
    deleteReq.flush({});
  });

  it('calls OCC consent endpoints with Hybris URL shape', () => {
    const adapter = new OccUserConsentAdapter(http, occEndpoints, converter);

    let loadedConsents: any[] | undefined;
    let givenConsent: any;

    adapter.loadConsents('current').subscribe(result => (loadedConsents = result));
    const loadReq = httpMock.expectOne(
      `${baseUrl}/occ/v2/${baseSite}/users/current/consenttemplates`
    );
    expect(loadReq.request.method).toBe('GET');
    loadReq.flush({
      consentTemplates: [
        {
          id: 'MARKETING',
          version: 1,
          currentConsent: { code: 'consent-1' },
        },
      ],
    });
    expect(loadedConsents?.[0].id).toBe('MARKETING');

    adapter.giveConsent('current', 'MARKETING', 1).subscribe(result => (givenConsent = result));
    const giveReq = httpMock.expectOne(
      `${baseUrl}/occ/v2/${baseSite}/users/current/consents`
    );
    expect(giveReq.request.method).toBe('POST');
    expect(giveReq.request.headers.get('Content-Type')).toBe(
      'application/x-www-form-urlencoded'
    );
    expect(giveReq.request.body.toString()).toContain('consentTemplateId=MARKETING');
    expect(giveReq.request.body.toString()).toContain('consentTemplateVersion=1');
    giveReq.flush({
      id: 'MARKETING',
      version: 1,
      currentConsent: { code: 'consent-2' },
    });
    expect(givenConsent.id).toBe('MARKETING');

    adapter.withdrawConsent('current', 'consent-2').subscribe();
    const withdrawReq = httpMock.expectOne(
      `${baseUrl}/occ/v2/${baseSite}/users/current/consents/consent-2`
    );
    expect(withdrawReq.request.method).toBe('DELETE');
    withdrawReq.flush({});
  });

  it('calls OCC payment endpoints with Hybris URL shape', () => {
    const adapter = new OccUserPaymentAdapter(http, occEndpoints, converter);

    let payments: any[] | undefined;

    adapter.loadAll('current').subscribe(result => (payments = result));
    const loadReq = httpMock.expectOne(
      `${baseUrl}/occ/v2/${baseSite}/users/current/paymentdetails?saved=true`
    );
    expect(loadReq.request.method).toBe('GET');
    loadReq.flush({
      payments: [
        {
          id: 'pay-1',
          defaultPayment: true,
        },
      ],
    });
    expect(payments?.[0].id).toBe('pay-1');

    adapter.setDefault('current', 'pay-1').subscribe();
    const defaultReq = httpMock.expectOne(
      `${baseUrl}/occ/v2/${baseSite}/users/current/paymentdetails/pay-1`
    );
    expect(defaultReq.request.method).toBe('PATCH');
    expect(defaultReq.request.body.defaultPayment).toBeTrue();
    defaultReq.flush({});

    adapter.delete('current', 'pay-1').subscribe();
    const deleteReq = httpMock.expectOne(
      `${baseUrl}/occ/v2/${baseSite}/users/current/paymentdetails/pay-1`
    );
    expect(deleteReq.request.method).toBe('DELETE');
    deleteReq.flush({});
  });
});

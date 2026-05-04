import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';

/**
 * Looks up Brazilian addresses by CEP (postal code) via ViaCEP — public,
 * unauthenticated, no key required (~50 req/s rate). Falls back to {@code
 * null} on any error (offline, malformed CEP, CEP not found) so callers
 * keep the manual entry path open without UX disruption.
 *
 * <p>Results cached in-memory for the session — same CEP queried again
 * is instant, and we don't pile traffic on ViaCEP if the user retypes.
 */
export interface CepInfo {
  cep: string;
  street: string;       // logradouro
  complement: string;   // complemento (rare, often blank)
  neighborhood: string; // bairro
  city: string;         // localidade
  state: string;        // uf
  country: 'BR';
}

@Injectable({ providedIn: 'root' })
export class CepLookupService {
  private readonly cache = new Map<string, Observable<CepInfo | null>>();

  constructor(private readonly http: HttpClient) {}

  lookup(cep: string): Observable<CepInfo | null> {
    const digits = (cep ?? '').replace(/\D/g, '');
    if (digits.length !== 8) return of(null);
    if (this.cache.has(digits)) return this.cache.get(digits)!;
    const req = this.http
      .get<ViaCepResponse>(`https://viacep.com.br/ws/${digits}/json/`)
      .pipe(
        map(r => {
          // ViaCEP retorna {erro: true} pra CEPs inexistentes; tratar como null
          if (!r || (r as { erro?: boolean }).erro) return null;
          return {
            cep: digits,
            street: r.logradouro ?? '',
            complement: r.complemento ?? '',
            neighborhood: r.bairro ?? '',
            city: r.localidade ?? '',
            state: r.uf ?? '',
            country: 'BR' as const,
          };
        }),
        catchError(() => of(null)),
        shareReplay(1),
      );
    this.cache.set(digits, req);
    return req;
  }
}

interface ViaCepResponse {
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
}

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { JuliCategoryPage } from '../models/ubris-commerce.models';
import { UbrisCategoryConnector } from '../connectors/category.connector';

@Injectable({ providedIn: 'root' })
export class UbrisCategoryFacade {
  constructor(private readonly connector: UbrisCategoryConnector) {}

  get(code: string, page: number = 0, size: number = 12): Observable<JuliCategoryPage> {
    return this.connector.get(code, page, size);
  }
}
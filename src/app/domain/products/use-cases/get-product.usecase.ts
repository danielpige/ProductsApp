import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Product, ProductId } from '../entities/product.entity';
import { ProductRepository } from '../ports/product.repository';
import { PRODUCT_REPOSITORY } from '../../../tokens/products.tokens';

@Injectable({ providedIn: 'root' })
export class GetProductUseCase {
  private readonly repo: ProductRepository = inject(PRODUCT_REPOSITORY);
  execute(id: ProductId): Observable<Product> {
    return this.repo.getById(id);
  }
}

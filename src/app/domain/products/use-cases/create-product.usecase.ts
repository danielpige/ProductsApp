import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Product } from '../entities/product.entity';
import { ProductRepository } from '../ports/product.repository';
import { PRODUCT_REPOSITORY } from '../../../tokens/products.tokens';

@Injectable({ providedIn: 'root' })
export class CreateProductUseCase {
  private readonly repo: ProductRepository = inject(PRODUCT_REPOSITORY);
  execute(product: Product): Observable<Product> {
    return this.repo.create(product);
  }
}

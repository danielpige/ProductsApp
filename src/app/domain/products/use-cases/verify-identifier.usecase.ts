import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ProductId } from '../entities/product.entity';
import { ProductRepository } from '../ports/product.repository';
import { PRODUCT_REPOSITORY } from '../../../tokens/products.tokens';

@Injectable({ providedIn: 'root' })
export class VerifyIdentifierUseCase {
  private readonly repo: ProductRepository = inject(PRODUCT_REPOSITORY);

  execute(id: ProductId): Observable<boolean> {
    return this.repo.verifyIdentifier(id);
  }
}

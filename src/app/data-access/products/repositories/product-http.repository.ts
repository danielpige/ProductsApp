import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ProductRepository } from '../../../domain/products/ports/product.repository';
import { Product, ProductId } from '../../../domain/products/entities/product.entity';
import { HttpService } from '../../../core/http/http.service';
import { ApiGetAllResponse, ApiMutationResponse, ApiProduct } from '../dto/product.dto';
import { ProductMapper } from '../mappers/product.mapper';

@Injectable()
export class ProductHttpRepository implements ProductRepository {
  private readonly basePath = '/products';

  private readonly http = inject(HttpService);

  getAll(): Observable<Product[]> {
    return this.http
      .get<ApiGetAllResponse>(this.basePath)
      .pipe(map((r) => r.data.map(ProductMapper.toDomain)));
  }

  verifyIdentifier(id: ProductId): Observable<boolean> {
    return this.http.get<boolean>(`${this.basePath}/verification/${encodeURIComponent(id)}`);
  }

  getById(id: ProductId): Observable<Product> {
    return this.http
      .get<ApiProduct>(`${this.basePath}/${encodeURIComponent(id)}`)
      .pipe(map(ProductMapper.toDomain));
  }

  create(product: Product): Observable<Product> {
    const payload = ProductMapper.toApi(product);
    return this.http
      .post<ApiMutationResponse>(this.basePath, payload)
      .pipe(map((r) => ProductMapper.toDomain(r.data)));
  }

  update(product: Product): Observable<Product> {
    const payload = ProductMapper.toApi(product);
    return this.http
      .put<ApiMutationResponse>(`${this.basePath}/${encodeURIComponent(product.id)}`, payload)
      .pipe(map((r) => ProductMapper.toDomain(r.data)));
  }

  remove(id: ProductId): Observable<void> {
    return this.http
      .delete<void>(`${this.basePath}/${encodeURIComponent(id)}`)
      .pipe(map(() => void 0));
  }
}

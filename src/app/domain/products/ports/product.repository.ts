import { Observable } from 'rxjs';
import { Product, ProductId } from '../entities/product.entity';

export interface ProductRepository {
  getAll(): Observable<Product[]>;
  getById(id: ProductId): Observable<Product>;
  verifyIdentifier(id: ProductId): Observable<boolean>;
  create(product: Product): Observable<Product>;
  update(product: Product): Observable<Product>;
  remove(id: ProductId): Observable<void>;
}

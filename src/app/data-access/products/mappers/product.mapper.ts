import { ApiProduct } from '../dto/product.dto';
import { Product } from '../../../domain/products/entities/product.entity';

export class ProductMapper {
  static toDomain(api: ApiProduct): Product {
    return {
      id: api.id,
      name: api.name,
      description: api.description,
      logo: api.logo,
      dateRelease: new Date(api.date_release),
      dateRevision: new Date(api.date_revision),
    };
  }

  static toApi(domain: Product): ApiProduct {
    return {
      id: domain.id,
      name: domain.name,
      description: domain.description,
      logo: domain.logo,
      date_release: domain.dateRelease.toISOString(),
      date_revision: domain.dateRevision.toISOString(),
    };
  }
}

import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';

import { ProductHttpRepository } from './product-http.repository';
import { HttpService } from '../../../core/http/http.service';
import { ProductMapper } from '../mappers/product.mapper';

import { Product } from '../../../domain/products/entities/product.entity';
import { ApiGetAllResponse, ApiMutationResponse, ApiProduct } from '../dto/product.dto';

describe('ProductHttpRepository (Jest)', () => {
  let repo: ProductHttpRepository;

  let http: {
    get: jest.Mock;
    post: jest.Mock;
    put: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(() => {
    http = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [ProductHttpRepository, { provide: HttpService, useValue: http }],
    });

    repo = TestBed.inject(ProductHttpRepository);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('getAll(): debe llamar GET /products y mapear r.data[] a dominio', async () => {
    const apiProducts: ApiProduct[] = [
      {
        id: 'P-1',
        name: 'A',
        description: 'DA',
        logo: 'https://a',
        date_release: '2026-01-01',
        date_revision: '2027-01-01',
      } as any,
      {
        id: 'P-2',
        name: 'B',
        description: 'DB',
        logo: 'https://b',
        date_release: '2026-02-01',
        date_revision: '2027-02-01',
      } as any,
    ];

    const resp: ApiGetAllResponse = { data: apiProducts } as any;

    const d1: Product = {
      id: 'P-1',
      name: 'A',
      description: 'DA',
      logo: 'https://a',
      dateRelease: new Date('2026-01-01'),
      dateRevision: new Date('2027-01-01'),
    } as any;

    const d2: Product = {
      id: 'P-2',
      name: 'B',
      description: 'DB',
      logo: 'https://b',
      dateRelease: new Date('2026-02-01'),
      dateRevision: new Date('2027-02-01'),
    } as any;

    const toDomainSpy = jest
      .spyOn(ProductMapper, 'toDomain')
      .mockImplementationOnce(() => d1)
      .mockImplementationOnce(() => d2);

    http.get.mockReturnValue(of(resp));

    const list = await firstValueFrom(repo.getAll());

    expect(http.get).toHaveBeenCalledWith('/products');
    expect(toDomainSpy).toHaveBeenCalledTimes(2);

    // Array.map pasa (value, index, array). Validamos al menos el primer arg (el objeto)
    expect(toDomainSpy.mock.calls[0][0]).toBe(apiProducts[0]);
    expect(toDomainSpy.mock.calls[1][0]).toBe(apiProducts[1]);

    expect(list).toEqual([d1, d2]);
  });

  it('verifyIdentifier(): debe llamar GET /products/verification/:id (url-encoded) y retornar boolean', async () => {
    http.get.mockReturnValue(of(true));

    const id = 'A B/ñ?';
    const encoded = encodeURIComponent(id);

    const v = await firstValueFrom(repo.verifyIdentifier(id as any));

    expect(http.get).toHaveBeenCalledWith(`/products/verification/${encoded}`);
    expect(v).toBe(true);
  });

  it('getById(): debe llamar GET /products/:id (url-encoded) y mapear a dominio', async () => {
    const id = 'P/ 01';
    const encoded = encodeURIComponent(id);

    const api: ApiProduct = {
      id: 'P-01',
      name: 'Prod',
      description: 'Desc',
      logo: 'https://x',
      date_release: '2026-01-01',
      date_revision: '2027-01-01',
    } as any;

    const domain: Product = {
      id: 'P-01',
      name: 'Prod',
      description: 'Desc',
      logo: 'https://x',
      dateRelease: new Date('2026-01-01'),
      dateRevision: new Date('2027-01-01'),
    } as any;

    const toDomainSpy = jest.spyOn(ProductMapper, 'toDomain').mockReturnValue(domain);
    http.get.mockReturnValue(of(api));

    const p = await firstValueFrom(repo.getById(id as any));

    expect(http.get).toHaveBeenCalledWith(`/products/${encoded}`);

    // rxjs map pasa (value, index). Validamos al menos el primer arg.
    expect(toDomainSpy).toHaveBeenCalledTimes(1);
    expect(toDomainSpy.mock.calls[0][0]).toBe(api);

    expect(p).toEqual(domain);
  });

  it('create(): debe mapear a API, llamar POST /products y mapear respuesta a dominio', async () => {
    const input: Product = {
      id: 'NEW-1',
      name: 'N',
      description: 'D',
      logo: 'https://l',
      dateRelease: new Date('2026-01-01'),
      dateRevision: new Date('2027-01-01'),
    } as any;

    const payload = { any: 'payload' };
    const createdApiProduct: ApiProduct = {
      id: 'NEW-1',
      name: 'N',
      description: 'D',
      logo: 'https://l',
      date_release: '2026-01-01',
      date_revision: '2027-01-01',
    } as any;

    const resp: ApiMutationResponse = { data: createdApiProduct } as any;

    const mappedDomain: Product = { ...input } as any;

    const toApiSpy = jest.spyOn(ProductMapper, 'toApi').mockReturnValue(payload as any);
    const toDomainSpy = jest.spyOn(ProductMapper, 'toDomain').mockReturnValue(mappedDomain);

    http.post.mockReturnValue(of(resp));

    const p = await firstValueFrom(repo.create(input));

    expect(toApiSpy).toHaveBeenCalledWith(input);
    expect(http.post).toHaveBeenCalledWith('/products', payload);
    expect(toDomainSpy).toHaveBeenCalledWith(createdApiProduct);
    expect(p).toEqual(mappedDomain);
  });

  it('update(): debe mapear a API, llamar PUT /products/:id (url-encoded) y mapear respuesta a dominio', async () => {
    const input: Product = {
      id: 'UPD/ 1',
      name: 'U',
      description: 'D',
      logo: 'https://l',
      dateRelease: new Date('2026-02-01'),
      dateRevision: new Date('2027-02-01'),
    } as any;

    const encoded = encodeURIComponent(input.id);

    const payload = { any: 'payload' };
    const updatedApiProduct: ApiProduct = {
      id: input.id,
      name: 'U',
      description: 'D',
      logo: 'https://l',
      date_release: '2026-02-01',
      date_revision: '2027-02-01',
    } as any;

    const resp: ApiMutationResponse = { data: updatedApiProduct } as any;

    const mappedDomain: Product = { ...input } as any;

    const toApiSpy = jest.spyOn(ProductMapper, 'toApi').mockReturnValue(payload as any);
    const toDomainSpy = jest.spyOn(ProductMapper, 'toDomain').mockReturnValue(mappedDomain);

    http.put.mockReturnValue(of(resp));

    const p = await firstValueFrom(repo.update(input));

    expect(toApiSpy).toHaveBeenCalledWith(input);
    expect(http.put).toHaveBeenCalledWith(`/products/${encoded}`, payload);
    expect(toDomainSpy).toHaveBeenCalledWith(updatedApiProduct);
    expect(p).toEqual(mappedDomain);
  });

  it('remove(): debe llamar DELETE /products/:id (url-encoded) y retornar void 0', async () => {
    http.delete.mockReturnValue(of({})); // el repo lo ignora y mapea a void 0

    const id = 'DEL/ 1';
    const encoded = encodeURIComponent(id);

    const v = await firstValueFrom(repo.remove(id as any));

    expect(http.delete).toHaveBeenCalledWith(`/products/${encoded}`);
    expect(v).toBeUndefined();
  });
});

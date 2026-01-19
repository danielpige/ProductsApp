import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

import { Product } from '../../../../domain/products/entities/product.entity';
import { GetProductsUseCase } from '../../../../domain/products/use-cases/get-products.usecase';
import { DeleteProductUseCase } from '../../../../domain/products/use-cases/delete-product.usecase';
import { ToastService } from '../../../../core/ui/toast/toast.service';
import { ProductListVm } from './product-list-view/product-list-view';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss',
  // eslint-disable-next-line @angular-eslint/prefer-standalone
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductList implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  private readonly getProducts = inject(GetProductsUseCase);
  private readonly deleteProduct = inject(DeleteProductUseCase);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  // Estado “de negocio” / data
  readonly loading = signal<boolean>(true);
  readonly products = signal<Product[]>([]);
  readonly query = signal<string>('');

  // Delete flow (UI + negocio)
  readonly confirmOpen = signal(false);
  readonly deleting = signal(false);
  readonly pendingDeleteId = signal<string | null>(null);
  readonly pendingDeleteName = signal<string>('');

  // Paging
  readonly pageSize = signal<number>(10);
  readonly page = signal<number>(1);

  private readonly normalizedQuery = computed(() => this.query().trim().toLowerCase());

  private readonly filtered = computed(() => {
    const all = this.products();
    const q = this.normalizedQuery();
    if (!q) return all;

    return all.filter((p) => `${p.id} ${p.name} ${p.description}`.toLowerCase().includes(q));
  });

  private readonly total = computed(() => this.filtered().length);

  private readonly totalPages = computed(() => {
    const size = this.pageSize();
    const total = this.total();
    return Math.max(1, Math.ceil(total / size));
  });

  private readonly currentPage = computed(() => Math.min(this.page(), this.totalPages()));

  private readonly pagedProducts = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.filtered().slice(start, end);
  });

  private readonly from = computed(() => {
    const total = this.total();
    if (total === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  private readonly to = computed(() =>
    Math.min(this.from() + this.pagedProducts().length - 1, this.total()),
  );

  // VM “puro” para la vista (sin set() dentro)
  readonly vm = computed<ProductListVm>(() => ({
    loading: this.loading(),
    query: this.query(),

    total: this.total(),
    products: this.pagedProducts(),

    pageSize: this.pageSize(),
    currentPage: this.currentPage(),
    totalPages: this.totalPages(),

    from: this.from(),
    to: this.to(),
  }));

  constructor() {
    effect(
      () => {
        const tp = this.totalPages();
        const p = this.page();
        if (p > tp) this.page.set(tp);
        if (p < 1) this.page.set(1);
      },
      { allowSignalWrites: true },
    );
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);

    this.getProducts
      .execute()
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (products) => this.products.set(products),
        error: () => {
          this.toast.show('error', 'No se pudieron cargar los productos');
          this.products.set([]);
        },
      });
  }

  // Eventos desde la vista (dumb)
  onCreate(): void {
    this.router.navigate(['/products/new']);
  }

  onSearch(value: string): void {
    this.query.set(value);
    this.page.set(1);
  }

  onPageSizeChange(n: number): void {
    if (![5, 10, 20].includes(n)) return;
    this.pageSize.set(n);
    this.page.set(1);
  }

  prevPage(): void {
    this.page.update((p) => Math.max(1, p - 1));
  }

  nextPage(): void {
    this.page.update((p) => Math.min(this.totalPages(), p + 1));
  }

  onEdit(id: string): void {
    this.router.navigate(['/products', id, 'edit']);
  }

  onDelete(id: string): void {
    const p = this.products().find((x) => x.id === id);
    this.pendingDeleteId.set(id);
    this.pendingDeleteName.set(p?.name ?? id);
    this.confirmOpen.set(true);
  }

  closeConfirm(): void {
    this.confirmOpen.set(false);
    this.pendingDeleteId.set(null);
    this.pendingDeleteName.set('');
    this.deleting.set(false);
  }

  confirmDelete(): void {
    const id = this.pendingDeleteId();
    if (!id) return;

    this.deleting.set(true);

    this.deleteProduct
      .execute(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.show('success', 'Producto eliminado');
          this.products.update((items) => items.filter((p) => p.id !== id));
          this.closeConfirm();
        },
        error: () => {
          this.deleting.set(false);
          this.toast.show('error', 'No se pudo eliminar el producto');
        },
      });
  }
}

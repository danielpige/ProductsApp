import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  signal,
} from '@angular/core';
import { Product } from '../../../../../domain/products/entities/product.entity';

export interface ProductListVm {
  loading: boolean;
  query: string;

  total: number;
  products: Product[];

  pageSize: number;
  currentPage: number;
  totalPages: number;

  from: number;
  to: number;
}

@Component({
  selector: 'app-product-list-view',
  templateUrl: './product-list-view.html',
  styleUrl: './product-list-view.scss',
  // eslint-disable-next-line @angular-eslint/prefer-standalone
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductListView {
  @Input({ required: true }) vm!: ProductListVm;

  @Input() confirmOpen = false;
  @Input() pendingDeleteName = '';
  @Input() deleting = false;

  @Output() create = new EventEmitter<void>();
  @Output() searchO = new EventEmitter<string>();

  @Output() pageSizeChange = new EventEmitter<number>();
  @Output() prevPage = new EventEmitter<void>();
  @Output() nextPage = new EventEmitter<void>();

  @Output() edit = new EventEmitter<string>();
  @Output() delete = new EventEmitter<string>();

  @Output() confirmDelete = new EventEmitter<void>();
  @Output() cancelConfirm = new EventEmitter<void>();

  readonly openMenuForId = signal<string | null>(null);

  toggleMenu(id: string): void {
    this.openMenuForId.update((current) => (current === id ? null : id));
  }

  onSearchInput(value: string): void {
    this.searchO.emit(value);
  }

  onPageSizeSelect(value: string): void {
    const n = Number(value);
    this.pageSizeChange.emit(n);
  }
}

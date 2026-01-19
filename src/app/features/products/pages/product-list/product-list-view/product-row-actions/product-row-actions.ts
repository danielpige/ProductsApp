import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
  signal,
} from '@angular/core';

@Component({
  selector: 'app-product-row-actions',
  templateUrl: './product-row-actions.html',
  styleUrl: './product-row-actions.scss',
  // eslint-disable-next-line @angular-eslint/prefer-standalone
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductRowActions {
  @Input({ required: true }) productId!: string;

  @Output() edit = new EventEmitter<string>();
  @Output() remove = new EventEmitter<string>();

  readonly open = signal(false);

  toggle(ev: Event): void {
    this.stop(ev);
    this.open.update((v) => !v);
  }

  close(): void {
    this.open.set(false);
  }

  onEdit(ev: Event): void {
    this.stop(ev);
    this.close();
    this.edit.emit(this.productId);
  }

  onRemove(ev: Event): void {
    this.stop(ev);
    this.close();
    this.remove.emit(this.productId);
  }

  stop(ev: Event): void {
    ev.stopPropagation();
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.close();
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.close();
  }
}

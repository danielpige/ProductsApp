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
  selector: 'app-confirm-modal',
  templateUrl: './confirm-modal.component.html',
  styleUrl: './confirm-modal.component.scss',
  // eslint-disable-next-line @angular-eslint/prefer-standalone
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmModalComponent {
  @Input({ required: true }) open = false;
  @Input() title = 'Confirmar';
  @Input() message = '¿Estás seguro?';
  @Input() confirmText = 'Confirmar';
  @Input() cancelText = 'Cancelar';
  @Input() danger = false;
  @Input() busy = false;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancelO = new EventEmitter<void>();

  private readonly confirming = signal(false);

  onConfirmClick(): void {
    if (this.busy || this.confirming()) return;
    this.confirming.set(true);
    this.confirm.emit();
  }

  onCancelClick(): void {
    if (this.busy) return;
    this.confirming.set(false);
    this.cancelO.emit();
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (!this.open) return;
    this.onCancelClick();
  }

  onBackdropClick(): void {
    this.onCancelClick();
  }

  stop(ev: MouseEvent): void {
    ev.stopPropagation();
  }
}

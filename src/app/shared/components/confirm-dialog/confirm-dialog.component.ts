import { Component, input, output } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [NgClass],
  templateUrl: './confirm-dialog.component.html',
})
export class ConfirmDialogComponent {
  title = input<string>('Confirm Action');
  message = input<string>('Are you sure you want to proceed?');
  confirmText = input<string>('Confirm');
  cancelText = input<string>('Cancel');
  type = input<'danger' | 'info' | 'warning'>('info');

  confirmed = output<void>();
  cancelled = output<void>();

  onConfirm() {
    this.confirmed.emit();
  }

  onCancel() {
    this.cancelled.emit();
  }
}

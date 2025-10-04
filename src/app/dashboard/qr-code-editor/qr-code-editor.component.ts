import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef} from '@angular/material/dialog';
import {MatIcon} from '@angular/material/icon';
import {NgForOf, NgIf, NgStyle} from '@angular/common';
import {MatButton, MatIconButton} from '@angular/material/button';
import {ShortUrl} from '../../shared/models/short-url.model';

@Component({
  selector: 'qr-code-generator',
  standalone: true,
  imports: [
    MatIcon,
    MatDialogActions,
    MatDialogContent,
    NgStyle,
    NgIf,
    MatButton,
    NgForOf,
    MatIconButton

  ],
  templateUrl: 'qr-code-editor.component.html',
  styleUrls: ['qr-code-editor.component.scss'],
})
export class QrCodeGeneratorComponent {
  shortUrl: ShortUrl = {} as ShortUrl;
  qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${this.shortUrl}`;

  tabs = ['Colors', 'Logo', 'Frame', 'Advanced'];
  activeTab = 'Colors';
  colorMode: 'single' | 'gradient' = 'single';
  selectedColor = '#000000';

  colorPresets = [
    { value: '#000000' },
    { value: '#ff4d4d' },
    { value: '#ff914d' },
    { value: '#4dff91' },
    { value: '#4d91ff' },
    { value: '#7f4dff' },
    { value: '#c44dff' },
  ];

  constructor(private dialogRef: MatDialogRef<QrCodeGeneratorComponent>,
              @Inject(MAT_DIALOG_DATA) public data: ShortUrl) {

    this.shortUrl = this.data

  }

  setTab(tab: string) {
    this.activeTab = tab;
  }

  setColor(color: string) {
    this.selectedColor = color;
  }

  refresh() {
    this.qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${this.shortUrl}&color=${encodeURIComponent(
      this.selectedColor
    )}&t=${Date.now()}`;
  }

  download() {
    const link = document.createElement('a');
    link.href = this.qrCodeUrl;
    link.download = 'qr-code.png';
    link.click();
  }

  openColorPicker() {
    alert('Color picker functionality can be added later.');
  }

  closeDialog() {
    this.dialogRef.close();
  }
}

import { Component, Inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { NgForOf, NgIf, NgStyle, TitleCasePipe } from '@angular/common';
import { MatButton, MatIconButton } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import * as QRCode from 'qrcode';
import { ShortUrl } from '../../shared/models/short-url.model';

const directions = ['diagonal', 'horizontal', 'vertical', 'radial'] as const;
type Direction = typeof directions[number];

interface LogoOption {
  name: string;
  src: string | null;
}

type FrameOption = 'None' | 'Basic' | 'Rounded' | 'Bold' | 'Minimal';

@Component({
  selector: 'qr-code-generator',
  standalone: true,
  imports: [
    MatIcon,
    MatDialogActions,
    MatDialogContent,
    NgIf,
    MatButton,
    MatIconButton,
    TitleCasePipe,
    FormsModule,
    NgStyle,
    NgForOf
  ],
  templateUrl: 'qr-code-editor.component.html',
  styleUrls: ['qr-code-editor.component.scss']
})
export class QrCodeGeneratorComponent implements AfterViewInit {
  @ViewChild('qrCanvas') qrCanvas!: ElementRef<HTMLCanvasElement>;

  shortUrl: ShortUrl = {} as ShortUrl;

  tabs = ['Colors', 'Logo', 'Frame'];
  activeTab = 'Colors';

  colorMode: 'single' | 'gradient' = 'single';
  selectedColor = '#000000';

  startColor = '#4F46E5';
  endColor = '#EC4899';

  directions = directions;
  gradientDirection: Direction = 'diagonal';

  colorPresets = [
    { value: '#000000' },
    { value: '#ff4d4d' },
    { value: '#ff914d' },
    { value: '#4dff91' },
    { value: '#4d91ff' },
    { value: '#7f4dff' },
    { value: '#c44dff' }
  ];

  logos: LogoOption[] = [
    { name: 'YouTube', src: 'assets/logos/youtube.png' },
    { name: 'Facebook', src: 'assets/logos/facebook.png' },
    { name: 'LinkedIn', src: 'assets/logos/linkedin.png' },
    { name: 'Instagram', src: 'assets/logos/instagram.png' },
    { name: 'Telegram', src: 'assets/logos/telegram.png' },
    { name: 'TikTok', src: 'assets/logos/tiktok.png' },
    { name: 'X', src: 'assets/logos/x.png' },
    { name: 'GitHub', src: 'assets/logos/github.png' },
    { name: 'Text', src: null },
    { name: 'None', src: null }
  ];

  selectedLogo: LogoOption = this.logos[this.logos.length - 1]; // Default: None

  // Frame options
  frames: FrameOption[] = ['None', 'Basic', 'Rounded', 'Bold', 'Minimal'];
  selectedFrame: FrameOption = 'None';

  constructor(
    private dialogRef: MatDialogRef<QrCodeGeneratorComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ShortUrl
  ) {
    this.shortUrl = data;
  }

  async ngAfterViewInit() {
    await this.renderQrCode();
  }

  setTab(tab: string) {
    this.activeTab = tab;
  }

  async setColor(color: string) {
    this.selectedColor = color;
    await this.renderQrCode();
  }

  async setGradientDirection(dir: Direction) {
    this.gradientDirection = dir;
    await this.renderQrCode();
  }

  async setStartColor(color: string) {
    this.startColor = color;
    await this.renderQrCode();
  }

  async setEndColor(color: string) {
    this.endColor = color;
    await this.renderQrCode();
  }

  async selectLogo(logo: LogoOption) {
    this.selectedLogo = logo;
    await this.renderQrCode();
  }

  async selectFrame(frame: FrameOption) {
    this.selectedFrame = frame;
    await this.renderQrCode();
  }

  download() {
    const canvas = this.qrCanvas.nativeElement;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `qr-code-${this.shortUrl.shortCode}.png`;
    link.click();
  }

  openColorPicker() {
    alert('Color picker functionality can be added later.');
  }

  closeDialog() {
    this.dialogRef.close();
  }

  async renderQrCode() {
    if (!this.qrCanvas) return;
    const canvas = this.qrCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 300;
    canvas.width = size;
    canvas.height = size;

    try {
      // Generate QR code as temporary canvas
      const tempCanvas = document.createElement('canvas');
      await QRCode.toCanvas(tempCanvas, this.shortUrl.originalUrl, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: size,
        color: { dark: '#000000', light: '#0000' }
      });

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw QR code first
      ctx.drawImage(tempCanvas, 0, 0, size, size);

      // Apply color / gradient
      ctx.globalCompositeOperation = 'source-in';
      let fillStyle: string | CanvasGradient;
      if (this.colorMode === 'single') {
        fillStyle = this.selectedColor;
      } else {
        let gradient: CanvasGradient;
        switch (this.gradientDirection) {
          case 'horizontal':
            gradient = ctx.createLinearGradient(0, 0, size, 0);
            break;
          case 'vertical':
            gradient = ctx.createLinearGradient(0, 0, 0, size);
            break;
          case 'diagonal':
            gradient = ctx.createLinearGradient(0, 0, size, size);
            break;
          case 'radial':
            gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
            break;
          default:
            gradient = ctx.createLinearGradient(0, 0, size, size);
        }
        gradient.addColorStop(0, this.startColor);
        gradient.addColorStop(1, this.endColor);
        fillStyle = gradient;
      }
      ctx.fillStyle = fillStyle;
      ctx.fillRect(0, 0, size, size);
      ctx.globalCompositeOperation = 'source-over';

      // Draw selected logo
      if (this.selectedLogo && this.selectedLogo.src) {
        const logo = new Image();
        logo.src = this.selectedLogo.src;
        logo.onload = () => {
          const logoSize = size * 0.2;
          const x = (size - logoSize) / 2;
          const y = (size - logoSize) / 2;
          ctx.drawImage(logo, x, y, logoSize, logoSize);
        };
      } else if (this.selectedLogo.name === 'Text') {
        ctx.fillStyle = '#000';
        ctx.font = 'bold 20px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('LOGO', size / 2, size / 2);
      }

      // Draw frame with subtle glow/shadow
      const framePadding = 8;
      const frameSize = size - framePadding * 2;

      // Configure stroke style
      ctx.lineWidth = 4;

      // Glow effect
      ctx.shadowColor = 'rgba(79, 70, 229, 0.4)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Use same fill style as QR for frame
      if (typeof fillStyle === 'string') {
        ctx.strokeStyle = fillStyle;
      } else {
        const frameGradient = ctx.createLinearGradient(framePadding, framePadding, size - framePadding, size - framePadding);
        frameGradient.addColorStop(0, this.colorMode === 'gradient' ? this.startColor : this.selectedColor);
        frameGradient.addColorStop(1, this.colorMode === 'gradient' ? this.endColor : this.selectedColor);
        ctx.strokeStyle = frameGradient;
      }

      switch (this.selectedFrame) {
        case 'Basic':
          ctx.strokeRect(framePadding, framePadding, frameSize, frameSize);
          break;
        case 'Rounded':
          const radius = 20;
          ctx.beginPath();
          ctx.moveTo(framePadding + radius, framePadding);
          ctx.lineTo(framePadding + frameSize - radius, framePadding);
          ctx.quadraticCurveTo(framePadding + frameSize, framePadding, framePadding + frameSize, framePadding + radius);
          ctx.lineTo(framePadding + frameSize, framePadding + frameSize - radius);
          ctx.quadraticCurveTo(framePadding + frameSize, framePadding + frameSize, framePadding + frameSize - radius, framePadding + frameSize);
          ctx.lineTo(framePadding + radius, framePadding + frameSize);
          ctx.quadraticCurveTo(framePadding, framePadding + frameSize, framePadding, framePadding + frameSize - radius);
          ctx.lineTo(framePadding, framePadding + radius);
          ctx.quadraticCurveTo(framePadding, framePadding, framePadding + radius, framePadding);
          ctx.closePath();
          ctx.stroke();
          break;
        case 'Bold':
          ctx.lineWidth = 8;
          ctx.strokeRect(framePadding, framePadding, frameSize, frameSize);
          break;
        case 'Minimal':
          ctx.lineWidth = 2;
          ctx.setLineDash([10, 6]);
          ctx.strokeRect(framePadding, framePadding, frameSize, frameSize);
          ctx.setLineDash([]);
          break;
        case 'None':
        default:
          break;
      }

      // Reset shadow to avoid affecting QR/logo
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

    } catch (error) {
      console.error('QR code generation failed:', error);
    }
  }


}

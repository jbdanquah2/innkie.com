import { Component, EventEmitter, Input, OnInit, Output, ViewChild, ElementRef, AfterViewInit, inject } from '@angular/core';
import { NgForOf, NgIf, NgStyle, TitleCasePipe, NgSwitch, NgSwitchCase, NgSwitchDefault } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as QRCode from 'qrcode';
import { ShortUrl, QrConfig, QrTemplate } from '@innkie/shared-models';
import { AuthService } from '../../shared/services/auth.service';
import { ShortUrlService } from '../../shared/services/short-url.service';
import { QrStudioService } from '../../shared/services/qr-studio.service';
import { Timestamp } from '@angular/fire/firestore';
import { environment } from '../../../environments/environment';
import { ToastService } from '../../shared/services/toast.service';

const directions = ['diagonal', 'horizontal', 'vertical', 'radial'] as const;
type Direction = typeof directions[number];

interface LogoOption {
  name: string;
  src: string | null;
}

type FrameOption = 'None' | 'Basic' | 'Rounded' | 'Bold' | 'Minimal';

export type QrContentType = 'URL' | 'vCard' | 'WiFi' | 'SMS';

@Component({
  selector: 'qr-code-generator',
  standalone: true,
  imports: [
    NgIf,
    FormsModule,
    NgStyle,
    NgForOf,
    NgSwitch,
    NgSwitchCase,
    NgSwitchDefault
  ],
  templateUrl: 'qr-code-editor.component.html',
  styleUrls: ['qr-code-editor.component.scss']
})
export class QrCodeGeneratorComponent implements AfterViewInit, OnInit {
  @ViewChild('qrCanvas') qrCanvas!: ElementRef<HTMLCanvasElement>;
  @Input() shortUrl: ShortUrl = {} as ShortUrl;
  @Output() closed = new EventEmitter<void>();

  private authService = inject(AuthService);
  private shortUrlService = inject(ShortUrlService);
  private qrStudioService = inject(QrStudioService);
  private toast = inject(ToastService);

  apiUrl = environment.appUrl;

  // Content Types
  contentType: QrContentType = 'URL';
  vCard = { name: '', phone: '', email: '', org: '', note: '' };
  wifi = { ssid: '', password: '', encryption: 'WPA' };
  sms = { phone: '', message: '' };

  // Templates
  userTemplates: QrTemplate[] = [];
  templateName: string = '';

  tabs = ['Content', 'Colors', 'Logo', 'Frame', 'Templates'];
  activeTab = 'Content';

  colorMode: 'single' | 'gradient' = 'single';
  selectedColor = '#4F46E5';

  startColor = '#4F46E5';
  endColor = '#EC4899';

  directions = directions;
  gradientDirection: Direction = 'diagonal';

  colorPresets = [
    { value: '#000000' },
    { value: '#4F46E5' },
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

  constructor() {
  }

  async ngOnInit() {
    await this.loadTemplates();
  }

  async loadTemplates() {
    try {
      this.userTemplates = await this.qrStudioService.getTemplates();
    } catch (e) {
      console.error('Failed to load workspace templates');
    }
  }

  async ngAfterViewInit() {
    await this.renderQrCode();
  }

  setTab(tab: string) {
    this.activeTab = tab;
  }

  getContentString(): string {
    switch (this.contentType) {
      case 'vCard':
        return `BEGIN:VCARD\nVERSION:3.0\nFN:${this.vCard.name}\nTEL:${this.vCard.phone}\nEMAIL:${this.vCard.email}\nORG:${this.vCard.org}\nNOTE:${this.vCard.note}\nEND:VCARD`;
      case 'WiFi':
        return `WIFI:S:${this.wifi.ssid};T:${this.wifi.encryption};P:${this.wifi.password};;`;
      case 'SMS':
        return `SMSTO:${this.sms.phone}:${this.sms.message}`;
      default:
        return this.shortUrl.originalUrl;
    }
  }

  async saveAsTemplate() {
    if (!this.authService.currentUser?.uid) {
      this.toast.warn('Please login to save templates');
      return;
    }
    if (!this.templateName) {
      this.toast.warn('Please enter a template name');
      return;
    }

    const config: QrConfig = {
      colorMode: this.colorMode,
      selectedColor: this.selectedColor,
      startColor: this.startColor,
      endColor: this.endColor,
      gradientDirection: this.gradientDirection,
      logoName: this.selectedLogo.name,
      logoSrc: this.selectedLogo.src,
      frameName: this.selectedFrame
    };

    const template: QrTemplate = {
      id: Math.random().toString(36).substring(7),
      name: this.templateName,
      config,
      createdAt: Timestamp.now()
    };

    await this.shortUrlService.saveQrTemplate(this.authService.currentUser.uid, template);
    this.userTemplates.push(template);
    this.templateName = '';
    this.toast.success('Template saved successfully');
  }

  async applyTemplate(template: QrTemplate) {
    const { config } = template;
    this.colorMode = config.colorMode;
    this.selectedColor = config.selectedColor || '#4F46E5';
    this.startColor = config.startColor || '#4F46E5';
    this.endColor = config.endColor || '#EC4899';
    this.gradientDirection = (config.gradientDirection as Direction) || 'diagonal';
    this.selectedFrame = (config.frameName as FrameOption) || 'None';
    
    this.selectedLogo = this.logos.find(l => l.name === config.logoName) || this.logos[this.logos.length - 1];

    await this.renderQrCode();
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

  closeDialog() {
    this.closed.emit();
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
      const content = this.getContentString();
      // Generate QR code as temporary canvas
      const tempCanvas = document.createElement('canvas');
      await QRCode.toCanvas(tempCanvas, content, {
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

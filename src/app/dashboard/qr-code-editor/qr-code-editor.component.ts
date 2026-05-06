import { Component, EventEmitter, Input, OnInit, Output, ViewChild, ElementRef, AfterViewInit, inject, PLATFORM_ID } from '@angular/core';
import { NgForOf, NgIf, NgStyle, TitleCasePipe, NgSwitch, NgSwitchCase, NgSwitchDefault, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import QRCodeStyling, { 
  Options, 
  DotType, 
  CornerSquareType, 
  CornerDotType 
} from 'qr-code-styling';
import { ShortUrl, QrConfig, QrTemplate, QrGradient } from '@innkie/shared-models';
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
  @ViewChild('qrCanvas', { static: false }) qrCanvas!: ElementRef<HTMLDivElement>;
  @Input() shortUrl: ShortUrl = {} as ShortUrl;
  @Output() closed = new EventEmitter<void>();

  private authService = inject(AuthService);
  private shortUrlService = inject(ShortUrlService);
  private qrStudioService = inject(QrStudioService);
  private toast = inject(ToastService);
  private platformId = inject(PLATFORM_ID);

  private qrCode?: QRCodeStyling;

  apiUrl = environment.appUrl;

  // Content Types
  contentType: QrContentType = 'URL';
  vCard = { name: '', phone: '', email: '', org: '', note: '' };
  wifi = { ssid: '', password: '', encryption: 'WPA' };
  sms = { phone: '', message: '' };

  // Templates
  userTemplates: QrTemplate[] = [];
  templateName: string = '';

  tabs = ['Content', 'Shapes', 'Colors', 'Logo', 'Background', 'Templates'];
  activeTab = 'Content';

  // Config State (Premium)
  dotsType: DotType = 'rounded';
  cornersSquareType: CornerSquareType = 'extra-rounded';
  cornersDotType: CornerDotType = 'dot';
  
  colorMode: 'single' | 'gradient' = 'single';
  selectedColor = '#4F46E5';
  startColor = '#4F46E5';
  endColor = '#EC4899';
  gradientDirection: Direction = 'diagonal';
  
  backgroundColor = '#ffffff';
  
  logos: LogoOption[] = [
    { name: 'X', src: 'assets/logos/x.png' },
    { name: 'YouTube', src: 'assets/logos/youtube.png' },
    { name: 'Facebook', src: 'assets/logos/facebook.png' },
    { name: 'Instagram', src: 'assets/logos/instagram.png' },
    { name: 'GitHub', src: 'assets/logos/github.png' },
    { name: 'None', src: null }
  ];

  selectedLogo: LogoOption = this.logos[this.logos.length - 1];
  logoSize = 0.4;
  logoMargin = 5;
  hideBackgroundDots = true;

  // Options for UI
  dotTypes: DotType[] = ['rounded', 'dots', 'classy', 'classy-rounded', 'square', 'extra-rounded'];
  cornerSquareTypes: CornerSquareType[] = ['dot', 'square', 'extra-rounded'];
  cornerDotTypes: CornerDotType[] = ['dot', 'square'];

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

  directions = directions;

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
    if (isPlatformBrowser(this.platformId)) {
      await this.renderQrCode();
    }
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

  async applyTemplate(template: QrTemplate) {
    const c = template.config;
    
    this.dotsType = c.dotsOptions?.type || 'rounded';
    this.cornersSquareType = c.cornersSquareOptions?.type || 'extra-rounded';
    this.cornersDotType = c.cornersDotOptions?.type || 'dot';

    if (c.dotsOptions?.gradient) {
      this.colorMode = 'gradient';
      this.startColor = c.dotsOptions.gradient.colorStops[0].color;
      this.endColor = c.dotsOptions.gradient.colorStops[1].color;
    } else {
      this.colorMode = 'single';
      this.selectedColor = c.dotsOptions?.color || c.selectedColor || '#4F46E5';
    }

    this.backgroundColor = c.backgroundOptions?.color || '#ffffff';
    this.selectedLogo = this.logos.find(l => l.name === c.logoName) || this.logos[this.logos.length - 1];
    this.logoSize = c.imageOptions?.imageSize || 0.4;
    this.logoMargin = c.imageOptions?.margin || 5;
    this.hideBackgroundDots = c.imageOptions?.hideBackgroundDots ?? true;

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

  download() {
    if (!this.qrCode) return;
    this.qrCode.download({ name: `qr-code-${this.shortUrl.shortCode}`, extension: 'png' });
  }

  closeDialog() {
    this.closed.emit();
  }

  private getCurrentConfig(): QrConfig {
    const dotsGradient: QrGradient | undefined = this.colorMode === 'gradient' ? {
      type: 'linear',
      rotation: this.gradientDirection === 'vertical' ? 1.57 : (this.gradientDirection === 'horizontal' ? 0 : 0.78),
      colorStops: [{ offset: 0, color: this.startColor }, { offset: 1, color: this.endColor }]
    } : undefined;

    return {
      dotsOptions: {
        type: this.dotsType,
        color: this.colorMode === 'single' ? this.selectedColor : undefined,
        gradient: dotsGradient
      },
      cornersSquareOptions: {
        type: this.cornersSquareType,
        color: this.colorMode === 'single' ? this.selectedColor : undefined,
        gradient: dotsGradient
      },
      cornersDotOptions: {
        type: this.cornersDotType,
        color: this.colorMode === 'single' ? this.selectedColor : undefined,
        gradient: dotsGradient
      },
      backgroundOptions: {
        color: this.backgroundColor
      },
      imageOptions: {
        hideBackgroundDots: this.hideBackgroundDots,
        imageSize: this.logoSize,
        margin: this.logoMargin,
        crossOrigin: 'anonymous'
      },
      logoName: this.selectedLogo.name,
      logoSrc: this.selectedLogo.src,
      colorMode: this.colorMode,
      selectedColor: this.selectedColor,
      startColor: this.startColor,
      endColor: this.endColor,
      gradientDirection: this.gradientDirection
    };
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

    const config = this.getCurrentConfig();

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

  private getQrOptions(): Options {
    const config = this.getCurrentConfig();
    return {
      width: 280,
      height: 280,
      type: 'svg',
      data: this.getContentString(),
      image: config.logoSrc || undefined,
      dotsOptions: config.dotsOptions,
      cornersSquareOptions: config.cornersSquareOptions,
      cornersDotOptions: config.cornersDotOptions,
      backgroundOptions: config.backgroundOptions,
      imageOptions: config.imageOptions,
      margin: 5,
      qrOptions: {
        typeNumber: 0,
        mode: 'Byte',
        errorCorrectionLevel: 'H'
      }
    };
  }

  async renderQrCode() {
    if (!this.qrCanvas || !isPlatformBrowser(this.platformId)) return;
    if (!this.qrCode) {
      this.qrCode = new QRCodeStyling(this.getQrOptions());
      this.qrCode.append(this.qrCanvas.nativeElement);
    } else {
      this.qrCode.update(this.getQrOptions());
    }
  }
}

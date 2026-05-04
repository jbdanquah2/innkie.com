import { ErrorHandler, Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private platformId = inject(PLATFORM_ID);

  handleError(error: any): void {
    const errorStr = error?.message || error?.toString() || '';
    const chunkFailedMessage = /Failed to fetch dynamically imported module|Loading chunk [\d]+ failed/;
    const ssrIgnoredErrors = /NotYetImplemented|CanvasRenderingContext2D|HTMLCanvasElement/;
    
    if (chunkFailedMessage.test(errorStr)) {
      if (isPlatformBrowser(this.platformId)) {
        console.warn('Chunk load failed. Reloading page...');
        window.location.reload();
      }
      return;
    }

    // Ignore DOM/Canvas errors on the server
    if (!isPlatformBrowser(this.platformId) && ssrIgnoredErrors.test(errorStr)) {
      return;
    }

    // Default error logging
    console.error('Global error caught:', error);
  }
}

import { ErrorHandler, Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private platformId = inject(PLATFORM_ID);

  handleError(error: any): void {
    const chunkFailedMessage = /Failed to fetch dynamically imported module|Loading chunk [\d]+ failed/;
    
    if (chunkFailedMessage.test(error.message || error.toString())) {
      if (isPlatformBrowser(this.platformId)) {
        console.warn('Chunk load failed. Reloading page...');
        window.location.reload();
      }
      return;
    }

    // Default error logging
    console.error('Global error caught:', error);
  }
}

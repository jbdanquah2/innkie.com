import { ErrorHandler, Injectable } from '@angular/core';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: any): void {
    const chunkFailedMessage = /Failed to fetch dynamically imported module|Loading chunk [\d]+ failed/;
    
    if (chunkFailedMessage.test(error.message || error.toString())) {
      console.warn('Chunk load failed. Reloading page...');
      window.location.reload();
      return;
    }

    // Default error logging
    console.error('Global error caught:', error);
  }
}

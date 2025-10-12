import { Injectable } from '@angular/core';
import {BehaviorSubject, delay} from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private loadingCount = 0;
  private _loading = new BehaviorSubject<boolean>(false);

  loading$ = this._loading.asObservable().pipe(
    delay(0)
  );

  show() {
    this.loadingCount++;
    this._loading.next(true);
  }

  hide() {
    this.loadingCount = Math.max(this.loadingCount - 1, 0);
    if (this.loadingCount === 0) {
      this._loading.next(false);
    }
  }
}

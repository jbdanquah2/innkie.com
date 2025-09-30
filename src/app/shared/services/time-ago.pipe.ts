// time-ago.pipe.ts
import { Pipe, PipeTransform, ChangeDetectorRef, NgZone, OnDestroy } from '@angular/core';
import { formatDistanceToNow } from 'date-fns';
import { interval, Subscription } from 'rxjs';
import {Timestamp} from '@angular/fire/firestore';

@Pipe({
  name: 'timeAgo',
  pure: false   // 🔑 must be impure so Angular re-checks it
})
export class TimeAgoPipe implements PipeTransform, OnDestroy {
  private timer: Subscription | null = null;
  private lastValue: Date | null = null;
  private lastText = '';

  constructor(private changeDetector: ChangeDetectorRef, private ngZone: NgZone) {}

  transform(value: Date | string | number | Timestamp | undefined): string {
    if (!value || undefined) return '';

    const date = value instanceof Timestamp ? value.toDate() : new Date(value);

    // Only restart timer if new date input
    if (!this.lastValue || this.lastValue.getTime() !== date.getTime()) {
      this.lastValue = date;
      this.cleanTimer();

      this.ngZone.runOutsideAngular(() => {
        this.timer = interval(60 * 1000).subscribe(() => {
          this.ngZone.run(() => this.changeDetector.markForCheck());
        });
      });
    }

    this.lastText = formatDistanceToNow(date, { addSuffix: true });
    return this.lastText;
  }

  ngOnDestroy() {
    this.cleanTimer();
  }

  private cleanTimer() {
    if (this.timer) {
      this.timer.unsubscribe();
      this.timer = null;
    }
  }
}

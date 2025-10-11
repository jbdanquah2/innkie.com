// time-ago.pipe.ts
import { Pipe, PipeTransform, ChangeDetectorRef, NgZone, OnDestroy } from '@angular/core';
import { formatDistanceToNowStrict } from 'date-fns';
import { interval, Subscription } from 'rxjs';
import { Timestamp } from '@angular/fire/firestore';

@Pipe({
  name: 'timeAgo',
  pure: false // must be impure so Angular re-checks it
})
export class TimeAgoPipe implements PipeTransform, OnDestroy {
  private timer: Subscription | null = null;
  private lastValue: Date | null = null;
  private lastText = '';

  constructor(private changeDetector: ChangeDetectorRef, private ngZone: NgZone) {}

  transform(value: Date | string | number | Timestamp | Record<string, any> | undefined | null): string {
    try {
      if (value === undefined || value === null || value === '') return '';

      const date = this.parseToDate(value);
      if (!date || isNaN(date.getTime())) return '';

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

      this.lastText = formatDistanceToNowStrict(date, { addSuffix: true });
      return this.lastText;

    } catch (err) {
      console.error('Error in time-ago pipe:', err);
      return '';
    }
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

  /**
   * Parse a variety of timestamp shapes into a JS Date.
   * Supports:
   * - firebase Timestamp (has toDate())
   * - { seconds, nanoseconds }
   * - { _seconds, _nanoseconds }
   * - numeric (seconds or milliseconds) — heuristic applied
   * - ISO/other date strings
   */
  private parseToDate(value: any): Date | null {
    // If already a JS Date
    if (value instanceof Date) return value;

    // Firestore Timestamp instance (from @angular/fire/firestore)
    if (typeof value === 'object' && value !== null && typeof value.toDate === 'function') {
      try {
        return value.toDate();
      } catch {
        // fallthrough
      }
    }

    // Firestore proto { seconds, nanoseconds }
    if (typeof value === 'object' && value !== null && typeof value.seconds === 'number' && typeof value.nanoseconds === 'number') {
      const ms = (value.seconds * 1000) + Math.floor(value.nanoseconds / 1e6);
      return new Date(ms);
    }

    // Legacy object { _seconds, _nanoseconds }
    if (typeof value === 'object' && value !== null && typeof value._seconds === 'number' && typeof value._nanoseconds === 'number') {
      const ms = (value._seconds * 1000) + Math.floor(value._nanoseconds / 1e6);
      return new Date(ms);
    }

    // Numeric: could be seconds or milliseconds. Heuristic:
    // - if value < 1e12 treat as seconds (since ms timestamps are ~1.6e12+ in modern era)
    if (typeof value === 'number') {
      if (value < 1e12) {
        // treat as seconds
        return new Date(value * 1000);
      } else {
        // treat as milliseconds
        return new Date(value);
      }
    }

    // String: let Date constructor attempt parse (ISO strings etc.)
    if (typeof value === 'string') {
      const d = new Date(value);
      if (!isNaN(d.getTime())) return d;
      // maybe numeric string?
      const asNum = Number(value);
      if (!isNaN(asNum)) {
        return this.parseToDate(asNum);
      }
    }

    // Unknown format
    return null;
  }
}

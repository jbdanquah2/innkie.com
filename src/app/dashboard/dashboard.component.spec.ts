import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { provideAnimations } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

// --- MOCK SERVICES --- //
class MockShortUrlService {
  getAll: any[] = [];
  getUserShortUrls = jasmine.createSpy().and.returnValue(Promise.resolve([]));
  updateAllShortUrlsArray = jasmine.createSpy();
  getFirstPage = jasmine.createSpy().and.returnValue(Promise.resolve([]));
  getNextPage = jasmine.createSpy().and.returnValue(Promise.resolve([]));
  deleteShortUrl = jasmine.createSpy().and.returnValue(Promise.resolve());
  updateShortUrl = jasmine.createSpy().and.returnValue(Promise.resolve());
}
class MockAuthService {
  currentUser = { uid: 'abc', totalUrls: 2, maxUrls: 5, plan: 'free' };
}

class MockLoadingService {
  show() {}
  hide() {}
}

class MockClipboard {
  copy = jasmine.createSpy();
}
class MockSnackBar {
  open = jasmine.createSpy();
}
class MockRouter {
  navigate = jasmine.createSpy();
}
class MockDialog {
  open() {
    return {
      afterClosed: () => ({ subscribe: (cb: any) => { cb(); } }),
    } as any;
  }
}

// --- TEST SUITE --- //
describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: 'ShortUrlService', useClass: MockShortUrlService },
        { provide: 'AuthService', useClass: MockAuthService },
        { provide: 'LoadingService', useClass: MockLoadingService },
        { provide: Clipboard, useClass: MockClipboard },
        { provide: MatSnackBar, useClass: MockSnackBar },
        { provide: Router, useClass: MockRouter },
        { provide: MatDialog, useClass: MockDialog },
        provideAnimations(),
      ],
    }).compileComponents();
    // Angular Standalone Components: use createComponent instead of declarations/imports
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;

    // Setup default values to avoid undefined errors
    component.allShortUrls = [
      { id: '1', isActive: true, clickCount: 3, shortCode: 'abc', createdAt: new Date(), customAlias: 'x', originalUrl: 'y', title: 'z' },
      { id: '2', isActive: false, clickCount: 1, shortCode: 'def', createdAt: new Date(), customAlias: 'y', originalUrl: 'x', title: 'a' }
    ] as any;
    component.shortenedUrls = [
      { id: '1', isActive: true, clickCount: 3, shortCode: 'abc', createdAt: new Date(), customAlias: 'x1', originalUrl: 'y1', description: 'desc', title: 't1' },
      { id: '2', isActive: false, clickCount: 1, shortCode: 'def', createdAt: new Date(), customAlias: 'x2', originalUrl: 'y2', description: 'desc2', title: 't2' }
    ] as any;
    component.totalUrls = 2;
    component.currentUser = { uid: 'abc', totalUrls: 2, maxUrls: 5 };
    fixture.detectChanges();
  }));

  it('should create the dashboard component', () => {
    expect(component).toBeTruthy();
  });

  it('should compute allowed remaining', () => {
    expect(component.calcTotalAllowedRemaining).toBe(3);
    component.currentUser = {};
    expect(component.calcTotalAllowedRemaining).toBe(0);
  });

  it('should compute total active', () => {
    expect(component.calcTotalActive).toBe(1);
  });

  it('should compute total clicks', () => {
    expect(component.calcTotalClicks).toBe(4);
  });

  it('should filter by search', () => {
    // simulate search
    component.unfilteredShortUrls = []; // resets backup list
    const event = { target: { value: 'x1' } } as unknown as Event;
    component.onSearch(event);
    expect(component.shortenedUrls.length).toBe(1);
    expect(component.shortenedUrls[0].customAlias).toBe('x1');
  });

  it('should filter by status', () => {
    component.unfilteredShortUrls = [];
    component.filterByStatus('true');
    expect(component.shortenedUrls.every(u => u.isActive)).toBeTrue();
    component.filterByStatus('false');
    expect(component.shortenedUrls.every(u => !u.isActive)).toBeTrue();
    // all
    component.filterByStatus('all');
    expect(component.shortenedUrls.length).toBeGreaterThan(0);
  });

  it('should sort by clicks (mostClicks)', () => {
    component.listOrder = 'mostClicks';
    component.sortByDate();
    expect(component.shortenedUrls[0].clickCount).toBeGreaterThanOrEqual(<number>component.shortenedUrls[1].clickCount);
  });

  it('should find index by shortcode', () => {
    const idx = component.findIndexByShortCode('def');
    expect(idx).toBe(1);
    expect(component.findIndexByShortCode('notfound')).toBe(-1);
  });
});

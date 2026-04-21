import {Component, OnDestroy, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ActivatedRoute,
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterOutlet
} from '@angular/router';
import { TopMenuComponent } from './top-menu/top-menu.component';
import { FooterComponent } from './footer/footer.component';
import {LoadingComponent} from './loading/loading.component';
import {filter, Observable, Subscription} from 'rxjs';
import {LoadingService} from './shared/services/loading.service';
import {map} from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, TopMenuComponent, FooterComponent, LoadingComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  title: string = 'iNNkie.com'
  private sub!: Subscription;
  hideLayout$: Observable<boolean> | undefined;


  constructor(private loadingService: LoadingService,
              private router: Router,
              private route: ActivatedRoute) {

    this.hideLayout$ = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => {
        let route = this.router.routerState.root;
        let hide = false;

        while (route) {
          if (route.snapshot.data?.['hideLayout']) {
            hide = true;
            break;
          }
          route = route.firstChild!;
        }
        return hide;
      })
    );

  }

  ngOnInit() {
    this.sub = this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.loadingService.show();
      }
      if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.loadingService.hide();
      }
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}

// loading.component.ts
import {Component, inject} from '@angular/core';
import {LoadingService} from '../shared/services/loading.service';
import {AsyncPipe, NgIf} from '@angular/common';


@Component({
  selector: 'app-loading',
  standalone: true,
  templateUrl: './loading.component.html',
  imports: [
    NgIf,
    AsyncPipe
  ],
  styleUrls: ['./loading.component.scss']
})
export class LoadingComponent {
  private loadingService = inject(LoadingService);

  loading$ = this.loadingService.loading$;

  constructor() {}
}

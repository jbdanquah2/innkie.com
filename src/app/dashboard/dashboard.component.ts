import {Component, inject, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import {Auth} from '@angular/fire/auth';
import {AuthService} from '../shared/services/auth.service';
import {RouterLink} from '@angular/router';
import {ShortUrlService} from '../shared/services/short-url.service';
import {environment} from '../../environments/environment';
import {TimeAgoPipe} from '../shared/services/time-ago.pipe';
import {ShortUrl} from '../shared/models/short-url.model';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, TimeAgoPipe],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  private auth = inject(Auth);
  private shortUrlService = inject(ShortUrlService);

  currentUser: any = this.auth.currentUser;
  isLoading = true;
  totalUrls: number = 0;
  userId: string = '';
  shortenedUrls: ShortUrl[] = [];
  apiUrl = environment.appUrl;
  timeElapsed: any;


  constructor(private authService: AuthService) {

  }

  ngOnInit() {

    this.authService.user$.subscribe(async user => {
      console.log('###>>>>user', user)
      this.currentUser = user;
      console.log('###>>>>user', this.currentUser)
      console.log('###>>>>user.photoUrl', user?.photoURL)
      this.userId = user?.uid || '';
      this.totalUrls = user?.totalUrls || 0;

      await this.shortenedUrlList();
    });
  }

  async shortenedUrlList() {
    this.isLoading = true;

    this.shortenedUrls = (await this.shortUrlService.getUserShortUrls(this.userId)) as ShortUrl[];

    console.log('###shortenedUrls', this.shortenedUrls)
  }

  get calcTotalClicks(): number {
    let total = 0;
    this.shortenedUrls.forEach(url => {
      total += url.clickCount|| 0;
    });
    return total;
  }

  get calcTotalActive(): number {
    let total = 0;
    this.shortenedUrls.forEach(url => {
      if (url.isActive) total += 1;
    });
    return total;
  }

  get calcTotalAllowedRemaining(): number {
    // const planLimits: {[key: string]: number} = {
    //   free: 5,
    //   pro: 100,
    //   enterprise: 10000
    // };
    // const userPlan = this.currentUser?.plan || 'free';
    // const allowed = planLimits[userPlan] || 5;
    if (!this.currentUser?.maxUrls) return 0;

    return this.currentUser?.maxUrls - this.totalUrls;
  }



}

import {Component, inject, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import {Auth} from '@angular/fire/auth';
import {AuthService} from '../shared/services/auth.service';
import {RouterLink} from '@angular/router';

import {ShortUrlService} from '../shared/services/short-url.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
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
  shortenedUrls: any[] = [];


  constructor(private authService: AuthService) {

  }

  ngOnInit() {

    this.authService.user$.subscribe(async user => {
      console.log('###>>>>user', user)
      this.currentUser = user;
      this.userId = user?.uid || '';
      this.totalUrls = user?.totalUrls || 0;

      await this.shortenedUrlList();
    });
  }

  async shortenedUrlList() {
    this.isLoading = true;

    this.shortenedUrls = await this.shortUrlService.getUserShortUrls(this.userId)

    console.log('###shortenedUrls', this.shortenedUrls)

  }



}

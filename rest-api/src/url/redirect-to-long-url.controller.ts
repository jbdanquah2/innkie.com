import { BadRequestException, Controller, Get, NotFoundException, Param, Res } from '@nestjs/common';
import { FirebaseService } from '../services/firebase.service';
import * as log from 'loglevel';

@Controller()
export class RedirectToLongUrlController {

  constructor(private firebase: FirebaseService) {

  }

  @Get(':shortCode')
  async redirectToLongUrl(@Res() res: any, @Param('shortCode') shortCode: string) {
    log.debug('Called redirectToLongUrl with shortCode:', shortCode);

    if (!shortCode) {
      throw new BadRequestException('Short code is required');
    }

    log.debug('...shortCode##', shortCode);

    const shortUrlRef = this.firebase.db.doc(`shortUrls/${shortCode}`);
    const shortUrlSnapshot = await shortUrlRef.get();

    if (!shortUrlSnapshot.exists) {
      throw new NotFoundException('Short URL not found');
    }

    const shortUrlData = shortUrlSnapshot.data();

    if (!shortUrlData) {
      throw new NotFoundException('Short URL data is missing');
    }

    log.debug('...shortUrlData##', shortUrlData);

    // Increment click count
    await shortUrlRef.update({
      clickCount: (shortUrlData.clickCount || 0) + 1,
    });

    log.debug('Redirecting to original URL:', shortUrlData.originalUrl);

    return res.redirect(shortUrlData.originalUrl);
  }
}

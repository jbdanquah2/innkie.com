import {firstValueFrom} from 'rxjs';
import {environment} from '../../../environments/environment';
import {HttpClient} from '@angular/common/http';


export const APP_PATHS = ['/','/dashboard', '/features', '/login', '/settings', '/profile', '/help', '/about'];

export async function callRedirect(shortCode: string, http: HttpClient, password: string = '' ): Promise<any> {

  return await firstValueFrom(http.post(environment.redirectURL, {
      password: password,
      shortCode: shortCode
    }
  ))

}

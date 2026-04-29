import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'regexTest',
  standalone: true
})
export class RegexTestPipe implements PipeTransform {
  transform(value: string | undefined | null, pattern: string): boolean {
    if (!value) return false;
    const regex = new RegExp(pattern);
    return regex.test(value);
  }
}

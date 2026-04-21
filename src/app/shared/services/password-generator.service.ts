import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PasswordGeneratorService {
  public generate(length = 16): string {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghijkmnopqrstuvwxyz';
    const digits = '23456789';
    const special = '!@#$%^&*()-_=+[]{}?';
    const all = `${upper}${lower}${digits}${special}`;

    const required = [
      this.pick(upper),
      this.pick(lower),
      this.pick(digits),
      this.pick(special)
    ];

    while (required.length < length) {
      required.push(this.pick(all));
    }

    return required.sort(() => Math.random() - 0.5).join('');
  }

  private pick(charset: string): string {
    const index = Math.floor(Math.random() * charset.length);
    return charset[index];
  }
}

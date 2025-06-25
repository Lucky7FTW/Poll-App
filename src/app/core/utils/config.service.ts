import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';

export interface MenuItem {
  name: string;
  route: string;
  icon: string;
  enabled: boolean;
}

export interface FooterConfig {
  sticky: boolean;
  transparent: boolean;
}

export interface Config {
  menu: MenuItem[];
  header: {
    sticky: boolean;
    transparent: boolean;
  };
  footer: FooterConfig;
  languageSwitcher: {
    enabled: boolean;
  };
}

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  private configUrl = 'menu-config.json';

  constructor(private http: HttpClient) {}

  getConfig(): Observable<Config> {
    return this.http.get<Config>(this.configUrl);
  }
}

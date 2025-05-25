import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DaysFunctionsService {
  // 1️⃣ Funcție existentă: intervalul complet al săptămânii pe baza unei date
  getWeekInterval(dateString: string): { startDate: Date; endDate: Date } {
    const date = this.convertToDate(dateString);
    const dayOfWeek = date.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const daysToSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    const monday = new Date(date);
    monday.setDate(date.getDate() - daysToMonday);
    const sunday = new Date(date);
    sunday.setDate(date.getDate() + daysToSunday);

    return { startDate: monday, endDate: sunday };
  }

  // 2️⃣ Funcție existentă: returnează numele zilei pentru o dată dată
  getDayName(dateString: string): string {
    const date = this.convertToDate(dateString);
    const options: Intl.DateTimeFormatOptions = { weekday: 'long' };
    return date.toLocaleDateString('en-US', options);
  }

  // 3️⃣ Funcție existentă: verifică dacă data este înainte de azi
  isDateBeforeToday(dateString: string): boolean {
    const date = this.convertToDate(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  }

  // 4️⃣ Noua funcție: Formatează o dată ca "10 March"
  formatDateToDayMonth(dateString: string): string {
    const date = this.convertToDate(dateString);
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long',
    };
    return date.toLocaleDateString('en-US', options);
  }

  // 🔹 Funcție ajutătoare: conversie "DD-MM-YYYY" -> Date object
  convertToDate(dateString: string): Date {
    const [day, month, year] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  convertDateToString(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }
}

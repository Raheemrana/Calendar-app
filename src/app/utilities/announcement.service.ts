import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface Announcement {
  id: number;
  name: string;
  description: string;
}

@Injectable({
  providedIn: 'root',
})
export class AnnouncementService {
  private announcementsSubject = new BehaviorSubject<{
    [key: string]: Announcement[];
  }>({});
  announcements$ = this.announcementsSubject.asObservable();

  constructor() {
    this.loadAnnouncementsFromStorage();
  }

  private loadAnnouncementsFromStorage(): void {
    const storedAnnouncements = localStorage.getItem('calendarAnnouncements');
    if (storedAnnouncements) {
      this.announcementsSubject.next(JSON.parse(storedAnnouncements));
    }
  }

  saveAnnouncement(date: string, announcement: Announcement): void {
    const currentAnnouncements = this.announcementsSubject.value;
    if (!currentAnnouncements[date]) {
      currentAnnouncements[date] = [];
    }
    currentAnnouncements[date].push(announcement);
    this.announcementsSubject.next(currentAnnouncements);
    this.saveAnnouncementsToStorage();
  }

  getAnnouncementsForDate(date: string): Observable<Announcement[]> {
    return this.announcements$.pipe(
      map((announcements) => announcements[date] || [])
    );
  }

  saveAnnouncementsToStorage(): void {
    localStorage.setItem(
      'calendarAnnouncements',
      JSON.stringify(this.announcementsSubject.value)
    );
  }

  saveAnnouncementsForDate(date: string, announcements: Announcement[]): void {
    const currentAnnouncements = this.announcementsSubject.value;
    currentAnnouncements[date] = announcements;
    this.announcementsSubject.next(currentAnnouncements);
    this.saveAnnouncementsToStorage();
  }
}

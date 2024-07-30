import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, map, Observable, of, shareReplay, switchMap } from 'rxjs';
import { AnnouncementService } from '../utilities/announcement.service';

interface CalendarDay {
  date: number;
  isCurrentMonth: boolean;
  announcements: Announcement[];
}

interface Announcement {
  id: number;
  name: string;
  description: string;
}

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css'],
})
export class CalendarComponent implements OnInit {
  //#region variables
  private currentDateSubject = new BehaviorSubject<Date>(new Date());
  currentDate$: Observable<Date> = this.currentDateSubject.asObservable();
  calendarDays$!: Observable<CalendarDay[]>;
  weekdays: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  //#endregion

  constructor(public announcementService: AnnouncementService) {
  }

  ngOnInit(): void {
    this.calendarDays$ = this.currentDate$.pipe(
      switchMap(date => this.generateCalendarDays(date)),
      shareReplay(1)
    );
  }

  generateCalendarDays(date: Date): Observable<CalendarDay[]> {
    return of(date).pipe(
      map(currentDate => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const firstDayOfWeek = firstDayOfMonth.getDay();
        const calendarDays: CalendarDay[] = [];

        // Previous month days
        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
          const prevMonthDay = new Date(year, month, -i);
          calendarDays.push({
            date: prevMonthDay.getDate(),
            isCurrentMonth: false,
            announcements: [],
          });
        }

        // Current month days
        for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
          calendarDays.push({
            date: i,
            isCurrentMonth: true,
            announcements: [],
          });
        }

        // Next month days
        const remainingDays = 7 - (calendarDays.length % 7);
        if (remainingDays < 7) {
          for (let i = 1; i <= remainingDays; i++) {
            calendarDays.push({
              date: i,
              isCurrentMonth: false,
              announcements: [],
            });
          }
        }
        return calendarDays;
      }),
      switchMap(days => this.applyAnnouncementsToDays(days, date))
    );
  }

  private applyAnnouncementsToDays(days: CalendarDay[], currentDate: Date): Observable<CalendarDay[]> {
    return this.announcementService.announcements$.pipe(
      map(announcements => {
        return days.map(day => {
          const dateKey = this.getStorageKey(day, currentDate);
          return {
            ...day,
            announcements: announcements[dateKey] || []
          };
        });
      })
    );
  }

  previousMonth(): void {
    this.currentDateSubject.next(
      new Date(
        this.currentDateSubject.value.getFullYear(),
        this.currentDateSubject.value.getMonth() - 1,
        1
      )
    );
  }

  nextMonth(): void {
    this.currentDateSubject.next(
      new Date(
        this.currentDateSubject.value.getFullYear(),
        this.currentDateSubject.value.getMonth() + 1,
        1
      )
    );
  }

  private getStorageKey(day: CalendarDay, currentDate: Date): string {
    let month = currentDate.getMonth();
    if (!day.isCurrentMonth) {
      month = day.date > 15 ? month - 1 : month + 1;
    }
    const date = new Date(currentDate.getFullYear(), month, day.date);
    return date.toISOString().split('T')[0];
  }

  trackByDay(index: number, day: CalendarDay): number {
    return day.date;
  }

  onSaveAnnouncements(event: { date: string, announcements: Announcement[] }): void {
    this.announcementService.saveAnnouncementsForDate(event.date, event.announcements);
  }

}

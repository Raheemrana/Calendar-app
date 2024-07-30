import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CdkDragDrop, transferArrayItem } from '@angular/cdk/drag-drop';
import { Observable, Subject, combineLatest, of } from 'rxjs';
import { delay, map, startWith, takeUntil, tap } from 'rxjs/operators';
import { CommonMessagingKeys } from '../utilities/message-keys.service';

interface Announcement {
  id: number;
  name: string;
  description: string;
}

@Component({
  selector: 'app-day-cell',
  templateUrl: './day-cell.component.html',
  styleUrls: ['./day-cell.component.css'],
})
export class DayCellComponent implements OnInit, OnDestroy {
  //#region variables
  @Input() date!: number;
  @Input() isCurrentMonth!: boolean;
  @Input() announcements!: Announcement[];
  @Input() currentMonth$!: Observable<Date>;
  @Output() saveAnnouncements = new EventEmitter<{ date: string, announcements: Announcement[] }>();

  showModal = false;
  currentAnnouncement: Announcement = { id: 0, name: '', description: '' };
  isEditing = false;
  announcementForm: FormGroup;
  formErrors$!: Observable<string[]>;
  private nextId = 1;
  private destroy$ = new Subject<void>();
  //#endregion
  
  constructor(
    private fb: FormBuilder,
    public commonMessagingKeys: CommonMessagingKeys) 
    {
      this.announcementForm = this.fb.group({
        name: ['', [Validators.required, Validators.minLength(3)]],
        description: ['', Validators.maxLength(500)],
      });
    }

  ngOnInit(): void {
    this.setupFormErrorObservable();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupFormErrorObservable(): void {
    const nameErrors$ = this.announcementForm.get('name')!.statusChanges.pipe(
      startWith(''),
      map(() => this.getNameErrors())
    );

    this.formErrors$ = combineLatest([nameErrors$]).pipe(
      map(([nameErrors]) => [...nameErrors]),
      takeUntil(this.destroy$)
    );
  }

  private getNameErrors(): string[] {
    const nameControl = this.announcementForm.get('name')!;
    if (nameControl.invalid && (nameControl.dirty || nameControl.touched)) {
      const errors: string[] = [];
      if (nameControl.errors?.['required']) {
        errors.push(this.commonMessagingKeys.ERROR_NAME_MISSING);
      }
      if (nameControl.errors?.['minlength']) {
        errors.push(this.commonMessagingKeys.ERROR_NAME_LENGTH);
      }
      return errors;
    }
    return [];
  }

  openAnnouncementModal(announcement?: Announcement) {
    if (announcement) {
      this.currentAnnouncement = { ...announcement };
      this.isEditing = true;
      this.announcementForm.patchValue(this.currentAnnouncement);
    } else {
      this.currentAnnouncement = { id: 0, name: '', description: '' };
      this.isEditing = false;
      this.announcementForm.reset();
    }
    this.showModal = true;
  }

  closeAnnouncementModal() {
    this.showModal = false;
    this.currentAnnouncement = { id: 0, name: '', description: '' };
    this.isEditing = false;
    this.announcementForm.reset();
  }

  onDrop(event: CdkDragDrop<Announcement[]>) {
    if (event.previousContainer === event.container) {
      return;
    }
    of(event.container.data)
      .pipe(
        delay(0),
        tap((data) => {
          const newAnnouncement: Announcement = {
            id: this.nextId++,
            name: data[0]?.name,
            description: data[0]?.description,
          };
          this.announcements.push(newAnnouncement);
          const index = this.announcements.findIndex(
            (a) => a.id === data[0].id
          );
          if (index !== -1) {
            this.announcements.splice(index, 1);
          }
          this.emitSaveAnnouncements();
        })
      )
      .subscribe();

    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );
  }

  saveAnnouncement() {
    if (this.announcementForm.valid) {
      const formValue = this.announcementForm.value;
      if (this.isEditing) {
        const index = this.announcements.findIndex(
          (a) => a.id === this.currentAnnouncement.id
        );
        if (index !== -1) {
          this.announcements[index] = {
            ...this.currentAnnouncement,
            ...formValue,
          };
        }
      } else {
        const newAnnouncement: Announcement = {
          id: this.nextId++,
          ...formValue,
        };
        this.announcements.push(newAnnouncement);
      }
      this.emitSaveAnnouncements();
      this.closeAnnouncementModal();
    }
  }
  
  deleteAnnouncement() {
    const index = this.announcements.findIndex(
      (a) => a.id === this.currentAnnouncement.id
    );
    if (index !== -1) {
      this.announcements.splice(index, 1);
    }
    this.emitSaveAnnouncements();
    this.closeAnnouncementModal();
  }

  private async emitSaveAnnouncements() {
    let month = 0
    this.currentMonth$.subscribe(event => month = event.getMonth());
    const currentDate = new Date();
    if (this.isCurrentMonth == false)
    {
      month = this.date > 15 ? month - 1 : month + 1;
    }
    const date = new Date(currentDate.getFullYear(), month, this.date).toISOString().split('T')[0];
    this.saveAnnouncements.emit({ date, announcements: this.announcements });
  }
}

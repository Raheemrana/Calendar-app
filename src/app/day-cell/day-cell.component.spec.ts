import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DayCellComponent } from './day-cell.component';

describe('DayCellComponent', () => {
  let component: DayCellComponent;
  let fixture: ComponentFixture<DayCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DayCellComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DayCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

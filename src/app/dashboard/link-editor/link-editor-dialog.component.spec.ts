import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LinkEditorDialogComponent } from './link-editor-dialog.component';

describe('LinkEditorDialogComponent', () => {
  let component: LinkEditorDialogComponent;
  let fixture: ComponentFixture<LinkEditorDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LinkEditorDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LinkEditorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });


  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

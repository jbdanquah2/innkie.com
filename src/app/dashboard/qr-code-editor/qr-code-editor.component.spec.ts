import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QrCodeEditorComponent } from './qr-code-editor.component';

describe('QrCodeEditorComponent', () => {
  let component: QrCodeEditorComponent;
  let fixture: ComponentFixture<QrCodeEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QrCodeEditorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QrCodeEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

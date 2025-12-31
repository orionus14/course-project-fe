import { Component, NgZone, OnInit, ViewChild, ElementRef, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Speech } from '../../shared/services/speech.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserService } from '../../shared/services/user.service';
import { AuthService } from '../../shared/services/auth.service';
import { Router } from '@angular/router';
import { UserInterface } from '../../shared/interfaces/user';

interface VoiceRecord {
  id: string;
  text: string;
  language: string;
  engine: string;
  audio_filename?: string;
  created_at: string;
  updated_at: string;
}

@Component({
  selector: 'app-home',
  imports: [FormsModule, CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  // Користувач
  currentUser: UserInterface | null = null;

  // Стан
  recording = false;
  loading = false;
  inputMethod: 'record' | 'upload' = 'record';
  engine: 'whisper' | 'custom' = 'whisper';
  saveAudio = true;
  showRecords = false;

  // Результати
  transcript = '';
  language = '';
  currentRecordId: string | null = null;
  isEditingTranscript = false;
  editedTranscript = '';
  savingTranscript = false;
  saveSuccess = false;
  copySuccess = false;

  // Редагування записів з історії
  editingRecordId: string | null = null;
  editingRecordText = '';
  savingRecord = false;

  // Запис
  mediaRecorder: MediaRecorder | null = null;
  audioChunks: Blob[] = [];
  mediaStream: MediaStream | null = null;
  recordedAudioBlob: Blob | null = null;
  recordedAudioUrl: string | null = null;

  // Файл
  selectedFile: File | null = null;

  // Історія
  records: VoiceRecord[] = [];

  constructor(
    private speechService: Speech,
    private ngZone: NgZone,
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadUserInfo();
    this.loadRecords();
  }

  ngOnDestroy(): void {
    this.cleanupMediaRecorder();
    this.cleanupRecordedAudio();
  }

  loadUserInfo(): void {
    this.userService.getCachedUser().subscribe({
      next: user => {
        this.ngZone.run(() => {
          this.currentUser = user;
          this.cdr.detectChanges();
        });
      },
      error: err => {
        console.error('Error loading user info:', err);
      }
    });
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.ngZone.run(() => {
          this.resetState();
          this.userService.clearUser();
          this.cdr.detectChanges();
          this.router.navigate(['/login']);
        });
      },
      error: err => {
        console.error('Logout error:', err);
        alert('Помилка при виході');
      }
    });
  }

  resetState(): void {
    this.transcript = '';
    this.language = '';
    this.currentRecordId = null;
    this.records = [];
    this.selectedFile = null;
    this.recording = false;
    this.loading = false;
    this.showRecords = false;
    this.isEditingTranscript = false;
    this.editedTranscript = '';
    this.savingTranscript = false;
    this.saveSuccess = false;
    this.copySuccess = false;
    this.editingRecordId = null;
    this.editingRecordText = '';
    this.savingRecord = false;
    this.cleanupMediaRecorder();
    this.cleanupRecordedAudio();
  }

  // ========== ЗАПИС З МІКРОФОНУ ==========

  async startRecording(): Promise<void> {
    if (this.recording || this.loading || this.recordedAudioUrl) {
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      this.ngZone.run(() => {
        this.mediaStream = stream;
        this.transcript = '';
        this.language = '';

        const mimeType = MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4';

        this.mediaRecorder = new MediaRecorder(stream, { mimeType });
        this.audioChunks = [];

        this.mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            this.audioChunks.push(e.data);
          }
        };

        this.mediaRecorder.onstop = () => {
          const audioBlob = new Blob(this.audioChunks, { type: this.mediaRecorder!.mimeType });

          this.ngZone.run(() => {
            this.recordedAudioBlob = audioBlob;
            this.recordedAudioUrl = URL.createObjectURL(audioBlob);
            this.cleanupMediaRecorder();
            this.cdr.detectChanges();
          });
        };

        this.mediaRecorder.onerror = (event) => {
          console.error('MediaRecorder error:', event);
          this.cleanupMediaRecorder();

          this.ngZone.run(() => {
            this.recording = false;
            this.cdr.detectChanges();
            alert('Помилка під час запису');
          });
        };

        this.mediaRecorder.start();
        this.recording = true;
        this.cdr.detectChanges();
        console.log('Recording started...');
      });
    } catch (error) {
      console.error('Error accessing microphone:', error);
      this.ngZone.run(() => {
        this.recording = false;
        this.cdr.detectChanges();
        alert('Не вдалося отримати доступ до мікрофону');
      });
    }
  }

  stopRecording(): void {
    if (!this.recording || !this.mediaRecorder) {
      return;
    }

    this.ngZone.run(() => {
      try {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
          this.mediaRecorder.stop();
        }

        this.recording = false;
        this.cdr.detectChanges();
        console.log('Recording stopped');
      } catch (error) {
        console.error('Error stopping recording:', error);
        this.cleanupMediaRecorder();
        this.recording = false;
        this.cdr.detectChanges();
      }
    });
  }

  confirmAndSendRecording(): void {
    if (this.recordedAudioBlob) {
      this.sendAudio(this.recordedAudioBlob);
    }
  }

  discardRecording(): void {
    this.ngZone.run(() => {
      this.cleanupRecordedAudio();
      this.cdr.detectChanges();
    });
  }

  cleanupMediaRecorder(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
  }

  cleanupRecordedAudio(): void {
    if (this.recordedAudioUrl) {
      URL.revokeObjectURL(this.recordedAudioUrl);
      this.recordedAudioUrl = null;
    }
    this.recordedAudioBlob = null;
  }

  // ========== ЗАВАНТАЖЕННЯ ФАЙЛУ ==========

  onFileSelected(event: Event): void {
    this.ngZone.run(() => {
      const input = event.target as HTMLInputElement;
      if (input.files && input.files.length > 0) {
        this.selectedFile = input.files[0];
        this.cdr.detectChanges();
        console.log('File selected:', this.selectedFile.name);
      }
    });
  }

  uploadFile(): void {
    if (!this.selectedFile || this.loading) {
      return;
    }
    this.sendAudio(this.selectedFile);
  }

  clearSelectedFile(): void {
    this.ngZone.run(() => {
      this.selectedFile = null;
      if (this.fileInput) {
        this.fileInput.nativeElement.value = '';
      }
      this.cdr.detectChanges();
    });
  }

  onInputMethodChange(): void {
    this.ngZone.run(() => {
      this.clearSelectedFile();
      this.cleanupRecordedAudio();
      this.transcript = '';
      this.language = '';
      this.currentRecordId = null;
      this.isEditingTranscript = false;
      this.editedTranscript = '';

      if (this.recording) {
        this.stopRecording();
      }
      this.cdr.detectChanges();
    });
  }

  // ========== ВІДПРАВКА НА BACKEND ==========

  sendAudio(blob: Blob): void {
    this.ngZone.run(() => {
      this.loading = true;
      this.transcript = '';
      this.language = '';
      this.currentRecordId = null;
      this.isEditingTranscript = false;
      this.editedTranscript = '';
      this.cdr.detectChanges();
    });

    this.speechService.transcribeAudio(blob, this.engine, this.saveAudio).subscribe({
      next: res => {
        this.ngZone.run(() => {
          this.transcript = res.text;
          this.language = res.language;
          this.currentRecordId = res.id;
          this.loading = false;
          this.clearSelectedFile();
          this.cleanupRecordedAudio();
          this.cdr.detectChanges();
          this.loadRecords();
        });
      },
      error: err => {
        console.error('Transcription error:', err);
        this.ngZone.run(() => {
          this.loading = false;
          this.cdr.detectChanges();
          alert('Помилка розпізнавання: ' + (err.error?.detail || err.message));
        });
      }
    });
  }

  // ========== РЕДАГУВАННЯ ТА КОПІЮВАННЯ ==========

  startEditTranscript(): void {
    if (!this.currentRecordId) {
      alert('Немає запису для редагування');
      return;
    }

    this.ngZone.run(() => {
      this.isEditingTranscript = true;
      this.editedTranscript = this.transcript;
      this.cdr.detectChanges();
    });
  }

  saveTranscriptChanges(): void {
    if (!this.currentRecordId || !this.editedTranscript.trim()) {
      alert('Текст не може бути порожнім');
      return;
    }

    this.ngZone.run(() => {
      this.savingTranscript = true;
      this.cdr.detectChanges();
    });

    this.speechService.updateRecordText(this.currentRecordId, this.editedTranscript).subscribe({
      next: () => {
        this.ngZone.run(() => {
          this.transcript = this.editedTranscript;
          this.isEditingTranscript = false;
          this.savingTranscript = false;
          this.saveSuccess = true;
          this.cdr.detectChanges();

          // Оновлюємо запис в історії
          const recordIndex = this.records.findIndex(r => r.id === this.currentRecordId);
          if (recordIndex !== -1) {
            this.records[recordIndex].text = this.editedTranscript;
          }

          setTimeout(() => {
            this.ngZone.run(() => {
              this.saveSuccess = false;
              this.cdr.detectChanges();
            });
          }, 2000);
        });
      },
      error: err => {
        console.error('Error updating record:', err);
        this.ngZone.run(() => {
          this.savingTranscript = false;
          this.cdr.detectChanges();
          alert('Помилка збереження: ' + (err.error?.detail || err.message));
        });
      }
    });
  }

  cancelEditTranscript(): void {
    this.ngZone.run(() => {
      this.isEditingTranscript = false;
      this.editedTranscript = '';
      this.cdr.detectChanges();
    });
  }

  // Редагування записів з історії
  startRecordEdit(record: VoiceRecord): void {
    this.ngZone.run(() => {
      this.editingRecordId = record.id;
      this.editingRecordText = record.text;
      this.cdr.detectChanges();
    });
  }

  saveRecordEdit(recordId: string): void {
    if (!this.editingRecordText.trim()) {
      alert('Текст не може бути порожнім');
      return;
    }

    this.ngZone.run(() => {
      this.savingRecord = true;
      this.cdr.detectChanges();
    });

    this.speechService.updateRecordText(recordId, this.editingRecordText).subscribe({
      next: (response) => {
        this.ngZone.run(() => {
          // Оновлюємо запис в масиві
          const recordIndex = this.records.findIndex(r => r.id === recordId);
          if (recordIndex !== -1) {
            this.records[recordIndex].text = this.editingRecordText;
            this.records[recordIndex].updated_at = new Date().toISOString();
          }

          // Якщо це поточний запис, оновлюємо і transcript
          if (this.currentRecordId === recordId) {
            this.transcript = this.editingRecordText;
          }

          this.editingRecordId = null;
          this.editingRecordText = '';
          this.savingRecord = false;
          this.cdr.detectChanges();
        });
      },
      error: err => {
        console.error('Error updating record:', err);
        this.ngZone.run(() => {
          this.savingRecord = false;
          this.cdr.detectChanges();
          alert('Помилка збереження: ' + (err.error?.detail || err.message));
        });
      }
    });
  }

  cancelRecordEdit(): void {
    this.ngZone.run(() => {
      this.editingRecordId = null;
      this.editingRecordText = '';
      this.cdr.detectChanges();
    });
  }

  copyTranscript(): void {
    this.copyToClipboard(this.transcript);
  }

  copyRecordText(text: string): void {
    this.copyToClipboard(text);
  }

  private copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.ngZone.run(() => {
        this.copySuccess = true;
        this.cdr.detectChanges();

        setTimeout(() => {
          this.ngZone.run(() => {
            this.copySuccess = false;
            this.cdr.detectChanges();
          });
        }, 2000);
      });
    }).catch(err => {
      console.error('Failed to copy text:', err);
      alert('Не вдалося скопіювати текст');
    });
  }

  // ========== ІСТОРІЯ ЗАПИСІВ ==========

  toggleRecords(): void {
    this.ngZone.run(() => {
      this.showRecords = !this.showRecords;
      this.cdr.detectChanges();
      if (this.showRecords && this.records.length === 0) {
        this.loadRecords();
      }
    });
  }

  loadRecords(): void {
    this.ngZone.run(() => {
      this.loading = true;
      this.cdr.detectChanges();
    });

    this.speechService.getRecords().subscribe({
      next: records => {
        this.ngZone.run(() => {
          this.records = records;
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: err => {
        console.error('Error loading records:', err);
        this.ngZone.run(() => {
          this.loading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  playAudio(filename: string): void {
    this.speechService.getAudioUrl(filename).subscribe({
      next: url => {
        const audio = new Audio(url);
        audio.play().catch(err => {
          console.error('Error playing audio:', err);
          alert('Помилка відтворення аудіо');
        });
      },
      error: err => {
        console.error('Error loading audio:', err);
        alert('Помилка завантаження аудіо');
      }
    });
  }

  deleteRecord(recordId: string): void {
    if (!confirm('Видалити цей запис?')) {
      return;
    }

    this.speechService.deleteRecord(recordId).subscribe({
      next: () => {
        this.ngZone.run(() => {
          this.records = this.records.filter(r => r.id !== recordId);
          this.cdr.detectChanges();
        });
      },
      error: err => {
        console.error('Error deleting record:', err);
        alert('Помилка видалення');
      }
    });
  }
}

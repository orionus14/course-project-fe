import { Component, NgZone, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Speech } from '../../shared/services/speech.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserService } from '../../shared/services/user.service';
import { AuthService } from '../../shared/services/auth.service';
import { Router } from '@angular/router';

interface VoiceRecord {
  id: string;
  text: string;
  language: string;
  engine: string;
  audio_filename?: string;
  created_at: string;
}

@Component({
  selector: 'app-home',
  imports: [FormsModule, CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

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

  // Запис
  mediaRecorder!: MediaRecorder;
  audioChunks: Blob[] = [];

  // Файл
  selectedFile: File | null = null;

  // Історія
  records: VoiceRecord[] = [];

  constructor(
    private speechService: Speech,
    private ngZone: NgZone,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadRecords();
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.transcript = '';
        this.records = [];
        this.selectedFile = null;
        this.recording = false;
        this.loading = false;
        this.router.navigate(['/login']);
      },
      error: err => {
        console.error('Logout error:', err);
        alert('Помилка при виході');
      }
    });
  }


  // ========== ЗАПИС З МІКРОФОНУ ==========

  async startRecording() {
    if (this.recording) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = e => this.audioChunks.push(e.data);

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.ngZone.run(() => this.sendAudio(audioBlob));
      };

      this.mediaRecorder.start();
      this.recording = true;
      console.log('Recording started...');
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Не вдалося отримати доступ до мікрофону');
    }
  }

  stopRecording() {
    if (!this.recording) return;

    this.mediaRecorder.stop();
    this.mediaRecorder.stream.getTracks().forEach(track => track.stop());

    this.ngZone.run(() => {
      this.recording = false;
      console.log('Recording stopped');
    });
  }

  // ========== ЗАВАНТАЖЕННЯ ФАЙЛУ ==========

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      console.log('File selected:', this.selectedFile.name);
    }
  }

  uploadFile() {
    if (!this.selectedFile) return;
    this.sendAudio(this.selectedFile);
  }

  // ========== ВІДПРАВКА НА BACKEND ==========

  sendAudio(blob: Blob) {

    this.ngZone.run(() => {
      this.loading = true;
      this.transcript = '';
    });

    this.speechService.transcribeAudio(blob, this.engine, this.saveAudio).subscribe({
      next: res => {

        this.ngZone.run(() => {
          this.transcript = res.text;
          this.language = res.language;
          this.loading = false;
          this.loadRecords();
        });
      },
      error: err => {
        this.ngZone.run(() => {
          this.loading = false;
          alert('Помилка розпізнавання: ' + (err.error?.detail || err.message));
        });
      }
    });
  }

  // ========== ІСТОРІЯ ЗАПИСІВ ==========

  loadRecords() {
    this.loading = true;
    this.speechService.getRecords().subscribe({
      next: records => {
        this.records = records;
        this.loading = false;
      },
      error: err => {
        console.error('Error loading records:', err);
        this.loading = false;
      }
    });
  }

  playAudio(filename: string) {
    this.speechService.getAudioUrl(filename).subscribe({
      next: url => {
        const audio = new Audio(url);
        audio.play();
      },
      error: err => console.error('Error playing audio:', err)
    });
  }

  deleteRecord(recordId: string) {
    if (!confirm('Видалити цей запис?')) return;

    this.speechService.deleteRecord(recordId).subscribe({
      next: () => {
        this.records = this.records.filter(r => r.id !== recordId);
      },
      error: err => {
        console.error('Error deleting record:', err);
        alert('Помилка видалення');
      }
    });
  }
}
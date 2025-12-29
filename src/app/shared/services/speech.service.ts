import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class Speech {
  private apiUrl = `${environment.apiUrl}/voice`;

  constructor(private http: HttpClient) { }

  transcribeAudio(
    audioBlob: Blob,
    engine: 'whisper' | 'custom',
    saveAudio: boolean = true
  ): Observable<any> {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');

    const params = new HttpParams()
      .set('engine', engine)
      .set('save_audio', saveAudio.toString());

    return this.http.post<any>(
      `${this.apiUrl}/transcribe`,
      formData,
      { params, withCredentials: true }
    );
  }

  getRecords(limit: number = 50): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/records`,
      {
        params: { limit: limit.toString() },
        withCredentials: true
      }
    );
  }

  deleteRecord(recordId: string): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/records/${recordId}`,
      { withCredentials: true }
    );
  }

  getAudioUrl(filename: string): Observable<string> {
    return new Observable(observer => {
      observer.next(`${this.apiUrl}/audio/${filename}`);
      observer.complete();
    });
  }
}

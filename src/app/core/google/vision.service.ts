import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { firebaseConfig } from '../../../environment';

@Injectable({
  providedIn: 'root',
})
export class VisionService {
  private apiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${firebaseConfig.googleVisionApiKey}`;

  private http = inject(HttpClient);

  extractText(imageBase64: string): Observable<any> {
    return this.sendRequest(imageBase64);
  }

  public sendRequest(imageBase64: string) {
    const requestBody = this.newRequestBody(imageBase64);
    return this.newRequest(requestBody);
  }

  private newRequest(requestBody: any) {
    return this.http
      .post<any>(this.apiUrl, requestBody)
      .pipe(catchError((error) => this.handleError(error)));
  }

  private newRequestBody(imageBase64: string) {
    const requestBody = {
      requests: [
        {
          image: { content: imageBase64 },
          features: [{ type: 'TEXT_DETECTION' }],
        },
      ],
    };
    return requestBody;
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred while processing the image.';

    if (error.status === 400) {
      errorMessage = 'Invalid image format. Please try again.';
    } else if (error.status === 403) {
      errorMessage =
        'Google Vision API key is invalid or has exceeded its limit.';
      //user has no business here
      console.log('OCR API Error:', errorMessage);
    } else if (error.status === 500) {
      errorMessage = 'Google Vision API is temporarily unavailable.';
    }

    return throwError(() => new Error(errorMessage));
  }
}

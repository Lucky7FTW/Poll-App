import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firebaseConfig } from '../../../environment';

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${firebaseConfig.geminiApiKey}`;

  private http = inject(HttpClient);

  sendRequest(promt: string) {
    const requestBody = this.newRequestBody(promt);
    return this.newRequest(requestBody);
  }

  private newRequest(requestBody: any) {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<any>(this.apiUrl, requestBody, { headers });
  }

  private newRequestBody(promt: string) {
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: promt,
            },
          ],
        },
      ],
    };
    return requestBody;
  }

  public getResponse(response: any) {
    return response.candidates?.[0]?.content?.parts?.[0]?.text;
  }

  public cleanBotResponse(response: string): string {
    return response
      .replace(/\*\*/g, '') // Elimină bold (**text**)
      .replace(/\*/g, '') // Elimină marcatorii de listă (* item)
      .replace(/`/g, '') // Elimină backticks (`text`)
      .replace(/```json/g, '') // Elimină blocurile de cod JSON
      .replace(/```/g, '') // Elimină orice alt bloc de cod
      .replace(/\n/g, '<br>'); // Înlocuiește newline cu <br> (poți înlocui cu '\n' dacă vrei plain text)
  }

  public getPromt(utility: string) {
    return this.http.get<{ prompt: string }>(
      `assets/config/gemini/${utility}.config.json`
    );
  }
}

import { Injectable } from '@angular/core';
import {
  Database,
  ref,
  get,
  set,
  update,
  remove,
  child,
} from '@angular/fire/database';
import { from, map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RealtimeDatabaseService<T> {
  constructor(private db: Database) {}

  private getRef(path: string) {
    return ref(this.db, path);
  }

  getAll(collectionName: string): Observable<T[]> {
    const collectionRef = this.getRef(collectionName);
    return from(get(collectionRef)).pipe(
      map((snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          return Object.keys(data).map((key) => ({ id: key, ...data[key] }));
        }
        return [];
      })
    );
  }

  getById(collectionName: string, id: string): Observable<T | undefined> {
    const itemRef = this.getRef(`${collectionName}/${id}`);
    return from(get(itemRef)).pipe(
      map(
        (snapshot) =>
          (snapshot.exists() ? { id, ...snapshot.val() } : undefined) as
            | T
            | undefined
      )
    );
  }

  async add(collectionName: string, data: T): Promise<string> {
    const collectionRef = this.getRef(collectionName);
    const newRef = child(collectionRef, this.generateId());
    await set(newRef, data);
    return newRef.key!; // cheia generată automat de firebase
  }

  async update(
    collectionName: string,
    id: string,
    data: Partial<T>
  ): Promise<void> {
    const itemRef = this.getRef(`${collectionName}/${id}`);
    await update(itemRef, data);
  }

  async delete(collectionName: string, id: string): Promise<void> {
    const itemRef = this.getRef(`${collectionName}/${id}`);
    await remove(itemRef);
  }

  private generateId(): string {
    return new Date().getTime().toString(); // sau poți folosi UUID dacă vrei ceva mai sofisticat
  }
}

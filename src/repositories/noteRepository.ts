//src\repositories\noteRepository.ts
import type { Note } from "../notes.js";

export interface NoteRepository {
  save(note: Note): Promise<void>;

  findAll(): Promise<Note[]>;

  search(query: string): Promise<Note[]>;

  delete(id: string): Promise<boolean>;

  update(id: string, text: string): Promise<Note | null>;
}
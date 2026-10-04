//src\repositories\memoryNoteRepository.ts
import type { Note } from "../notes.js";
import type { NoteRepository } from "./noteRepository.js";

export class MemoryNoteRepository implements NoteRepository {
  private notes: Note[] = [];

  async save(note: Note): Promise<void> {
    this.notes.push(note);
  }

  async findAll(): Promise<Note[]> {
    return this.notes;
  }

  async search(query: string): Promise<Note[]> {
    const normalizedQuery = query.toLowerCase();

    return this.notes.filter((note) =>
      note.text.toLowerCase().includes(normalizedQuery),
    );
  }

  async delete(id: string): Promise<boolean> {
    const initialLength = this.notes.length;

    this.notes = this.notes.filter((note) => note.id !== id);

    return this.notes.length < initialLength;
  }

async update(id: string, text: string): Promise<Note | null> {
  const note = this.notes.find(note => note.id === id);

  if (!note) {
    return null;
  }

  note.text = text;

  return { ...note };
}

}

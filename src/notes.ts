// src\notes.ts
import crypto from "node:crypto";

import type { NoteRepository } from "./repositories/noteRepository.js";

export type Note = {
  id: string;
  text: string;
  createdAt: string;
};

export class NotesService {
  constructor(
    private readonly repository: NoteRepository
  ) {}

  async saveNote(text: string): Promise<Note> {
    const note: Note = {
      id: crypto.randomUUID(),
      text,
      createdAt: new Date().toISOString(),
    };

    await this.repository.save(note);

    return note;
  }

  async getNotes(): Promise<Note[]> {
    return this.repository.findAll();
  }

  async searchNotes(query: string): Promise<Note[]> {
    return this.repository.search(query);
  }

async deleteNote(id: string): Promise<boolean> {
  return this.repository.delete(id);
}

async updateNote( id: string, text: string): Promise<Note | null> {
  return this.repository.update(id, text);
}

}
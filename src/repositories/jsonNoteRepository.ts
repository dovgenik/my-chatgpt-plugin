//src\repositories\jsonNoteRepository.ts
import { promises as fs } from "node:fs";
import path from "node:path";

import type { Note } from "../notes.js";
import type { NoteRepository } from "./noteRepository.js";

export class JsonNoteRepository implements NoteRepository {
  private readonly dataDir = path.join(process.cwd(), "data");
  private readonly filePath = path.join(
    this.dataDir,
    "notes.json"
  );

  private async ensureStorage() {
    await fs.mkdir(this.dataDir, { recursive: true });

    try {
      await fs.access(this.filePath);
    } catch {
      await fs.writeFile(this.filePath, "[]", "utf-8");
    }
  }

  private async readNotes(): Promise<Note[]> {
    await this.ensureStorage();

    const data = await fs.readFile(
      this.filePath,
      "utf-8"
    );

    return JSON.parse(data);
  }

  private async writeNotes(notes: Note[]) {
    await this.ensureStorage();

    await fs.writeFile(
      this.filePath,
      JSON.stringify(notes, null, 2),
      "utf-8"
    );
  }

  async save(note: Note): Promise<void> {
    const notes = await this.readNotes();

    notes.push(note);

    await this.writeNotes(notes);
  }

  async findAll(): Promise<Note[]> {
    return this.readNotes();
  }

  async search(query: string): Promise<Note[]> {
    const notes = await this.readNotes();

    const normalizedQuery = query.toLowerCase();

    return notes.filter((note) =>
      note.text.toLowerCase().includes(normalizedQuery)
    );
  }

async delete(id: string): Promise<boolean> {
  const notes = await this.readNotes();

  const filtered = notes.filter(note => note.id !== id);

  if (filtered.length === notes.length) {
    return false;
  }

  await this.writeNotes(filtered);

  return true;
}

async update( id: string, text: string): Promise<Note | null> {
  const notes = await this.readNotes();

  const note = notes.find(note => note.id === id);

  if (!note) {
    return null;
  }

  note.text = text;

  await this.writeNotes(notes);

  return note;
}

}
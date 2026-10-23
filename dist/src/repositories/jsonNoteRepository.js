//src\repositories\jsonNoteRepository.ts
import { promises as fs } from "node:fs";
import path from "node:path";
export class JsonNoteRepository {
    dataDir = path.join(process.cwd(), "data");
    filePath = path.join(this.dataDir, "notes.json");
    async ensureStorage() {
        await fs.mkdir(this.dataDir, { recursive: true });
        try {
            await fs.access(this.filePath);
        }
        catch {
            await fs.writeFile(this.filePath, "[]", "utf-8");
        }
    }
    async readNotes() {
        await this.ensureStorage();
        const data = await fs.readFile(this.filePath, "utf-8");
        return JSON.parse(data);
    }
    async writeNotes(notes) {
        await this.ensureStorage();
        await fs.writeFile(this.filePath, JSON.stringify(notes, null, 2), "utf-8");
    }
    async save(note) {
        const notes = await this.readNotes();
        notes.push(note);
        await this.writeNotes(notes);
    }
    async findAll() {
        return this.readNotes();
    }
    async search(query) {
        const notes = await this.readNotes();
        const normalizedQuery = query.toLowerCase();
        return notes.filter((note) => note.text.toLowerCase().includes(normalizedQuery));
    }
    async delete(id) {
        const notes = await this.readNotes();
        const filtered = notes.filter(note => note.id !== id);
        if (filtered.length === notes.length) {
            return false;
        }
        await this.writeNotes(filtered);
        return true;
    }
    async update(id, text) {
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

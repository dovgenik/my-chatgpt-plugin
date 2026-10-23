// src\notes.ts
import crypto from "node:crypto";
export class NotesService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async saveNote(text) {
        const note = {
            id: crypto.randomUUID(),
            text,
            createdAt: new Date().toISOString(),
        };
        await this.repository.save(note);
        return note;
    }
    async getNotes() {
        return this.repository.findAll();
    }
    async searchNotes(query) {
        return this.repository.search(query);
    }
    async deleteNote(id) {
        return this.repository.delete(id);
    }
    async updateNote(id, text) {
        return this.repository.update(id, text);
    }
}

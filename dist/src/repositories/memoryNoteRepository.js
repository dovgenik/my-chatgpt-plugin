export class MemoryNoteRepository {
    notes = [];
    async save(note) {
        this.notes.push(note);
    }
    async findAll() {
        return this.notes;
    }
    async search(query) {
        const normalizedQuery = query.toLowerCase();
        return this.notes.filter((note) => note.text.toLowerCase().includes(normalizedQuery));
    }
    async delete(id) {
        const initialLength = this.notes.length;
        this.notes = this.notes.filter((note) => note.id !== id);
        return this.notes.length < initialLength;
    }
    async update(id, text) {
        const note = this.notes.find(note => note.id === id);
        if (!note) {
            return null;
        }
        note.text = text;
        return { ...note };
    }
}

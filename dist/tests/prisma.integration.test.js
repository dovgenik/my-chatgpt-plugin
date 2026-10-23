import "dotenv/config";
import assert from "node:assert/strict";
import { before, after, beforeEach, afterEach, test, } from "node:test";
import { prisma } from "../src/lib/prisma.js";
import { NotesService } from "../src/notes.js";
import { PrismaNoteRepository } from "../src/repositories/prismaNoteRepository.js";
const repository = new PrismaNoteRepository();
const service = new NotesService(repository);
let testNoteId;
// Виконується один раз перед усіма тестами.
before(async () => {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error("DATABASE_URL is missing");
    }
    const databaseName = new URL(connectionString).pathname.replace(/^\//, "");
    if (databaseName !== "mcp_notes_test") {
        throw new Error("Incorrect test database");
    }
    await prisma.$connect();
    const result = await prisma.$queryRaw `SELECT current_database() AS database_name`;
    assert.equal(result[0].database_name, "mcp_notes_test");
});
// Виконується перед кожним тестом.
beforeEach(async () => {
    testNoteId = undefined;
    const note = await service.saveNote("Test note");
    testNoteId = note.id;
});
// Виконується після кожного тесту.
afterEach(async () => {
    if (testNoteId) {
        await prisma.note.deleteMany({
            where: { id: testNoteId },
        });
    }
    testNoteId = undefined;
});
// Виконується один раз після всіх тестів.
after(async () => {
    await prisma.$disconnect();
});
test("updates a note in PostgreSQL", async () => {
    const updated = await service.updateNote(testNoteId, "Updated note");
    assert.equal(updated?.text, "Updated note");
    const notes = await service.getNotes();
    const found = notes.find(note => note.id === testNoteId);
    assert.equal(found?.text, "Updated note");
});
test("searches notes in PostgreSQL", async () => {
    const updated = await service.updateNote(testNoteId, "Learning PostgreSQL");
    assert.ok(updated);
    const results = await service.searchNotes("POSTGRESQL");
    assert.ok(results.some(note => note.id === testNoteId));
});
test("deletes a note from PostgreSQL", async () => {
    const deleted = await service.deleteNote(testNoteId);
    assert.equal(deleted, true);
    const notes = await service.getNotes();
    assert.equal(notes.some(note => note.id === testNoteId), false);
});

//  tests\notes.test.ts
// @ts-ignore
import crypto from "node:crypto";
// @ts-ignore
import assert from "node:assert/strict";
// @ts-ignore
import { test } from "node:test";


import { NotesService } from "../src/notes.js";
import { MemoryNoteRepository } from "../src/repositories/memoryNoteRepository.js";

test("saveNote creates a note", async () => {
  const repository = new MemoryNoteRepository();
  const service = new NotesService(repository);

  const note = await service.saveNote("Test note");
  const notes = await service.getNotes();

  assert.equal(note.text, "Test note");
  assert.equal(notes.length, 1);
  assert.deepEqual(notes[0], note);
});

test("getNotes returns an empty array", async () => {
  const repository = new MemoryNoteRepository();
  const service = new NotesService(repository);

  const notes = await service.getNotes();

  assert.deepEqual(notes, []);
});

test("searchNotes finds matching notes", async () => {
  const repository = new MemoryNoteRepository();
  const service = new NotesService(repository);

  await service.saveNote("Learn Prisma");
  await service.saveNote("Learn TypeScript");
  await service.saveNote("PostgreSQL database");

  const results = await service.searchNotes("learn");

  assert.equal(results.length, 2);
  assert.deepEqual(
    results.map(note => note.text),
    ["Learn Prisma", "Learn TypeScript"]
  );
});

test("updateNote changes an existing note", async () => {
  const repository = new MemoryNoteRepository();
  const service = new NotesService(repository);

  const original = await service.saveNote("Original text");

  const updated = await service.updateNote(
    original.id,
    "Updated text"
  );

  assert.notEqual(updated, null);
  assert.equal(updated?.id, original.id);
  assert.equal(updated?.text, "Updated text");
  assert.equal(updated?.createdAt, original.createdAt);

  const notes = await service.getNotes();

  assert.equal(notes[0].text, "Updated text");
});

test("deleteNote removes an existing note", async () => {
  const repository = new MemoryNoteRepository();
  const service = new NotesService(repository);

  const note = await service.saveNote("Temporary note");

  const deleted = await service.deleteNote(note.id);
  const notes = await service.getNotes();

  assert.equal(deleted, true);
  assert.deepEqual(notes, []);
});

test("updateNote returns null for a missing note", async () => {
  const repository = new MemoryNoteRepository();
  const service = new NotesService(repository);

  const result = await service.updateNote(
    crypto.randomUUID(),
    "New text"
  );

  assert.equal(result, null);
});

test("deleteNote returns false for a missing note", async () => {
  const repository = new MemoryNoteRepository();
  const service = new NotesService(repository);

  const deleted = await service.deleteNote(
    crypto.randomUUID()
  );

  assert.equal(deleted, false);
});
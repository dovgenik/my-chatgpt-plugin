//  tests\notes.test.ts
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
// src\repositories\prismaNoteRepository.ts
import type { Note as PrismaNote } from "../generated/prisma/client.js";
import { Prisma } from "../generated/prisma/client.js";

import type { Note } from "../notes.js";
import type { NoteRepository } from "./noteRepository.js";
import { prisma } from "../lib/prisma.js";

export class PrismaNoteRepository implements NoteRepository {
  async save(note: Note): Promise<void> {
    await prisma.note.create({
      data: {
        id: note.id,
        text: note.text,
        createdAt: new Date(note.createdAt),
      },
    });
  }

  async findAll(): Promise<Note[]> {
    const notes = await prisma.note.findMany({
      orderBy: {
        createdAt: "asc",
      },
    });

    return notes.map((note) => this.toNote(note));
  }

  async search(query: string): Promise<Note[]> {
    const notes = await prisma.note.findMany({
      where: {
        text: {
          contains: query,
          mode: "insensitive",
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return notes.map((note) => this.toNote(note));
  }

  async delete(id: string): Promise<boolean> {
    const result = await prisma.note.deleteMany({
      where: { id },
    });

    return result.count > 0;
  }

  async update(id: string, text: string): Promise<Note | null> {
    try {
      const updated = await prisma.note.update({
        where: { id },
        data: { text },
      });

      return this.toNote(updated);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        return null;
      }

      throw error;
    }
  }

  private toNote(note: PrismaNote): Note {
    return {
      id: note.id,
      text: note.text,
      createdAt: note.createdAt.toISOString(),
    };
  }
}

import { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
export class PrismaNoteRepository {
    async save(note) {
        await prisma.note.create({
            data: {
                id: note.id,
                text: note.text,
                createdAt: new Date(note.createdAt),
            },
        });
    }
    async findAll() {
        const notes = await prisma.note.findMany({
            orderBy: {
                createdAt: "asc",
            },
        });
        return notes.map((note) => this.toNote(note));
    }
    async search(query) {
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
    async delete(id) {
        const result = await prisma.note.deleteMany({
            where: { id },
        });
        return result.count > 0;
    }
    async update(id, text) {
        try {
            const updated = await prisma.note.update({
                where: { id },
                data: { text },
            });
            return this.toNote(updated);
        }
        catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === "P2025") {
                return null;
            }
            throw error;
        }
    }
    toNote(note) {
        return {
            id: note.id,
            text: note.text,
            createdAt: note.createdAt.toISOString(),
        };
    }
}

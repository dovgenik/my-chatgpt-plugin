//src\mcpServer.ts
import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { NotesService } from "./notes.js";
import { PrismaNoteRepository } from "./repositories/prismaNoteRepository.js";
export function createMcpServer() {
    const repository = new PrismaNoteRepository();
    const notesService = new NotesService(repository);
    const server = new McpServer({
        name: "my-notes",
        version: "1.0.0",
    });
    server.registerTool("save_note", {
        description: "Save a note",
        inputSchema: z.object({
            text: z.string().min(1),
        }),
    }, async ({ text }) => {
        const note = await notesService.saveNote(text);
        return {
            content: [
                {
                    type: "text",
                    text: `Note saved: ${note.text}`,
                },
            ],
        };
    });
    server.registerTool("get_notes", {
        description: "Get all saved notes",
    }, async () => {
        const notes = await notesService.getNotes();
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(notes, null, 2),
                },
            ],
        };
    });
    server.registerTool("search_notes", {
        description: "Search notes by text",
        inputSchema: z.object({
            query: z.string().min(1),
        }),
    }, async ({ query }) => {
        const notes = await notesService.searchNotes(query);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(notes, null, 2),
                },
            ],
        };
    });
    server.registerTool("delete_note", {
        description: "Delete a note by its ID",
        inputSchema: z.object({
            id: z.string().uuid(),
        }),
    }, async ({ id }) => {
        const deleted = await notesService.deleteNote(id);
        if (!deleted) {
            return {
                isError: true,
                content: [
                    {
                        type: "text",
                        text: `Note with ID ${id} was not found`,
                    },
                ],
            };
        }
        return {
            content: [
                {
                    type: "text",
                    text: `Note ${id} deleted successfully`,
                },
            ],
        };
    });
    server.registerTool("update_note", {
        description: "Update the text of an existing note",
        inputSchema: z.object({
            id: z.string().uuid(),
            text: z.string().trim().min(1),
        }),
    }, async ({ id, text }) => {
        const updated = await notesService.updateNote(id, text);
        if (!updated) {
            return {
                isError: true,
                content: [
                    {
                        type: "text",
                        text: `Note with ID ${id} was not found`,
                    },
                ],
            };
        }
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(updated, null, 2),
                },
            ],
        };
    });
    server.registerResource("all-notes", "notes://all", {
        title: "All Notes",
        description: "All notes stored in the notes database",
        mimeType: "application/json",
    }, async (uri) => {
        const notes = await notesService.getNotes();
        return {
            contents: [
                {
                    uri: uri.href,
                    mimeType: "application/json",
                    text: JSON.stringify(notes, null, 2),
                },
            ],
        };
    });
    return server;
}

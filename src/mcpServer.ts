//src\mcpServer.ts
import { McpServer, requireScopes, } from "@modelcontextprotocol/server";
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

  server.registerTool(
    "save_note",
    {
      description: "Save a note",
      inputSchema: z.object({
        text: z.string().min(1),  
      }),
      scopeChallenge: requireScopes("notes:write"),
    },
    async ({ text }) => {
      const note = await notesService.saveNote(text);

      return {
        content: [
          {
            type: "text",
            text: `Note saved: ${note.text}`,
          },
        ],
      };
    },
  );

  server.registerTool(
    "get_notes",
    {
      description: "Get all saved notes",
      scopeChallenge: requireScopes("notes:read"),
    },
    async () => {
      const notes = await notesService.getNotes();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(notes, null, 2),
          },
        ],
      };
    },
  );

  server.registerTool(
    "search_notes",
    {
      description: "Search notes by text",
      inputSchema: z.object({
        query: z.string().min(1),
      }),
      scopeChallenge: requireScopes("notes:read"),
    },
    async ({ query }) => {
      const notes = await notesService.searchNotes(query);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(notes, null, 2),
          },
        ],
      };
    },
  );

  server.registerTool(
    "delete_note",
    {
      description: "Delete a note by its ID",
      inputSchema: z.object({
        id: z.string().uuid(),
      }),
      scopeChallenge: requireScopes("notes:write"),
    },
    async ({ id }) => {
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
    },
  );

  server.registerTool(
    "update_note",
    {
      description: "Update the text of an existing note",
      inputSchema: z.object({
        id: z.string().uuid(),
        text: z.string().trim().min(1),
      }),
      scopeChallenge: requireScopes("notes:write"),
    },
    async ({ id, text }) => {
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
    },
  );

  server.registerResource(
  "all-notes",
  "notes://all",
  {
    title: "All Notes",
    description: "All notes stored in the notes database",
    mimeType: "application/json",
    scopeChallenge: requireScopes("notes:read"),
  },
  async (uri) => {
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
  },
);

server.registerTool(
  "whoami",
  {
    description: "Show authenticated client information",
    inputSchema: z.object({}),
  },
  async (_args, ctx) => {
    const authInfo = ctx.http?.authInfo;

    if (!authInfo) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: "No authentication information available",
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              clientId: authInfo.clientId,
              scopes: authInfo.scopes,
              expiresAt: authInfo.expiresAt,
            },
            null,
            2,
          ),
        },
      ],
    };
  },
);




  return server;
}
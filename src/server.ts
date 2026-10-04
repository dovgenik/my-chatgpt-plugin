//src\server.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { NotesService } from "./notes.js";
import { prisma } from "./lib/prisma.js";

//import { JsonNoteRepository } from "./repositories/jsonNoteRepository.js";
//import { MemoryNoteRepository } from "./repositories/memoryNoteRepository.js";
import { PrismaNoteRepository } from "./repositories/prismaNoteRepository.js";

const repository = new PrismaNoteRepository();

//const repository = new MemoryNoteRepository();
//const repository = new JsonNoteRepository();

const notesService = new NotesService(repository);

const server = new McpServer({
  name: "my-notes",
  version: "1.0.0",
});

server.registerTool(
  "save_note",
  {
    description: "Save a note",
    inputSchema: {
      text: z.string().min(1),
    },
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
  }
);

server.registerTool(
  "get_notes",
  {
    description: "Get all saved notes",
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
  }
);

server.registerTool(
  "search_notes",
  {
    description: "Search notes by text",
    inputSchema: {
      query: z.string().min(1),
    },
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
  }
);

server.registerTool(
  "delete_note",
  {
    description: "Delete a note by its ID",
    inputSchema: {
      id: z.string().uuid(),
    },
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
  }
);

server.registerTool(
  "update_note",
  {
    description: "Update the text of an existing note",
    inputSchema: {
      id: z.string().uuid(),
      text: z.string().trim().min(1),
    },
  },
  async ({ id, text }) => {
    const updated = await notesService.updateNote(
      id,
      text
    );

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
  }
);

const transport = new StdioServerTransport();

async function shutdown() {
  console.error("Shutting down MCP server...");

  try {
    await server.close();
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Shutdown error:", error);
    process.exit(1);
  }
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);

await server.connect(transport);
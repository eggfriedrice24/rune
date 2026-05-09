import { McpServer, StdioServerTransport } from "@modelcontextprotocol/server";
import * as z from "zod/v4";

import {
  createLibrary,
  createNotebook,
  deleteNote,
  deleteNotebook,
  getLibraryInfo,
  listNotes,
  listNotebooks,
  readNote,
  resolveLibraryPath,
  writeNote,
} from "./library.ts";

const VERSION = "0.0.1";

type ServerState = {
  libraryPath: string | null;
};

export function createRuneMcpServer(initialLibraryPath: string | null) {
  const state: ServerState = {
    libraryPath: initialLibraryPath ? resolveLibraryPath(initialLibraryPath) : null,
  };
  const server = new McpServer(
    { name: "rune", version: VERSION },
    {
      instructions:
        "Use this server to manage a local rune markdown library. Create notebooks before writing notes into them.",
    },
  );

  server.registerTool(
    "library.info",
    {
      description: "Return the active rune library path and basic counts.",
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async () => toolResponse({ library: await getLibraryInfo(state.libraryPath) }),
  );

  server.registerTool(
    "library.create",
    {
      description:
        "Create a rune library under the default library root, or under a custom root when provided. The created library becomes active.",
      inputSchema: z.object({
        name: z.string().min(1),
        root: z.string().min(1).optional(),
      }),
      annotations: { destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async (input) => {
      const library = await createLibrary(input);
      state.libraryPath = library.path;

      return toolResponse({ library });
    },
  );

  server.registerTool(
    "notebook.list",
    {
      description: "List notebooks in the active rune library.",
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async () => toolResponse({ notebooks: await listNotebooks(activeLibraryPath(state)) }),
  );

  server.registerTool(
    "notebook.create",
    {
      description: "Create a notebook folder in the active rune library.",
      inputSchema: z.object({
        name: z.string().min(1),
        parent: z.string().optional(),
      }),
      annotations: { destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async (input) =>
      toolResponse({
        notebook: await createNotebook({
          libraryPath: activeLibraryPath(state),
          name: input.name,
          parent: input.parent,
        }),
      }),
  );

  server.registerTool(
    "notebook.delete",
    {
      description: "Delete an empty notebook folder from the active rune library.",
      inputSchema: z.object({ path: z.string().min(1) }),
      annotations: { destructiveHint: true, idempotentHint: false, openWorldHint: false },
    },
    async (input) =>
      toolResponse({
        deleted: await deleteNotebook({ libraryPath: activeLibraryPath(state), path: input.path }),
      }),
  );

  server.registerTool(
    "note.list",
    {
      description: "List markdown notes in the active rune library, optionally under one notebook.",
      inputSchema: z.object({ notebook: z.string().optional() }),
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async (input) =>
      toolResponse({ notes: await listNotes(activeLibraryPath(state), input.notebook ?? "") }),
  );

  server.registerTool(
    "note.read",
    {
      description: "Read a markdown note from a notebook in the active rune library.",
      inputSchema: z.object({
        notebook: z.string().optional(),
        filename: z.string().min(1),
      }),
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async (input) =>
      toolResponse({
        result: await readNote({
          libraryPath: activeLibraryPath(state),
          notebook: input.notebook,
          filename: input.filename,
        }),
      }),
  );

  server.registerTool(
    "note.write",
    {
      description:
        "Create or overwrite a markdown note in an existing notebook in the active rune library.",
      inputSchema: z.object({
        notebook: z.string().optional(),
        filename: z.string().min(1),
        content: z.string(),
      }),
      annotations: { destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async (input) =>
      toolResponse({
        note: await writeNote({
          libraryPath: activeLibraryPath(state),
          notebook: input.notebook,
          filename: input.filename,
          content: input.content,
        }),
      }),
  );

  server.registerTool(
    "note.delete",
    {
      description: "Delete a markdown note from the active rune library.",
      inputSchema: z.object({
        notebook: z.string().optional(),
        filename: z.string().min(1),
      }),
      annotations: { destructiveHint: true, idempotentHint: false, openWorldHint: false },
    },
    async (input) =>
      toolResponse({
        deleted: await deleteNote({
          libraryPath: activeLibraryPath(state),
          notebook: input.notebook,
          filename: input.filename,
        }),
      }),
  );

  return server;
}

export async function startStdioServer(initialLibraryPath: string | null) {
  await createRuneMcpServer(initialLibraryPath).connect(new StdioServerTransport());
}

function activeLibraryPath(state: ServerState) {
  if (!state.libraryPath) {
    throw new Error("Start the server with --library or call library.create first.");
  }

  return state.libraryPath;
}

function toolResponse(data: Record<string, unknown>) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    structuredContent: data,
  };
}

#!/usr/bin/env bun

import { parseArgs, usage } from "./args.ts";
import { startStdioServer } from "./server.ts";

const options = parseArgs(Bun.argv.slice(2));

if (options.help) {
  console.log(usage());
  process.exit(0);
}

await startStdioServer(options.libraryPath);

export type CliOptions = {
  help: boolean;
  libraryPath: string | null;
};

export function usage() {
  return `Usage: rune-mcp [--library <path>]

Options:
  --library <path>  Open a rune library for notebook and note tools.
  --help            Show this message.
`;
}

export function parseArgs(args: string[]): CliOptions {
  const libraryEqualsArg = args.find((arg) => arg.startsWith("--library="));
  const libraryFlagIndex = args.indexOf("--library");
  const libraryPath = libraryEqualsArg
    ? libraryEqualsArg.slice("--library=".length)
    : libraryFlagIndex === -1
      ? null
      : (args[libraryFlagIndex + 1] ?? null);

  return {
    help: args.includes("--help") || args.includes("-h"),
    libraryPath,
  };
}

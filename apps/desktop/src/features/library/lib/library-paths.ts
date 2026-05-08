import { documentDir, homeDir, join } from "@tauri-apps/api/path";

const WINDOWS_HOME_PATH = /^(?:[a-zA-Z]:[\\/]|\\\\)/;

export async function getDefaultLibraryRoot() {
  const home = await homeDir();
  if (WINDOWS_HOME_PATH.test(home)) {
    return join(await documentDir(), "notes", "rune");
  }

  return join(home, "notes", "rune");
}

export async function getDefaultLibraryPath(folderName: string) {
  return join(await getDefaultLibraryRoot(), folderName);
}

export type FileNode = {
  name: string;
  path: string;
  type: "file";
};

export type DirectoryNode = {
  name: string;
  path: string;
  type: "directory";
  children: VaultNode[];
};

export type VaultNode = FileNode | DirectoryNode;

export type VaultStatus = "idle" | "loading" | "ready" | "error";

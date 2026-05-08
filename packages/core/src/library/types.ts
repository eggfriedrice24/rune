export type FileNode = {
  name: string;
  path: string;
  type: "file";
};

export type DirectoryNode = {
  name: string;
  path: string;
  type: "directory";
  children: LibraryNode[];
};

export type LibraryNode = FileNode | DirectoryNode;

export type LibraryStatus = "idle" | "loading" | "ready" | "error";

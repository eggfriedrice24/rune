import { joinPath, libraryFolderName, noteFileName } from "@rune/core";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getDefaultLibraryRoot } from "@/features/library/lib/library-paths";
import { useLibraryStore } from "@/features/library/store/library";
import { useRecentLibrariesStore } from "@/features/library/store/recent-libraries";

export type CreateDialogType = "note" | "notebook";

export type DeleteLibraryEntryTarget = {
  label: string;
  path: string;
  type: "note" | "notebook";
};

type LibraryDialogsProps = {
  createDialog: CreateDialogType | null;
  deleteTarget: DeleteLibraryEntryTarget | null;
  libraryDialogOpen: boolean;
  onCreateDialogChange: (dialog: CreateDialogType | null) => void;
  onDeleteTargetChange: (target: DeleteLibraryEntryTarget | null) => void;
  onLibraryDialogOpenChange: (open: boolean) => void;
};

export function LibraryDialogs({
  createDialog,
  deleteTarget,
  libraryDialogOpen,
  onCreateDialogChange,
  onDeleteTargetChange,
  onLibraryDialogOpenChange,
}: LibraryDialogsProps) {
  return (
    <>
      <LibraryManagerDialog open={libraryDialogOpen} onOpenChange={onLibraryDialogOpenChange} />
      <CreateNoteDialog
        open={createDialog === "note"}
        onOpenChange={(open) => onCreateDialogChange(open ? "note" : null)}
      />
      <CreateNotebookDialog
        open={createDialog === "notebook"}
        onOpenChange={(open) => onCreateDialogChange(open ? "notebook" : null)}
      />
      <DeleteLibraryEntryDialog target={deleteTarget} onTargetChange={onDeleteTargetChange} />
    </>
  );
}

function LibraryManagerDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = React.useState("");
  const [defaultRoot, setDefaultRoot] = React.useState<string | null>(null);
  const currentLibraryPath = useLibraryStore((state) => state.libraryPath);
  const createLibrary = useLibraryStore((state) => state.createLibrary);
  const closeLibrary = useLibraryStore((state) => state.closeLibrary);
  const openLibrary = useLibraryStore((state) => state.openLibrary);
  const status = useLibraryStore((state) => state.status);
  const error = useLibraryStore((state) => state.error);
  const recents = useRecentLibrariesStore((state) => state.recents);
  const folderName = libraryFolderName(name);

  React.useEffect(() => {
    if (!open) {
      setName("");
      return undefined;
    }

    let cancelled = false;
    void getDefaultLibraryRoot()
      .then((root) => {
        if (!cancelled) {
          setDefaultRoot(root);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDefaultRoot(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Library</DialogTitle>
          <DialogDescription>
            Create a local rune library, switch recent libraries, or import an existing folder.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {currentLibraryPath ? (
            <FieldGroup>
              <Field>
                <FieldLabel>Current library</FieldLabel>
                <FieldDescription className="break-all">{currentLibraryPath}</FieldDescription>
              </Field>
            </FieldGroup>
          ) : null}
          {recents.length > 0 ? (
            <FieldGroup>
              <Field>
                <FieldLabel>Recent libraries</FieldLabel>
                <div className="flex flex-col gap-1">
                  {recents.map((path) => (
                    <Button
                      key={path}
                      type="button"
                      variant={path === currentLibraryPath ? "secondary" : "ghost"}
                      className="justify-start"
                      onClick={() => {
                        void openLibrary(path).then(() => onOpenChange(false));
                      }}
                    >
                      <span className="truncate">{path}</span>
                    </Button>
                  ))}
                </div>
              </Field>
            </FieldGroup>
          ) : null}
        </div>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            void createLibrary(name).then(() => {
              if (useLibraryStore.getState().status !== "error") {
                onOpenChange(false);
              }
            });
          }}
        >
          <FieldGroup>
            <Field data-invalid={open && status === "error" ? true : undefined}>
              <FieldLabel htmlFor="library-name">Name</FieldLabel>
              <Input
                id="library-name"
                autoFocus
                placeholder="Personal notes"
                value={name}
                aria-invalid={open && status === "error" ? true : undefined}
                onChange={(event) => setName(event.target.value)}
              />
              <FieldDescription>
                {defaultRoot && folderName
                  ? joinPath(defaultRoot, folderName)
                  : "Stored in your notes folder"}
              </FieldDescription>
              {open && status === "error" && error ? (
                <FieldDescription className="text-destructive">{error}</FieldDescription>
              ) : null}
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void openLibrary().then(() => onOpenChange(false))}
            >
              Open existing folder
            </Button>
            {currentLibraryPath ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  closeLibrary();
                  onOpenChange(false);
                }}
              >
                Close library
              </Button>
            ) : null}
            <Button type="submit" disabled={!folderName || status === "loading"}>
              Create library
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CreateNoteDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = React.useState("");
  const libraryPath = useLibraryStore((state) => state.libraryPath);
  const selectedNotebookPath = useLibraryStore((state) => state.selectedNotebookPath);
  const createNote = useLibraryStore((state) => state.createNote);
  const status = useLibraryStore((state) => state.status);
  const error = useLibraryStore((state) => state.error);
  const fileName = noteFileName(name);

  React.useEffect(() => {
    if (!open) {
      setName("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create note</DialogTitle>
          <DialogDescription>
            Create a Markdown note in {selectedNotebookPath ?? libraryPath ?? "the current library"}
            .
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            void createNote(name).then(() => {
              if (useLibraryStore.getState().status !== "error") {
                onOpenChange(false);
              }
            });
          }}
        >
          <FieldGroup>
            <Field data-invalid={open && status === "error" ? true : undefined}>
              <FieldLabel htmlFor="note-name">Name</FieldLabel>
              <Input
                id="note-name"
                autoFocus
                placeholder="Meeting notes"
                value={name}
                aria-invalid={open && status === "error" ? true : undefined}
                onChange={(event) => setName(event.target.value)}
              />
              <FieldDescription>{fileName ?? "Use a readable note title."}</FieldDescription>
              {open && status === "error" && error ? (
                <FieldDescription className="text-destructive">{error}</FieldDescription>
              ) : null}
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!libraryPath || !fileName || status === "loading"}>
              Create note
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CreateNotebookDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = React.useState("");
  const libraryPath = useLibraryStore((state) => state.libraryPath);
  const selectedNotebookPath = useLibraryStore((state) => state.selectedNotebookPath);
  const createNotebook = useLibraryStore((state) => state.createNotebook);
  const status = useLibraryStore((state) => state.status);
  const error = useLibraryStore((state) => state.error);
  const folderName = libraryFolderName(name);

  React.useEffect(() => {
    if (!open) {
      setName("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create notebook</DialogTitle>
          <DialogDescription>
            Create a notebook folder in{" "}
            {selectedNotebookPath ?? libraryPath ?? "the current library"}.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            void createNotebook(name).then(() => {
              if (useLibraryStore.getState().status !== "error") {
                onOpenChange(false);
              }
            });
          }}
        >
          <FieldGroup>
            <Field data-invalid={open && status === "error" ? true : undefined}>
              <FieldLabel htmlFor="notebook-name">Name</FieldLabel>
              <Input
                id="notebook-name"
                autoFocus
                placeholder="Projects"
                value={name}
                aria-invalid={open && status === "error" ? true : undefined}
                onChange={(event) => setName(event.target.value)}
              />
              <FieldDescription>{folderName ?? "Use a short notebook name."}</FieldDescription>
              {open && status === "error" && error ? (
                <FieldDescription className="text-destructive">{error}</FieldDescription>
              ) : null}
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!libraryPath || !folderName || status === "loading"}>
              Create notebook
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteLibraryEntryDialog({
  target,
  onTargetChange,
}: {
  target: DeleteLibraryEntryTarget | null;
  onTargetChange: (target: DeleteLibraryEntryTarget | null) => void;
}) {
  const deleteNote = useLibraryStore((state) => state.deleteNote);
  const deleteNotebook = useLibraryStore((state) => state.deleteNotebook);
  const status = useLibraryStore((state) => state.status);
  const error = useLibraryStore((state) => state.error);

  return (
    <Dialog open={Boolean(target)} onOpenChange={(open) => !open && onTargetChange(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {target?.type ?? "entry"}</DialogTitle>
          <DialogDescription>
            {target?.type === "notebook"
              ? "This deletes the notebook folder and every note inside it."
              : "This deletes the Markdown file from disk."}
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!target) {
              return;
            }

            void (
              target.type === "note" ? deleteNote(target.path) : deleteNotebook(target.path)
            ).then(() => {
              if (useLibraryStore.getState().status !== "error") {
                onTargetChange(null);
              }
            });
          }}
        >
          <FieldGroup>
            <Field data-invalid={status === "error" ? true : undefined}>
              <FieldLabel>{target?.label ?? "Entry"}</FieldLabel>
              <FieldDescription className="break-all">{target?.path}</FieldDescription>
              {status === "error" && error ? (
                <FieldDescription className="text-destructive">{error}</FieldDescription>
              ) : null}
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onTargetChange(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={!target || status === "loading"}>
              Delete
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

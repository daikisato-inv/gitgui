// isomorphic-git PromiseFsClient implementation over File System Access API
//
// isomorphic-git detects "not found" by checking e.code === 'ENOENT'.
// The File System Access API throws DOMException (name='NotFoundError') instead.
// Every file operation wraps errors through toNodeError() to bridge this gap.

interface StatResult {
  type: "file" | "dir";
  mode: number;
  size: number;
  ino: number;
  mtimeMs: number;
  ctimeMs: number;
  uid: number;
  gid: number;
  dev: number;
  isFile: () => boolean;
  isDirectory: () => boolean;
  isSymbolicLink: () => boolean;
}

function makeStat(type: "file" | "dir", size: number): StatResult {
  const isFile = type === "file";
  return {
    type,
    mode: isFile ? 0o100644 : 0o040755,
    size,
    ino: 0,
    mtimeMs: 0,
    ctimeMs: 0,
    uid: 0,
    gid: 0,
    dev: 0,
    isFile: () => isFile,
    isDirectory: () => !isFile,
    isSymbolicLink: () => false,
  };
}

function toNodeError(err: unknown): Error {
  if (err instanceof DOMException) {
    if (err.name === "NotFoundError" || err.name === "TypeMismatchError") {
      const nodeErr = Object.assign(new Error(`ENOENT: ${err.message}`), {
        code: "ENOENT",
      });
      return nodeErr;
    }
    if (err.name === "NoModificationAllowedError") {
      return Object.assign(new Error(`EACCES: ${err.message}`), {
        code: "EACCES",
      });
    }
  }
  return err instanceof Error ? err : new Error(String(err));
}

async function resolveDir(
  root: FileSystemDirectoryHandle,
  parts: string[]
): Promise<FileSystemDirectoryHandle> {
  let dir = root;
  for (const part of parts) {
    try {
      dir = await dir.getDirectoryHandle(part);
    } catch (e) {
      throw toNodeError(e);
    }
  }
  return dir;
}

function splitPath(path: string): string[] {
  const result: string[] = [];
  for (const part of path.replace(/^\//, "").split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") { result.pop(); continue; }
    result.push(part);
  }
  return result;
}

export class BrowserFsAdapter {
  constructor(private root: FileSystemDirectoryHandle) {}

  readonly promises = {
    readFile: async (
      path: string,
      opts?: { encoding?: string } | string
    ): Promise<string | Uint8Array> => {
      try {
        const parts = splitPath(path);
        const name = parts.pop()!;
        const dir = await resolveDir(this.root, parts);
        const fh = await dir.getFileHandle(name);
        const file = await fh.getFile();
        const encoding =
          typeof opts === "string" ? opts : opts?.encoding;
        if (encoding === "utf8" || encoding === "utf-8") {
          return await file.text();
        }
        return new Uint8Array(await file.arrayBuffer());
      } catch (e) {
        throw toNodeError(e);
      }
    },

    writeFile: async (): Promise<void> => {
      // isomorphic-git writes back to .git/index to refresh stat cache.
      // We silently ignore all writes — the on-disk repo is read-only.
    },

    unlink: async (): Promise<void> => {
      throw Object.assign(new Error("EROFS: read-only filesystem"), {
        code: "EROFS",
      });
    },

    readdir: async (path: string): Promise<string[]> => {
      try {
        const parts = splitPath(path);
        const dir = await resolveDir(this.root, parts);
        const entries: string[] = [];
        for await (const name of dir.keys()) {
          entries.push(name);
        }
        return entries;
      } catch (e) {
        throw toNodeError(e);
      }
    },

    mkdir: async (): Promise<void> => {
      // no-op: isomorphic-git may try to create cache dirs; silently ignore.
    },

    rmdir: async (): Promise<void> => {
      throw Object.assign(new Error("EROFS: read-only filesystem"), {
        code: "EROFS",
      });
    },

    stat: async (path: string): Promise<StatResult> => {
      try {
        const parts = splitPath(path);
        const name = parts.pop();
        if (!name) return makeStat("dir", 0);
        const dir = await resolveDir(this.root, parts);
        try {
          const fh = await dir.getFileHandle(name);
          const file = await fh.getFile();
          return makeStat("file", file.size);
        } catch (fileErr) {
          // Not a file — try as directory
          if (
            fileErr instanceof DOMException &&
            fileErr.name === "TypeMismatchError"
          ) {
            return makeStat("dir", 0);
          }
          try {
            await dir.getDirectoryHandle(name);
            return makeStat("dir", 0);
          } catch (dirErr) {
            throw toNodeError(dirErr);
          }
        }
      } catch (e) {
        throw toNodeError(e);
      }
    },

    lstat: async (path: string): Promise<StatResult> => {
      return this.promises.stat(path);
    },

    readlink: async (path: string): Promise<string> => {
      // No symlink support via File System Access API.
      // isomorphic-git only calls readlink after lstat shows isSymbolicLink()=true,
      // which we never return, so this should not be reached in practice.
      throw Object.assign(new Error(`EINVAL: ${path}`), { code: "EINVAL" });
    },

    symlink: async (): Promise<void> => {
      throw Object.assign(new Error("EROFS: read-only filesystem"), {
        code: "EROFS",
      });
    },

    chmod: async (): Promise<void> => {
      // no-op: read-only adapter
    },
  };
}

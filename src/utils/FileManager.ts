import { Logger } from './Logger';
import {
  access,
  writeFile,
  readFile,
  mkdir,
  unlink,
  open,
  constants,
  FileHandle
} from 'node:fs/promises';
import { createWriteStream, type WriteStream } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

type Serializable = unknown;

export class FileManager {
  private static _instance: FileManager;

  // eslint-disable-next-line @typescript-eslint/naming-convention
  static get Instance(): FileManager {
    if (!this._instance) {
      this._instance = new FileManager();
    }

    return this._instance;
  }

  public async readFile(path: string): Promise<string | undefined> {
    try {
      return await readFile(path, { encoding: 'utf-8' });
    } catch (e) {
      Logger.Instance.err(e);

      return undefined;
    }
  }

  public async writeFile<T extends Serializable>(
    path: string,
    content: T
  ): Promise<void> {
    const data =
      typeof content === 'string' ? content : JSON.stringify(content);

    await writeFile(path, data);
  }

  public async createFolder(path: string): Promise<void> {
    try {
      if (await this.pathExists(path)) {
        return;
      }

      await mkdir(path);
    } catch (e) {
      Logger.Instance.err(e);
    }
  }

  public async removeFile(path: string): Promise<void> {
    try {
      if (await this.pathExists(path)) {
        await unlink(path);
      }
    } catch (e) {
      Logger.Instance.err(e);
    }
  }

  public async pathExists(path: string): Promise<boolean> {
    try {
      await access(path, constants.F_OK);

      return true;
    } catch {
      return false;
    }
  }

  public async createTmpWriteStream(): Promise<WriteStream> {
    const { file, path } = await this.openTmpFd();

    const stream = createWriteStream(path, {
      fd: file.fd,
      flags: 'w',
      mode: 0o666,
      encoding: 'utf-8'
    });

    stream.path = path;

    return stream;
  }

  private async openTmpFd(): Promise<{ path: string; file: FileHandle }> {
    const name = randomBytes(16).toString('hex').substring(16);
    const path = join(tmpdir(), name);
    const file = await open(path, 'w', 0o600);

    return { path, file };
  }
}

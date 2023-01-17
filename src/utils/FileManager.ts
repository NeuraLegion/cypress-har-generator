import { Logger } from './Logger';
import { promisify } from 'util';
import {
  access,
  constants,
  mkdir,
  open,
  unlink,
  writeFile,
  readFile,
  WriteStream,
  createWriteStream
} from 'fs';
import { randomBytes } from 'crypto';
import { tmpdir } from 'os';
import { join } from 'path';

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
      return await promisify(readFile)(path, { encoding: 'utf-8' });
    } catch (e) {
      Logger.Instance.err(e);

      return undefined;
    }
  }

  public async writeFile(path: string, data: string): Promise<void> {
    try {
      await this.removeFile(path);
      await promisify(writeFile)(path, data);
    } catch (e) {
      Logger.Instance.err(e);
    }
  }

  public async createFolder(path: string): Promise<void> {
    try {
      if (await this.exists(path)) {
        return;
      }

      await promisify(mkdir)(path);
    } catch (e) {
      Logger.Instance.err(e);
    }
  }

  public async removeFile(path: string): Promise<void> {
    try {
      if (await this.exists(path)) {
        await promisify(unlink)(path);
      }
    } catch (e) {
      Logger.Instance.err(e);
    }
  }

  public async exists(path: string): Promise<boolean> {
    try {
      await promisify(access)(path, constants.F_OK);

      return true;
    } catch {
      return false;
    }
  }

  public async createTmpWriteStream(): Promise<WriteStream> {
    const { fd, path } = await this.openTmpFd();

    const stream = createWriteStream(path, {
      fd,
      flags: 'w',
      mode: 0o666,
      encoding: 'utf-8'
    });

    stream.path = path;

    return stream;
  }

  private async openTmpFd(): Promise<{ path: string; fd: number }> {
    const name = randomBytes(16).toString('hex').substring(16);
    const path = join(tmpdir(), name);
    const fd = await promisify(open)(path, 'w', 0o600);

    return { path, fd };
  }
}

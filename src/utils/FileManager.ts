import { promisify } from 'util';
import {
  access as accessCb,
  constants,
  mkdir as mkdirCb,
  unlink as unlinkCb,
  writeFile as writeFileCb
} from 'fs';
import { Logger } from './Logger';

export class FileManager {
  private static _instance: FileManager;

  static get Instance(): FileManager {
    if (!this._instance) {
      this._instance = new FileManager();
    }

    return this._instance;
  }

  public readonly _access = promisify(accessCb);
  public readonly _unlink = promisify(unlinkCb);
  public readonly _writeFile = promisify(writeFileCb);
  public readonly _mkdir = promisify(mkdirCb);

  public async writeFile(path: string, data: string): Promise<void> {
    try {
      await this.removeFile(path);
      await this._writeFile(path, data);
    } catch (e) {
      Logger.Instance.err(e);
    }
  }

  public async createIfIsNotExist(path: string): Promise<void> {
    try {
      if (await this.exists(path)) {
        return;
      }

      await this._mkdir(path);
    } catch (e) {
      Logger.Instance.err(e);
    }
  }

  public async removeFile(path: string): Promise<void> {
    try {
      if (await this.exists(path)) {
        await this._unlink(path);
      }
    } catch (e) {
      Logger.Instance.err(e);
    }
  }

  public async exists(path: string): Promise<boolean> {
    try {
      await this._access(path, constants.F_OK);

      return true;
    } catch (e) {
      return false;
    }
  }
}

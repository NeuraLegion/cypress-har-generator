import { FileManager } from './FileManager';
import { describe, beforeEach, it, expect } from '@jest/globals';
import { randomBytes } from 'crypto';
import { join } from 'path';
import { tmpdir } from 'os';
import { WriteStream } from 'fs';

describe('FileManager', () => {
  let path!: string;

  const data = 'test data';
  const sut = FileManager.Instance;

  beforeEach(() => {
    path = join(tmpdir(), randomBytes(16).toString('hex').substring(16));
  });

  afterEach(() => sut.removeFile(path));

  describe('readFile', () => {
    it('should return the contents of a file', async () => {
      // arrange
      await sut.writeFile(path, data);
      // act
      const result = await sut.readFile(path);
      // assert
      expect(result).toEqual(data);
    });

    it('should return undefined if the file does not exist', async () => {
      // act
      const result = await sut.readFile(path);

      // assert
      expect(result).toBeUndefined();
    });
  });

  describe('writeFile', () => {
    it('should write data to a file', async () => {
      // act
      await sut.writeFile(path, data);
      // assert
      const result = await sut.readFile(path);
      expect(result).toEqual(data);
    });

    it('should rewrite data in a file if exists', async () => {
      // arrange
      const prevData = 'test';
      await sut.writeFile(path, prevData);
      // act
      await sut.writeFile(path, data);
      // assert
      const result = await sut.readFile(path);
      expect(result).toEqual(data);
    });
  });

  describe('removeFile', () => {
    it('should remove the file if it exists', async () => {
      // arrange
      await sut.writeFile(path, data);
      // act
      await sut.removeFile(path);
      // assert
      const result = await sut.exists(path);
      expect(result).toBeFalsy();
    });

    it('should do nothing if the file does not exist', async () => {
      // act
      await sut.removeFile(path);
      // assert
      const result = await sut.exists(path);
      expect(result).toBeFalsy();
    });
  });

  describe('exists', () => {
    it('should return true if the file exists', async () => {
      // arrange
      await sut.writeFile(path, data);
      // act
      const result = await sut.exists(path);
      // assert
      expect(result).toBeTruthy();
    });

    it('should return false if the file does not exist', async () => {
      // act
      const result = await sut.exists(path);
      // assert
      expect(result).toBeFalsy();
    });
  });

  describe('createFolder', () => {
    it('should create the folder if it does not exist', async () => {
      // act
      await sut.createFolder(path);
      // assert
      const result = await sut.exists(path);
      expect(result).toBeTruthy();
    });

    it('should do nothing if the folder already exists', async () => {
      // arrange
      await sut.createFolder(path);
      // act
      await sut.createFolder(path);
      // assert
      const result = await sut.exists(path);
      expect(result).toBeTruthy();
    });
  });

  describe('createTmpWriteStream', () => {
    it('should create a new write stream', async () => {
      // act
      const stream = await sut.createTmpWriteStream();
      // assert
      expect(stream).toBeInstanceOf(WriteStream);
    });

    it('should create a new temp file', async () => {
      // act
      const stream = await sut.createTmpWriteStream();
      // assert
      const result = await sut.exists(stream.path.toString());
      expect(result).toBeTruthy();
    });
  });
});

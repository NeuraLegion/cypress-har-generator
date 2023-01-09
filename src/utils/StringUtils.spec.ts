import { StringUtils } from './StringUtils';
import { describe, expect, it } from '@jest/globals';

describe('StringUtils', () => {
  describe('normalizeName', () => {
    it('should return the name of the file with the specified extension', () => {
      const path = '/path/to/file.txt';
      const expectedResult = 'file.csv';

      const result = StringUtils.normalizeName(path, { ext: '.csv' });

      expect(result).toEqual(expectedResult);
    });

    it('should return the name of the file with the default extension if no extension is specified', () => {
      const path = '/path/to/file';
      const expectedResult = 'file.har';

      const result = StringUtils.normalizeName(path);

      expect(result).toEqual(expectedResult);
    });

    it('should handle paths with backslashes correctly', () => {
      const path = '\\path\\to\\file.txt';
      const expectedResult = 'file.csv';

      const result = StringUtils.normalizeName(path, { ext: '.csv' });

      expect(result).toEqual(expectedResult);
    });

    it('should handle paths that only contain a filename correctly', () => {
      const path = 'file.txt';
      const expectedResult = 'file.csv';

      const result = StringUtils.normalizeName(path, { ext: '.csv' });

      expect(result).toEqual(expectedResult);
    });
  });

  describe('escapeCharacters', () => {
    it('should escape all specified characters in the input string', () => {
      const str = 'abc^def[]ghi{}jkl()\\mno.$*+?|pqr';
      const chars = '^[]{}()\\\\.$*+?|';
      const expectedResult =
        'abc\\^def\\[\\]ghi\\{\\}jkl\\(\\)\\\\mno\\.\\$\\*\\+\\?\\|pqr';

      const result = StringUtils.escapeCharacters(str, chars);

      expect(result).toEqual(expectedResult);
    });

    it('should return the input string if it does not contain any of the specified characters', () => {
      const str = 'abcdefghijklmnopqr';
      const chars = '^[]{}()\\\\.$*+?|';

      const result = StringUtils.escapeCharacters(str, chars);

      expect(result).toEqual(str);
    });

    it('should escape all characters in the default set if no set is specified', () => {
      const str = 'abc^def[]ghi{}jkl()\\mno.$*+?|pqr';
      const expectedResult =
        'abc\\^def\\[\\]ghi\\{\\}jkl\\(\\)\\\\mno\\.\\$\\*\\+\\?\\|pqr';

      const result = StringUtils.escapeCharacters(str);

      expect(result).toEqual(expectedResult);
    });
  });
});

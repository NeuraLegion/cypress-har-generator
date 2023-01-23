import { Loader } from './Loader';
import { jest, describe, it, expect, afterEach } from '@jest/globals';

describe('Loader', () => {
  const modulePath = './exampleModule';
  const module = 'example export';

  afterEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
  });

  describe('load', () => {
    it('should load the module from the given path using the default export', async () => {
      // arrange
      jest.mock(
        modulePath,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        () => ({ __esModule: true, default: module }),
        { virtual: true }
      );

      // act
      const result = await Loader.load<string>(modulePath);

      // assert
      expect(result).toBe(module);
    });

    it('should load the es module from the given path', async () => {
      // arrange
      jest.mock(
        modulePath,
        jest
          .fn<() => string>()
          .mockImplementationOnce(() => {
            throw new Error('[ERR_REQUIRE_ESM]');
          })
          .mockReturnValue(module),
        { virtual: true }
      );

      // act
      const result = await Loader.load<string>(modulePath);

      // assert
      expect(result).toBe(module);
    });

    it('should load the module from the given path using the default module.exports', async () => {
      // arrange
      jest.mock(modulePath, () => module, { virtual: true });

      // act
      const result = await Loader.load<string>(modulePath);

      // assert
      expect(result).toBe(module);
    });
  });
});

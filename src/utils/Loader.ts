import { ErrorUtils } from './ErrorUtils.js';
import { createRequire } from 'node:module';

export class Loader {
  private static readonly require = createRequire(import.meta.url);

  public static async load<T>(path: string): Promise<T | undefined> {
    let module: unknown;

    try {
      module = Loader.require(path);
    } catch (err) {
      if (!this.shouldUseDynamicImport(err)) {
        throw err;
      }

      module = (await import(path)).default;
    }

    return this.interopRequireDefault<T | undefined>(module);
  }

  private static shouldUseDynamicImport(err: unknown): boolean {
    const stack = ErrorUtils.isError(err) ? err.stack : undefined;

    return (
      !!stack?.includes('[ERR_REQUIRE_ESM]') ||
      !!stack?.includes(
        'SyntaxError: Cannot use import statement outside a module'
      )
    );
  }

  private static interopRequireDefault<T>(m: unknown): T | undefined {
    // @ts-expect-error unknown is not assignable to the module type
    return m?.__esModule && m.default ? m.default : m;
  }
}

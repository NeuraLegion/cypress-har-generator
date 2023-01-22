export class Loader {
  public static load<T>(path: string): T | undefined {
    const module = this.interopRequireDefault(
      // eslint-disable-next-line @typescript-eslint/no-var-requires -- `ts-node` does not handle the dynamic imports like `import(path)`
      require(/* webpackIgnore: true */ path)
    );

    return module?.default as T | undefined;
  }

  private static interopRequireDefault(obj: unknown): {
    default: unknown;
  } {
    // @ts-expect-error unknown is not assignable to the module type
    return obj?.__esModule ? obj : { default: obj };
  }
}

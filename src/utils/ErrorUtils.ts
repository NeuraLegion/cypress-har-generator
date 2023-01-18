export class ErrorUtils {
  public static isError(val: unknown): val is Error {
    return val instanceof Error;
  }
}

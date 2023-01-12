export interface NetworkObserverOptions {
  content?: boolean;
  excludePaths?: string[];
  includeHosts?: string[];
  includeMimes?: string[];
  excludeStatusCodes?: number[];
  /**
   * @deprecated As of version 6, this field will be removed. Use {@link excludeStatusCodes} instead.
   */
  minStatusCodeToInclude?: number;
  /**
   * @deprecated As of version 6, this flag will be disabled by default.
   */
  includeBlobs?: boolean;
}

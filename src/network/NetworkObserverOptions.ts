export interface NetworkObserverOptions {
  content?: boolean;
  excludePaths?: string[];
  includeHosts?: string[];
  includeMimes?: string[];
  minStatusCodeToInclude?: number;
  /**
   * @deprecated As of version 6, this flag will be disabled by default.
   */
  includeBlobs?: boolean;
}

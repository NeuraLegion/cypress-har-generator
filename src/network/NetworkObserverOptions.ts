export interface NetworkObserverOptions {
  content?: boolean;
  excludePaths?: string[];
  includeHosts?: string[];
  includeMimes?: string[];
  minStatusCodeToInclude?: number;
}

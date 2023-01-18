import { NetworkRequest } from '../NetworkRequest';
import type { RequestFilter, RequestFilterOptions } from './RequestFilter';

export class MinStatusCodeFilter implements RequestFilter {
  public apply(
    request: NetworkRequest,
    { minStatusCodeToInclude }: RequestFilterOptions
  ): boolean {
    const threshold = this.normalizeThreshold(minStatusCodeToInclude) ?? 0;

    return request.statusCode >= threshold;
  }

  public wouldApply(options: RequestFilterOptions): boolean {
    const threshold = this.normalizeThreshold(options.minStatusCodeToInclude);

    return typeof threshold === 'number';
  }

  private normalizeThreshold(
    value: number | string | undefined
  ): number | undefined {
    return value != null && !isNaN(+value)
      ? Math.round(Math.abs(+value))
      : undefined;
  }
}

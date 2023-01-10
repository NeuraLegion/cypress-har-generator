import { RequestFilter, RequestFilterOptions } from './RequestFilter';
import { NetworkRequest } from '../NetworkRequest';

export class StatusCodeFilter implements RequestFilter {
  public apply(
    request: NetworkRequest,
    { minStatusCodeToInclude = 0 }: RequestFilterOptions
  ): boolean {
    const threshold = this.normalizeThreshold(minStatusCodeToInclude);

    return request.statusCode >= threshold;
  }

  public wouldApply(options: RequestFilterOptions): boolean {
    const threshold = this.normalizeThreshold(options.minStatusCodeToInclude);

    return typeof threshold === 'number';
  }

  private normalizeThreshold(value: unknown): number | undefined {
    return !isNaN(+value) && value !== null
      ? Math.round(Math.abs(+value))
      : undefined;
  }
}

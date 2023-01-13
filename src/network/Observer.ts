export interface Observer<T> {
  empty: boolean;

  subscribe(callback: (data: T) => void): Promise<void>;

  unsubscribe(): Promise<void>;
}

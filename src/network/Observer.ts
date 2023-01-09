export interface Observer<T> {
  subscribe(callback: (data: T) => void): Promise<void>;

  unsubscribe(): Promise<void>;
}

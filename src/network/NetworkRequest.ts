import Protocol from 'devtools-protocol';
import { parse as parseUrl, UrlWithStringQuery } from 'url';
import { Header, Param, QueryString } from 'har-format';
import { CookieParser } from './CookieParser';
import { NetworkCookie } from './NetworkCookie';
import { RequestExtraInfo, ResponseExtraInfo } from './ExtraInfoBuilder';

export interface ContentData {
  error?: string;
  text?: string;
  encoding?: string;
}

export enum WebSocketFrameType {
  Request = 'request',
  Response = 'response',
  Error = 'error'
}

export interface WebSocket {
  type: WebSocketFrameType;
  data: string;
  time: Protocol.Network.MonotonicTime;
  opCode: number;
  mask: boolean;
}

export class NetworkRequest {
  private _contentData?: Promise<ContentData>;
  private _wallIssueTime: Protocol.Network.TimeSinceEpoch = -1;
  private _requestHeaderValues: Map<string, string> = new Map<string, string>();
  private _responseHeaderValues: Map<string, string> = new Map<
    string,
    string
  >();
  private _parsedQueryParameters?: QueryString[];
  private _currentPriority?: Protocol.Network.ResourcePriority;
  private _requestFormData: Promise<string | undefined> = Promise.resolve(
    undefined
  );
  private _formParametersPromise?: Promise<Param[]>;

  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  private _signedExchangeInfo?: Protocol.Network.SignedExchangeInfo;

  set signedExchangeInfo(info: Protocol.Network.SignedExchangeInfo) {
    this._signedExchangeInfo = info;
  }

  private _hasExtraResponseInfo: boolean = false;

  get hasExtraResponseInfo(): boolean {
    return this._hasExtraResponseInfo;
  }

  set hasExtraResponseInfo(value: boolean) {
    this._hasExtraResponseInfo = value;
  }

  private _hasExtraRequestInfo: boolean = false;

  get hasExtraRequestInfo(): boolean {
    return this._hasExtraRequestInfo;
  }

  set hasExtraRequestInfo(value: boolean) {
    this._hasExtraRequestInfo = value;
  }

  private _connectionId?: string = '0';

  get connectionId(): string | undefined {
    return this._connectionId;
  }

  set connectionId(value: string) {
    this._connectionId = value;
  }

  private _protocol: string = '';

  get protocol(): string {
    return this._protocol;
  }

  set protocol(value: string) {
    this._protocol = value ?? '';
  }

  private _requestTime: number = 0;

  get requestTime(): number {
    return this._requestTime;
  }

  set requestTime(value: number) {
    this._requestTime = value ?? 0;
  }

  private _requestMethod: string = '';

  get requestMethod(): string {
    return this._requestMethod;
  }

  set requestMethod(value: string) {
    this._requestMethod = value ?? '';
  }

  private _statusText: string = '';

  get statusText(): string {
    return this._statusText;
  }

  set statusText(value: string) {
    this._statusText = value ?? '';
  }

  private _parsedURL?: UrlWithStringQuery;

  get parsedURL(): UrlWithStringQuery {
    return this._parsedURL;
  }

  private _url?: string;

  get url(): string | undefined {
    return this._url;
  }

  private _remoteAddress: string = '';

  get remoteAddress(): string {
    return this._remoteAddress;
  }

  private _startTime: Protocol.Network.MonotonicTime = -1;

  get startTime(): Protocol.Network.MonotonicTime {
    return this._startTime || -1;
  }

  private _issueTime: Protocol.Network.MonotonicTime = -1;

  get issueTime(): Protocol.Network.MonotonicTime {
    return this._issueTime;
  }

  private _endTime: number = -1;

  get endTime(): number {
    return this._endTime || -1;
  }

  set endTime(x) {
    if (this.timing && this.timing.requestTime) {
      this._endTime = Math.max(x, this.responseReceivedTime);
    } else {
      this._endTime = x;
      if (this._responseReceivedTime > x) {
        this._responseReceivedTime = x;
      }
    }
  }

  private _responseReceivedTime: number = -1;

  get responseReceivedTime(): number {
    return this._responseReceivedTime || -1;
  }

  set responseReceivedTime(value: number) {
    this._responseReceivedTime = value;
  }

  private _resourceSize: number = 0;

  get resourceSize(): number {
    return this._resourceSize || 0;
  }

  set resourceSize(value: number) {
    this._resourceSize = value ?? 0;
  }

  private _transferSize: number = 0;

  get transferSize(): number {
    return this._transferSize || 0;
  }

  set transferSize(value: number) {
    this._transferSize = value ?? 0;
  }

  private _timing?: Protocol.Network.ResourceTiming;

  get timing(): Protocol.Network.ResourceTiming | undefined {
    return this._timing;
  }

  set timing(timingInfo: Protocol.Network.ResourceTiming) {
    if (!timingInfo) {
      return;
    }

    this._startTime = timingInfo.requestTime;

    const headersReceivedTime: number =
      timingInfo.requestTime + timingInfo.receiveHeadersEnd / 1000.0;

    if (
      (this._responseReceivedTime || -1) < 0 ||
      this._responseReceivedTime > headersReceivedTime
    ) {
      this._responseReceivedTime = headersReceivedTime;
    }

    if (this._startTime > this._responseReceivedTime) {
      this._responseReceivedTime = this._startTime;
    }

    this._timing = timingInfo;
  }

  private _mimeType?: string;

  get mimeType(): string | undefined {
    return this._mimeType;
  }

  set mimeType(value: string) {
    this._mimeType = value;
  }

  private _resourceType: Protocol.Network.ResourceType = 'Other';

  get resourceType(): Protocol.Network.ResourceType {
    return this._resourceType;
  }

  set resourceType(resourceType: Protocol.Network.ResourceType) {
    this._resourceType = resourceType ?? 'Other';
  }

  private _redirectSource?: NetworkRequest;

  get redirectSource(): NetworkRequest | undefined {
    return this._redirectSource;
  }

  set redirectSource(originatingRequest: NetworkRequest) {
    this._redirectSource = originatingRequest;
  }

  private _requestHeaders: Header[] = [];

  get requestHeaders(): Header[] {
    return this._requestHeaders;
  }

  set requestHeaders(headers: Header[]) {
    this._requestHeaders = headers;
    this._requestHeaderValues.clear();
    delete this._requestCookies;
  }

  private _requestCookies?: NetworkCookie[];

  get requestCookies(): NetworkCookie[] | undefined {
    if (!this._requestCookies) {
      const cookie = this.requestHeaderValue('Cookie');
      this._requestCookies = new CookieParser().parseCookie(cookie);
    }

    return this._requestCookies;
  }

  get contentLength(): number {
    const contentLength: string | undefined = this.requestHeaderValue(
      'Content-Length'
    );

    return isNaN(+contentLength) ? 0 : parseInt(contentLength, 10);
  }

  private _requestHeadersText: string = '';

  get requestHeadersText(): string {
    return this._requestHeadersText;
  }

  set requestHeadersText(text: string) {
    this._requestHeadersText = text;
  }

  private _connectionReused: boolean = false;

  get connectionReused(): boolean {
    return this._connectionReused;
  }

  set connectionReused(value: boolean) {
    this._connectionReused = value;
  }

  private _responseHeaders: Header[] = [];

  get responseHeaders(): Header[] {
    return this._responseHeaders || [];
  }

  set responseHeaders(value: Header[]) {
    this._responseHeaders = value;
    delete this._responseCookies;
    this._responseHeaderValues.clear();
  }

  private _responseHeadersText: string = '';

  get responseHeadersText(): string {
    return this._responseHeadersText;
  }

  set responseHeadersText(value: string) {
    this._responseHeadersText = value;
  }

  private _responseCookies?: NetworkCookie[];

  get responseCookies(): NetworkCookie[] | undefined {
    if (!this._responseCookies) {
      const cookie = this.responseHeaderValue('Set-Cookie');
      this._requestCookies = new CookieParser().parseSetCookie(cookie);
    }

    return this._responseCookies;
  }

  private _queryString?: string;

  get queryString(): string {
    if (this._queryString !== undefined) {
      return this._queryString;
    }

    let queryString: string = null;
    const questionMarkPosition: number = this.url.indexOf('?');

    if (questionMarkPosition !== -1) {
      queryString = this.url.substring(questionMarkPosition + 1);
      const hashSignPosition: number = queryString.indexOf('#');

      if (hashSignPosition !== -1) {
        queryString = queryString.substring(0, hashSignPosition);
      }
    }

    this._queryString = queryString;

    return this._queryString;
  }

  private _initialPriority?: Protocol.Network.ResourcePriority;

  get initialPriority(): Protocol.Network.ResourcePriority | undefined {
    return this._initialPriority;
  }

  set initialPriority(priority: Protocol.Network.ResourcePriority) {
    this._initialPriority = priority;
  }

  private _frames: WebSocket[] = [];

  get frames(): WebSocket[] {
    return this._frames;
  }

  private _statusCode: number = 0;

  get statusCode(): number {
    return this._statusCode;
  }

  set statusCode(value: number) {
    this._statusCode = value;
  }

  get requestId(): Protocol.Network.RequestId {
    return this._requestId;
  }

  get requestHttpVersion(): string {
    if (this.requestHeadersText) {
      const firstLine = this.requestHeadersText.split(/\r\n/)[0];
      const match = firstLine.match(/(HTTP\/\d+\.\d+)$/);

      return match ? match[1] : 'HTTP/0.9';
    }

    const version =
      this.requestHeaderValue('version') || this.requestHeaderValue(':version');
    if (version) {
      return version;
    }

    return this.getFilteredProtocolName();
  }

  get queryParameters(): QueryString[] | undefined {
    if (this._parsedQueryParameters) {
      return this._parsedQueryParameters;
    }

    if (!this.queryString) {
      return null;
    }

    this._parsedQueryParameters = this.parseParameters(this.queryString);

    return this._parsedQueryParameters;
  }

  get requestContentType(): string | undefined {
    return this.requestHeaderValue('Content-Type');
  }

  get priority(): Protocol.Network.ResourcePriority | undefined {
    return this._currentPriority ?? this._initialPriority ?? undefined;
  }

  set priority(priority: Protocol.Network.ResourcePriority) {
    this._currentPriority = priority;
  }

  constructor(
    private _requestId: Protocol.Network.RequestId,
    url: string,
    public readonly documentURL: string,
    public readonly frameId: Protocol.Page.FrameId = '',
    public readonly loaderId: Protocol.Network.LoaderId,
    public readonly initiator?: Protocol.Network.Initiator
  ) {
    this.setUrl(url);
  }

  private static escapeCharacters(
    str: string,
    chars: string = '^[]{}()\\\\.$*+?|'
  ): string {
    let foundChar = false;

    const length = chars.length;

    for (let i = 0; i < length; ++i) {
      if (str.indexOf(chars.charAt(i)) !== -1) {
        foundChar = true;
        break;
      }
    }

    if (!foundChar) {
      return str;
    }

    let result = '';

    for (let j = 0; j < str.length; ++j) {
      if (chars.indexOf(str.charAt(j)) !== -1) {
        result += '\\';
      }

      result += str.charAt(j);
    }

    return result;
  }

  public setUrl(value: string): void {
    if (this._url === value) {
      return;
    }

    this._url = value;
    this._parsedURL = parseUrl(value);
    delete this._queryString;
    delete this._parsedQueryParameters;
  }

  public setRemoteAddress(ip: string, port: number): void {
    this._remoteAddress = `${ip}:${port}`;
  }

  public setIssueTime(
    monotonicTime: Protocol.Network.MonotonicTime,
    wallTime: Protocol.Network.TimeSinceEpoch
  ): void {
    this._issueTime = monotonicTime;
    this._wallIssueTime = wallTime;
    this._startTime = monotonicTime;
  }

  public increaseTransferSize(value: number): void {
    this._transferSize = (this._transferSize || 0) + value;
  }

  public requestFormData(): Promise<string | undefined> {
    return this._requestFormData;
  }

  public setRequestFormData(data: string | Promise<string | undefined>): void {
    this._requestFormData =
      typeof data === 'string' ? Promise.resolve(data) : data;
    this._formParametersPromise = null;
  }

  public async _parseFormParameters(): Promise<Param[]> {
    if (
      this.requestContentType?.match(
        /^application\/x-www-form-urlencoded\s*(;.*)?$/i
      )
    ) {
      const formUrlencoded: string = await this.requestFormData();

      if (!formUrlencoded) {
        return;
      }

      return this.parseParameters(formUrlencoded);
    }

    const multipartDetails: RegExpMatchArray = this.requestContentType.match(
      /^multipart\/form-data\s*;\s*boundary\s*=\s*(\S+)\s*$/
    );

    if (!multipartDetails) {
      return;
    }

    const boundary: string = multipartDetails[1];
    if (!boundary) {
      return;
    }

    const formData: string = await this.requestFormData();
    if (!formData) {
      return;
    }

    return this.parseMultipartFormDataParameters(formData, boundary);
  }

  public getWallTime(monotonicTime: Protocol.Network.MonotonicTime): number {
    return this._wallIssueTime
      ? this._wallIssueTime - this._issueTime + monotonicTime
      : monotonicTime;
  }

  public formParameters(): Promise<Param[]> {
    // eslint-disable-next-line @typescript-eslint/tslint/config
    if (!this._formParametersPromise) {
      this._formParametersPromise = this._parseFormParameters();
    }

    return this._formParametersPromise;
  }

  public responseHttpVersion(): string {
    if (this._responseHeadersText) {
      const firstLine: string = this._responseHeadersText.split(/\r\n/)[0];
      const match: RegExpMatchArray | null = firstLine.match(
        /^(HTTP\/\d+\.\d+)/
      );

      return match ? match[1] : 'HTTP/0.9';
    }

    const version =
      this.responseHeaderValue('version') ||
      this.responseHeaderValue(':version');

    if (version) {
      return version;
    }

    return this.getFilteredProtocolName();
  }

  public setContentData(
    data: Promise<Protocol.Network.GetResponseBodyResponse>
  ): void {
    if (this.resourceType === 'WebSocket') {
      this._contentData = Promise.resolve({
        error: 'Content for WebSockets is currently not supported'
      });
    }

    this._contentData = data
      .then(
        ({
          body: text,
          base64Encoded
        }: Protocol.Network.GetResponseBodyResponse): ContentData => ({
          text,
          encoding: base64Encoded ? 'base64' : undefined
        })
      )
      .catch((e: Error): ContentData => ({ error: e.message }));
  }

  public contentData(): Promise<ContentData> | undefined {
    return this._contentData;
  }

  public addProtocolFrameError(
    errorMessage: string,
    time: Protocol.Network.MonotonicTime
  ): void {
    this.addFrame({
      type: WebSocketFrameType.Error,
      data: errorMessage,
      time,
      opCode: -1,
      mask: false
    });
  }

  public addProtocolFrame(
    response: Protocol.Network.WebSocketFrame,
    time: Protocol.Network.MonotonicTime,
    sent: boolean
  ): void {
    const type: WebSocketFrameType = sent
      ? WebSocketFrameType.Request
      : WebSocketFrameType.Response;

    this.addFrame({
      type,
      data: response.payloadData,
      time,
      opCode: response.opcode,
      mask: response.mask
    });
  }

  public markAsRedirect(redirectCount: number): void {
    this._requestId = `${this.requestId}:redirected.${redirectCount}`;
  }

  public addExtraRequestInfo(extraRequestInfo: RequestExtraInfo): void {
    this.requestHeaders = extraRequestInfo.requestHeaders;
    this._hasExtraRequestInfo = true;
    this.requestHeadersText = '';
  }

  public addExtraResponseInfo(extraResponseInfo: ResponseExtraInfo): void {
    this.responseHeaders = extraResponseInfo.responseHeaders;

    if (extraResponseInfo.responseHeadersText) {
      this.responseHeadersText = extraResponseInfo.responseHeadersText;

      if (this.requestHeadersText) {
        let requestHeadersText: string = `${this._requestMethod} ${this.parsedURL.path}`;

        if (this.parsedURL.query) {
          requestHeadersText += `?${this.parsedURL.query}`;
        }

        requestHeadersText += ` HTTP/1.1\r\n`;

        for (const { name, value } of this.requestHeaders) {
          requestHeadersText += `${name}: ${value}\r\n`;
        }

        this.requestHeadersText = requestHeadersText;
      }
    }

    this._hasExtraResponseInfo = true;
  }

  public responseHeaderValue(headerName: string): string | undefined {
    if (!this._responseHeaderValues.has(headerName)) {
      this._responseHeaderValues.set(
        headerName,
        this.computeHeaderValue(this.responseHeaders, headerName)
      );
    }

    return this._responseHeaderValues.get(headerName);
  }

  private parseMultipartFormDataParameters(
    data: string,
    boundary: string
  ): Param[] {
    const sanitizedBoundary: string = NetworkRequest.escapeCharacters(boundary);
    const keyValuePattern: RegExp = new RegExp(
      // Header with an optional file name.
      '^\\r\\ncontent-disposition\\s*:\\s*form-data\\s*;\\s*name="([^"]*)"(?:\\s*;\\s*filename="([^"]*)")?' +
        // Optional secondary header with the content type.
        '(?:\\r\\ncontent-type\\s*:\\s*([^\\r\\n]*))?' +
        // Padding.
        '\\r\\n\\r\\n' +
        // Value
        '(.*)' +
        // Padding.
        '\\r\\n$',
      'is'
    );
    const fields: string[] = data.split(
      // eslint-disable-next-line no-useless-escape
      new RegExp(`--${sanitizedBoundary}(?:--\s*$)?`, 'g')
    );

    return fields.reduce((result: Param[], field: string): Param[] => {
      const [match, name, value] = field.match(keyValuePattern) || [];

      if (!match) {
        return result;
      }

      result.push({ name, value });

      return result;
    }, []);
  }

  private addFrame(frame: WebSocket): void {
    this._frames.push(frame);
  }

  private requestHeaderValue(headerName: string): string | undefined {
    if (!this._requestHeaderValues.has(headerName)) {
      this._requestHeaderValues.set(
        headerName,
        this.computeHeaderValue(this.requestHeaders, headerName)
      );
    }

    return this._requestHeaderValues.get(headerName);
  }

  private getFilteredProtocolName(): string {
    const protocol = this._protocol.toLowerCase();

    if (protocol === 'h2') {
      return 'http/2.0';
    }

    return protocol.replace(/^http\/2(\.0)?\+/, 'http/2.0+');
  }

  private parseParameters(queryString: string): QueryString[] {
    return queryString.split('&').map(
      (pair: string): QueryString => {
        const position: number = pair.indexOf('=');
        if (position === -1) {
          return { name: pair, value: '' };
        } else {
          return {
            name: pair.substring(0, position),
            value: pair.substring(position + 1)
          };
        }
      }
    );
  }

  private computeHeaderValue(
    headers: Header[],
    headerName: string
  ): string | undefined {
    headerName = headerName.toLowerCase();

    const values: string[] = headers
      .filter(({ name }: Header): boolean => name.toLowerCase() === headerName)
      .map(({ value }: Header): string => value);

    if (!values.length) {
      return;
    }

    // Set-Cookie values should be separated by '\n', not comma, otherwise cookies could not be parsed.
    if (headerName === 'set-cookie') {
      return values.join('\n');
    }

    return values.join(', ');
  }
}

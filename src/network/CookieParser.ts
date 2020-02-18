import { NetworkCookie } from './NetworkCookie';

interface KeyValue {
  key: string;
  value?: string;
  position: number;
}

export class CookieParser {
  private _input?: string;
  private _originalInputLength?: number;
  private _lastCookie?: NetworkCookie;
  private _lastCookiePosition: number = 0;
  private _cookies?: NetworkCookie[];

  public parseCookie(cookieHeader: string): NetworkCookie[] | undefined {
    if (!this._initialize(cookieHeader!)) {
      return;
    }

    for (let kv = this._extractKeyValue(); kv; kv = this._extractKeyValue()) {
      if (kv.key.charAt(0) === '$' && this._lastCookie) {
        this._lastCookie.addAttribute(kv.key.slice(1), kv.value);
      } else if (
        kv.key.toLowerCase() !== '$version' &&
        typeof kv.value === 'string'
      ) {
        this.addCookie(kv);
      }

      this.advanceAndCheckCookieDelimiter();
    }

    this.flushCookie();

    return this._cookies;
  }

  public parseSetCookie(setCookieHeader: string): NetworkCookie[] | undefined {
    if (!this._initialize(setCookieHeader)) {
      return;
    }

    for (let kv = this._extractKeyValue(); kv; kv = this._extractKeyValue()) {
      if (this._lastCookie) {
        this._lastCookie.addAttribute(kv.key, kv.value);
      } else {
        this.addCookie(kv);
      }
      if (this.advanceAndCheckCookieDelimiter()) {
        this.flushCookie();
      }
    }
    this.flushCookie();

    return this._cookies;
  }

  private _initialize(headerValue: string): boolean {
    this._input = headerValue;
    if (typeof headerValue !== 'string') {
      return false;
    }
    this._cookies = [];
    this._lastCookie = undefined;
    this._originalInputLength = this._input!.length;

    return true;
  }

  private flushCookie(): void {
    if (this._lastCookie) {
      this._lastCookie.size =
        this._originalInputLength! -
        this._input!.length -
        this._lastCookiePosition;
    }

    delete this._lastCookie;
  }

  private _extractKeyValue(): KeyValue | undefined {
    if (!this._input?.length) {
      return;
    }

    // Note: RFCs offer an option for quoted values that may contain commas and semicolons.
    // Many browsers/platforms do not support this, however (see http://webkit.org/b/16699
    // and http://crbug.com/12361). The logic below matches latest versions of IE, Firefox,
    // Chrome and Safari on some old platforms. The latest version of Safari supports quoted
    // cookie values, though.
    const keyValueMatch = /^[ \t]*([^\s=;]+)[ \t]*(?:=[ \t]*([^;\n]*))?/i.exec(
      this._input
    );

    if (!keyValueMatch) {
      return;
    }

    const result: KeyValue = {
      key: this.toCamelCase(keyValueMatch[1]),
      value: keyValueMatch[2]?.trim(),
      position: this._originalInputLength! - this._input.length
    };

    this._input = this._input.slice(keyValueMatch[0].length);

    return result;
  }

  private toCamelCase(str: string): string {
    return str
      .replace(/\s(.)/g, (m: string): string => m.toUpperCase())
      .replace(/\s/g, '')
      .replace(/^(.)/, (m: string): string => m.toLowerCase());
  }

  private advanceAndCheckCookieDelimiter(): boolean {
    const match: RegExpExecArray | null = /^\s*[\n;]\s*/.exec(this._input!);

    if (!match) {
      return false;
    }

    this._input = this._input!.slice(match[0].length);

    return match[0].match('\n') !== null;
  }

  private addCookie(keyValue: KeyValue): void {
    if (this._lastCookie) {
      this._lastCookie.size = keyValue.position - this._lastCookiePosition;
    }

    this._lastCookie =
      typeof keyValue.value === 'string'
        ? new NetworkCookie(keyValue.key, keyValue.value)
        : new NetworkCookie('', keyValue.key);

    this._lastCookiePosition = keyValue.position;
    this._cookies!.push(this._lastCookie);
  }
}

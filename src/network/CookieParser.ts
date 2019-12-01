import { Cookie } from 'har-format';

interface KeyValue {
  key: string;
  value?: string;
  pos: number;
}

export class CookieParser {
  private _input?: string;
  private _originalInputLength?: number;
  private _lastCookie?: Cookie;

  private _cookies: Cookie[];

  get cookies(): Cookie[] {
    return this._cookies;
  }

  public parseCookie(cookieHeader: string): Cookie[] | undefined {
    if (!this._initialize(cookieHeader)) {
      return;
    }

    for (let kv = this._extractKeyValue(); kv; kv = this._extractKeyValue()) {
      if (kv.key.charAt(0) === '$' && this._lastCookie) {
        this._lastCookie[kv.key.slice(1)] = kv.value;
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

  public parseSetCookie(setCookieHeader: string): Cookie[] | undefined {
    if (!this._initialize(setCookieHeader)) {
      return;
    }

    for (let kv = this._extractKeyValue(); kv; kv = this._extractKeyValue()) {
      if (this._lastCookie) {
        this._lastCookie[kv.key] = kv.value;
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
    this._lastCookie = null;
    this._originalInputLength = this._input.length;

    return true;
  }

  private flushCookie(): void {
    delete this._lastCookie;
  }

  private _extractKeyValue(): KeyValue {
    if (!this._input?.length) {
      return;
    }

    // Note: RFCs offer an option for quoted values that may contain commas and semicolons.
    // Many browsers/platforms do not support this, however (see http://webkit.org/b/16699
    // and http://crbug.com/12361). The logic below matches latest versions of IE, Firefox,
    // Chrome and Safari on some old platforms. The latest version of Safari supports quoted
    // cookie values, though.
    const keyValueMatch = /^[ \t]*([^\s=;]+)[ \t]*(?:=[ \t]*([^;\n]*))?/.exec(
      this._input
    );

    if (!keyValueMatch) {
      return;
    }

    const result: KeyValue = {
      key: keyValueMatch[1],
      value: keyValueMatch[2] && keyValueMatch[2].trim(),
      pos: this._originalInputLength - this._input.length
    };

    this._input = this._input.slice(keyValueMatch[0].length);

    return result;
  }

  private advanceAndCheckCookieDelimiter(): boolean {
    const match: RegExpExecArray | undefined = /^\s*[\n;]\s*/.exec(this._input);

    if (!match) {
      return false;
    }

    this._input = this._input.slice(match[0].length);

    return match[0].match('\n') !== null;
  }

  private addCookie(keyValue: KeyValue): void {
    // Mozilla bug 169091: Mozilla, IE and Chrome treat single token (w/o "=") as
    // specifying a value for a cookie with empty name.
    this._lastCookie =
      typeof keyValue.value === 'string'
        ? { name: keyValue.key, value: keyValue.value }
        : { name: '', value: keyValue.key };

    this._cookies.push(this._lastCookie);
  }
}

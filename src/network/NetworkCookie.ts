export enum CookieAttribute {
  NAME = 'name',
  VALUE = 'value',
  SIZE = 'size',
  DOMAIN = 'domain',
  PORT = 'port',
  PATH = 'path',
  EXPIRES = 'expires',
  HTTPONLY = 'httponly',
  SECURE = 'secure',
  SAMESITE = 'samesite',
  MAXAGE = 'max-age'
}

type Samesite = 'Strict' | 'Lax' | 'None';

export class NetworkCookie {
  private readonly _name: string;
  private readonly _value: string;
  private _attributes = new Map<CookieAttribute, string | undefined>();

  get name(): string {
    return this._name;
  }

  get value(): string {
    return this._value;
  }

  get httpOnly(): boolean {
    return this._attributes.has(CookieAttribute.HTTPONLY);
  }

  get secure(): boolean {
    return this._attributes.has(CookieAttribute.SECURE);
  }

  get sameSite(): 'Strict' | 'Lax' | 'None' | undefined {
    return this._attributes.get(CookieAttribute.SAMESITE) as Samesite;
  }

  get session(): boolean | undefined {
    return !(
      this._attributes.has(CookieAttribute.EXPIRES) ||
      this._attributes.has(CookieAttribute.MAXAGE)
    );
  }

  get path(): string | undefined {
    return this._attributes.get(CookieAttribute.PATH);
  }

  get port(): string | undefined {
    return this._attributes.get(CookieAttribute.PORT);
  }

  get domain(): string | undefined {
    return this._attributes.get(CookieAttribute.DOMAIN);
  }

  get expires(): string | undefined {
    return this._attributes.get(CookieAttribute.EXPIRES);
  }

  get maxAge(): number | undefined {
    const maxAge: string = this._attributes.get(CookieAttribute.MAXAGE) ?? '';

    return isNaN(+maxAge) ? undefined : +maxAge;
  }

  get url(): string {
    return (this.secure ? 'https://' : 'http://') + this.domain + this.path;
  }

  constructor(name: string, value: string) {
    this._name = name;
    this._value = value;
  }

  public expiresDate(requestDate: Date = new Date()): Date | undefined {
    if (this.maxAge) {
      return new Date(requestDate.getTime() + 1000 * this.maxAge);
    }

    if (this.expires) {
      return new Date(this.expires);
    }

    return undefined;
  }

  public addAttribute(key: string, value?: string): void {
    this._attributes.set(key.toLowerCase() as CookieAttribute, value);
  }
}

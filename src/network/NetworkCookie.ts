enum CookieAttribute {
  Name = 'name',
  Value = 'value',
  Size = 'size',
  Domain = 'domain',
  Port = 'port',
  Path = 'path',
  Expires = 'expires',
  HttpOnly = 'httponly',
  Secure = 'secure',
  SameSite = 'samesite',
  MaxAge = 'max-age'
}

export class NetworkCookie {
  private readonly _name: string;
  private readonly _value: string;
  private _attributes: Map<CookieAttribute, string> = new Map<
    CookieAttribute,
    string
  >();

  private _size: number = 0;

  get size(): number {
    return this._size;
  }

  set size(size: number) {
    this._size = size;
  }

  get name(): string {
    return this._name;
  }

  get value(): string {
    return this._value;
  }

  get httpOnly(): boolean {
    return this._attributes.has(CookieAttribute.HttpOnly);
  }

  get secure(): boolean {
    return this._attributes.has(CookieAttribute.Secure);
  }

  get sameSite(): 'Strict' | 'Lax' | 'None' | undefined {
    return this._attributes.get(CookieAttribute.SameSite) as any;
  }

  get session(): boolean | undefined {
    return !(
      this._attributes.has(CookieAttribute.Expires) ||
      this._attributes.has(CookieAttribute.MaxAge)
    );
  }

  get path(): string | undefined {
    return this._attributes.get(CookieAttribute.Path);
  }

  get port(): string | undefined {
    return this._attributes.get(CookieAttribute.Port);
  }

  get domain(): string | undefined {
    return this._attributes.get(CookieAttribute.Domain);
  }

  get expires(): string {
    return this._attributes.get(CookieAttribute.Expires);
  }

  get maxAge(): number {
    const maxAge: string | undefined = this._attributes.get(
      CookieAttribute.MaxAge
    );

    return isNaN(+maxAge) ? undefined : +maxAge;
  }

  get url(): string {
    return (this.secure ? 'https://' : 'http://') + this.domain + this.path;
  }

  constructor(name: string, value: string) {
    this._name = name;
    this._value = value;
  }

  public expiresDate(requestDate: Date): Date | undefined {
    if (this.maxAge) {
      const targetDate = requestDate === null ? new Date() : requestDate;

      return new Date(targetDate.getTime() + 1000 * this.maxAge);
    }

    if (this.expires) {
      return new Date(this.expires);
    }

    return;
  }

  public addAttribute(key: string, value: string): void {
    this._attributes[key.toLowerCase()] = value;
  }
}

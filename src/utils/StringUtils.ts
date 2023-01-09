export class StringUtils {
  public static normalizeName(
    path: string,
    options?: { ext?: string }
  ): string {
    const fileNameIdx =
      path.indexOf('\\') >= 0 ? path.lastIndexOf('\\') : path.lastIndexOf('/');
    let name = path.substring(fileNameIdx);

    if (name.indexOf('\\') === 0 || name.indexOf('/') === 0) {
      name = name.substring(1);
    }

    const extIdx = name.lastIndexOf('.');

    let ext: string | undefined;
    let nameWithoutExt = name;

    if (extIdx >= 0) {
      ext = options?.ext ?? name.substring(extIdx);
      nameWithoutExt = name.substring(0, extIdx);
    }

    return `${nameWithoutExt}${ext ?? '.har'}`;
  }

  public static escapeCharacters(
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
}

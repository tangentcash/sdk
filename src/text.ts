export class TextUtil {
  static findFirstNotOf(data: string, alphabet: string, offset: number = 0) {
    for (let i = offset; i < data.length; ++i) {
        if (alphabet.indexOf(data[i]) == -1)
            return i;
    }
    return -1;
  }
  static isHexEncoding(data: string, strict: boolean = false) {
    if (!data.length || data.length % 2 != 0)
      return false;

    let prefix = data.length >= 2 && data[0] == '0' && data[1] == 'x';
    if (strict && !prefix)
      return false;

    return this.findFirstNotOf(prefix ? data.substring(2) : data, strict ? '0123456789abcdef' : '0123456789abcdefABCDEF') == -1;
  }
  static isAsciiEncoding(data: string) { 
    return /^[\x00-\x7F]*$/.test(data);
  }
}
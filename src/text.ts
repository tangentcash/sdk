export class TextUtil {
  static alphabet: string = '0123456789abcdefABCDEF';
  
  static findFirstNotOf(data: string, alphabet: string, offset: number = 0) {
    for (let i = offset; i < data.length; ++i) {
        if (alphabet.indexOf(data[i]) == -1)
            return i;
    }
    return -1;
  }
  static isHexEncoding(data: string) {
    if (!data.length || data.length % 2 != 0)
      return false;

    let text = (data.length < 2 || data[0] != '0' || data[1] != 'x' ? data : data.substring(2));
    return this.findFirstNotOf(text, this.alphabet) == -1;
  }
  static isAsciiEncoding(data: string) { 
    return /^[\x00-\x7F]*$/.test(data);
  }
}
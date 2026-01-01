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
  static toValue(prevValue: string, nextValue: string): string {
    try {
      if (!nextValue.length)
        return nextValue;

      let value = nextValue.trim();
      if (value.endsWith('.'))
        value += '0';

      const numeric = new BigNumber(value, 10);
      if (numeric.isLessThan(0) || numeric.isNaN() || !numeric.isFinite())
        throw false;

      return nextValue;
    } catch {
      return prevValue;
    }
  }
  static toValueOrPercent(prevValue: string, nextValue: string): string {
    if (nextValue.indexOf('%') == -1)
      return this.toValue(prevValue, nextValue);
    
    return this.toValue(prevValue.replace(/%/g, ''), nextValue.replace(/%/g, '')) + '%';
  }
  static toPercent(prevValue: string, nextValue: string): string {
    if (!nextValue.length)
      return '';

    return this.toValue(prevValue.replace(/%/g, ''), nextValue.replace(/%/g, '')) + '%';
  }
  static toNumericValue(value: string): BigNumber {
    return new BigNumber(value.length > 0 ? value.replace(/%/g, '') : 0);
  }
  static toNumericValueOrPercent(value: string): { relative: BigNumber | null, absolute: BigNumber | null, value: BigNumber } {
    const isAbsolute = value.indexOf('%') == -1;
    const result = isAbsolute ? this.toNumericValue(value) : this.toNumericValue(value).dividedBy(100);
    return {
      relative: isAbsolute ? null : result,
      absolute: isAbsolute ? result : null,
      value: result
    }
  }
}
import { AssetId, ByteUtil, Hashing } from "./algorithm"; import { Transactions } from "./schema";
import Assets from './assets.json';
import BigNumber from "bignumber.js";

export function lerp(a: number, b: number, t: number): number {
  return a * (1 - t) + b * t;
}

export class Readability {
  static subscripts: Record<string, string> = {
    '0': '₀',
    '1': '₁',
    '2': '₂',
    '3': '₃',
    '4': '₄',
    '5': '₅',
    '6': '₆',
    '7': '₇',
    '8': '₉',
    '9': '₉'
  };
  static prefixes: Record<string, string> = {
    "USD": "$",
    "BTC": "₿"
  };

  static toAssetQuery(asset: AssetId): string {
    const token: string | null = asset.token || null;
    const chain: string = asset.chain || 'Unknown';
    const name: string | null = (Assets as Record<string, string>)[token?.toUpperCase() || chain?.toUpperCase()];
    return name ? name + ' ' + (token || chain) : (token || chain);
  }
  static toAssetSymbol(asset: AssetId): string {
    return asset.token || asset.chain || '?';
  }
  static toAssetFallback(asset: AssetId): string {
    return this.toAssetSymbol(asset).substring(0, 3);
  }
  static toAssetImage(asset: AssetId): string {
    const target = this.toAssetSymbol(asset);
    return target.length > 0 && target != '?' ? '/cryptocurrency/' + target.toLowerCase() + '.svg' : '';
  }
  static toAssetName(asset: AssetId, chainOnly?: boolean): string {
    const token: string | null = chainOnly ? null : asset.token || null;
    const chain: string = asset.chain || 'Unknown';
    if (token != null)
      return chain + ' ' + ((Assets as Record<string, string>)[token.toUpperCase()] || token);

    return (Assets as Record<string, string>)[chain.toUpperCase()] || chain;
  }
  static toTaggedAddress(tagAddress: string): { address: string, tag: string | null } {
    const [address, tag] = tagAddress.split('#');
    return { address: address, tag: tag || null };
  }
  static toTransactionType(type: string | number): string {
    if (typeof type == 'string')
      return Transactions.typenames[type] || 'Non-standard';

    for (let name in Transactions.typenames) {
      if (Hashing.hash32(ByteUtil.byteStringToUint8Array(name)) == type) {
        return Transactions.typenames[name];
      }
    }

    return 'Non-standard';
  }
  static toFunction(method: string): string {
    let start = method.indexOf(' ');
    if (start != -1) {
      while (start + 1 < method.length && !method[start].trim().length)
        ++start;
      
      let end = method.indexOf('(', start);
      if (end != -1) {
        method = method.substring(start, end);
      }
    }

    return method;
  }
  static toFunctionName(method: string): string {
    method = this.toFunction(method)
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
        .replace(/([a-z\d])([A-Z])/g, '$1 $2')
        .replace(/_/g, ' ')
        .trim().toLowerCase();
    return method.length > 0 ? method[0].toUpperCase() + method.substring(1) : '';
  }
  static toSubscript(value: string): string {
    let result = '';
    for (let i = 0; i < value.length; i++) {
      const char = (this.subscripts as any)[value[i] as any];
      if (typeof char == 'string')
        result += char;
    }
    return result;
  }
  static toValue(asset: AssetId | null, value: string | number | BigNumber | null, delta: boolean, trailing: boolean): string {
    if (value == null)
      return 'N/A';

    const numeric: BigNumber = new BigNumber(BigNumber.isBigNumber(value) ? value.toPrecision(12) : value);
    if (numeric.isNaN())
      return 'N/A';

    const places = numeric.decimalPlaces();
    const text: string[] = (places ? numeric.toFormat(places) : ByteUtil.bigNumberToString(numeric)).split('.');
    if (trailing && text.length < 2)
      text.push('0');
    
    if (text.length > 1) {
      let length = 0;
      while (text[1][length] == '0')
        ++length;
      
      if (length >= 3) {
        const zeros = length.toString();
        text[1] = '0' + this.toSubscript(zeros) + text[1].substring(length, length + 6);
      } else {
        text[1] = text[1].substring(0, Math.min(6, text[1].length));
      }
    }
    
    let symbol = asset ? this.toAssetSymbol(asset) : null;
    let result = text[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (text.length > 1 ? '.' + text[1] : '');
    if (symbol != null) {
      const prefix = this.prefixes[symbol];
      if (prefix != null) {
        result = result[0] == '-' ? ('-' + prefix + result.substring(1)) : (prefix + result);
      } else {
        result += ' ' + symbol;
      }
    }
    return delta ? ((numeric.gt(0) ? '+' : '') + result) : result;
  }
  static toMoney(asset: AssetId | null, value: string | number | BigNumber | null, delta?: boolean): string {
    return this.toValue(asset, value, delta || false, true);
  }
  static toUnit(value: string | number | BigNumber | null, delta?: boolean): string {
    if (value == null)
      return 'N/A';

    const numeric: BigNumber = BigNumber.isBigNumber(value) ? value : new BigNumber(value);
    const asset = new AssetId();
    asset.chain = numeric.eq(1) ? 'unit' : 'units';
    return this.toValue(asset, numeric, delta || false, false);
  }
  static toGas(value: string | number | BigNumber | null, delta?: boolean): string {
    if (value == null)
      return 'N/A';

    const numeric: BigNumber = BigNumber.isBigNumber(value) ? value : new BigNumber(value);
    const asset = new AssetId();
    asset.chain = numeric.eq(1) ? 'gas unit' : 'gas units';
    return this.toValue(asset, numeric, delta || false, false);
  }
  static toTimespan(value: string | number | BigNumber | null, delta?: boolean): string {
    if (value == null)
      return 'N/A';

    const numeric: BigNumber = BigNumber.isBigNumber(value) ? value : new BigNumber(value);
    const seconds = numeric.gte(1000);
    const asset = new AssetId();
    asset.chain = seconds ? 'sec.' : 'ms';
    return this.toValue(asset, seconds ? numeric.dividedBy(1000) : numeric, delta || false, false);
  }
  static toTimePassed(time: Date): string {
    const diffInSeconds = Math.floor((new Date().getTime() - time.getTime()) / 1000);
    const seconds = diffInSeconds % 60;
    const minutes = Math.floor(diffInSeconds / 60) % 60;
    const hours = Math.floor(diffInSeconds / 3600) % 24;
    const days = Math.floor(diffInSeconds / 86400);
    if (days > 0) {
      return `${days} day${days !== 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else if (minutes > 0) {
      return `${minutes} min.`;
    } else {
      return `${seconds} sec.`;
    }
  }
  static toCount(name: string, value: string | number | BigNumber | null, delta?: boolean): string {
    if (value == null)
      return 'N/A';

    const numeric: BigNumber = BigNumber.isBigNumber(value) ? value : new BigNumber(value);
    const asset = new AssetId();
    asset.chain = numeric.eq(1) ? name : (name + 's');
    return this.toValue(asset, numeric, delta || false, false);
  }
  static toHash(value?: string, size?: number): string {
    if (!value)
      return 'N/A';

    return value.length <= (size || 16) ? value : (value.substring(0, size || 16) + '...' + value.substring(value.length - (size || 16)));
  }
  static toAddress(value?: string, size?: number): string {
    if (!value)
      return 'N/A';
    
    return value.length <= (size || 8) ? value : (value.substring(0, size || 8) + '...' + value.substring(value.length - (size || 8)));
  }
  static toPercentageDelta(prevValue: string | number | BigNumber, nextValue: string | number | BigNumber): string {
    const delta = this.toPercentageDeltaNumber(prevValue, nextValue);
    return (delta.gt(0) ? '+' : '') + delta.toFixed(2) + '%';
  }
  static toPercentageDeltaNumber(prevValue: string | number | BigNumber, nextValue: string | number | BigNumber): BigNumber {
    const prevNumeric: BigNumber = BigNumber.isBigNumber(prevValue) ? prevValue : new BigNumber(prevValue);
    const nextNumeric: BigNumber = BigNumber.isBigNumber(nextValue) ? nextValue : new BigNumber(nextValue);
    return prevNumeric.gt(0) ? nextNumeric.minus(prevNumeric).dividedBy(prevNumeric).multipliedBy(100) : new BigNumber(0);
  }
}
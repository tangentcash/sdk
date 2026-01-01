import BigNumber from "bignumber.js";
export declare class TextUtil {
    static findFirstNotOf(data: string, alphabet: string, offset?: number): number;
    static isHexEncoding(data: string, strict?: boolean): boolean;
    static isAsciiEncoding(data: string): boolean;
    static toValue(prevValue: string, nextValue: string): string;
    static toValueOrPercent(prevValue: string, nextValue: string): string;
    static toPercent(prevValue: string, nextValue: string): string;
    static toNumericValue(value: string): BigNumber;
    static toNumericValueOrPercent(value: string): {
        relative: BigNumber | null;
        absolute: BigNumber | null;
        value: BigNumber;
    };
}

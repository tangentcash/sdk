import { AssetId } from "./algorithm";
import BigNumber from "bignumber.js";
export declare function lerp(a: number, b: number, t: number): number;
export declare class Readability {
    static subscripts: {
        '0': string;
        '1': string;
        '2': string;
        '3': string;
        '4': string;
        '5': string;
        '6': string;
        '7': string;
        '8': string;
        '9': string;
    };
    static toAssetQuery(asset: AssetId): string;
    static toAssetSymbol(asset: AssetId): string;
    static toAssetFallback(asset: AssetId): string;
    static toAssetImage(asset: AssetId): string;
    static toAssetName(asset: AssetId, chainOnly?: boolean): string;
    static toAddressIndex(index?: BigNumber): string;
    static toTransactionType(type: string | number): string;
    static toFunctionName(method: string): string;
    static toSubscript(value: string): string;
    static toValue(asset: AssetId | null, value: string | number | BigNumber | null, delta: boolean, trailing: boolean): string;
    static toMoney(asset: AssetId | null, value: string | number | BigNumber | null, delta?: boolean): string;
    static toUnit(value: string | number | BigNumber | null, delta?: boolean): string;
    static toGas(value: string | number | BigNumber | null, delta?: boolean): string;
    static toTimespan(value: string | number | BigNumber | null, delta?: boolean): string;
    static toTimePassed(time: Date): string;
    static toCount(name: string, value: string | number | BigNumber | null, delta?: boolean): string;
    static toHash(value?: string, size?: number): string;
    static toAddress(value?: string, size?: number): string;
    static toPercentageDelta(prevValue: string | number | BigNumber, nextValue: string | number | BigNumber): string;
    static toPercentageDeltaNumber(prevValue: string | number | BigNumber, nextValue: string | number | BigNumber): BigNumber;
}

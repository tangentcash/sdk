import { Uint256 } from "./algorithm";
import BigNumber from "bignumber.js";
export declare enum Viewable {
    DecimalNaN = 0,
    DecimalZero = 1,
    DecimalNeg1 = 2,
    DecimalNeg2 = 3,
    DecimalPos1 = 4,
    DecimalPos2 = 5,
    True = 6,
    False = 7,
    UintMin = 8,
    UintMax = 40,
    StringAny10 = 41,
    StringMin10 = 42,
    StringMax10 = 146,
    StringAny16 = 147,
    StringMin16 = 148,
    StringMax16 = 252,
    Invalid = 255
}
export declare class Stream {
    data: Uint8Array;
    checksum: Uint256 | null;
    seek: number;
    constructor(data?: Uint8Array);
    clear(): Stream;
    rewind(offset?: number): Stream;
    writeString(value: string): Stream;
    writeBinaryString(value: Uint8Array): Stream;
    writeBinaryStringOptimized(value: Uint8Array): Stream;
    writeDecimal(value: BigNumber): Stream;
    writeInteger(value: Uint256 | number): Stream;
    writeBoolean(value: boolean): Stream;
    writeTypeslessInteger(value: Uint256): Stream;
    writeTypesless(value: Uint8Array): Stream;
    readType(): Viewable | null;
    readString(type: Viewable): string | null;
    readBinaryString(type: Viewable): Uint8Array | null;
    readDecimal(type: Viewable): BigNumber | null;
    readInteger(type: Viewable): Uint256 | null;
    readSafeInteger(type: Viewable): Uint256 | number | null;
    readBoolean(type: Viewable): boolean | null;
    isEof(): boolean;
    encode(): string;
    hash(renew?: boolean): Uint256;
    private write;
    private read;
    static decode(data: string): Stream;
}
export declare class StreamUtil {
    static isInteger(type: Viewable): boolean;
    static isString(type: Viewable): boolean;
    static isString10(type: Viewable): boolean;
    static isString16(type: Viewable): boolean;
    static getIntegerSize(type: Viewable): number;
    static getIntegerType(data: Uint256): Viewable;
    static getStringType(data: string | Uint8Array, hexEncoding: boolean): Viewable;
    static getStringSize(type: Viewable): number;
    static getMaxStringSize(): number;
}
export declare class SchemaUtil {
    static UINT08_MAX: Uint256;
    static UINT16_MAX: Uint256;
    static UINT32_MAX: Uint256;
    static UINT64_MAX: Uint256;
    static UINT128_MAX: Uint256;
    static store(stream: Stream, object: any, schema: any): void;
    static load(stream: Stream, schema: any): any;
    static array(stream: Stream): any[];
}

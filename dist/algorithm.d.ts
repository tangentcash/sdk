import BigNumber from 'bignumber.js';
export type ChainParams = {
    NAME: string;
    SECKEY_VERSION: number;
    SECKEY_PREFIX: string;
    PUBKEY_VERSION: number;
    PUBKEY_PREFIX: string;
    ADDRESS_VERSION: number;
    ADDRESS_PREFIX: string;
    PRODUCTION_COMMITTEE: number;
    PARTICIPATION_COMMITTEE: [number, number];
    MESSAGE_MAGIC: number;
};
export declare class Chain {
    static mainnet: ChainParams;
    static testnet: ChainParams;
    static regtest: ChainParams;
    static size: {
        SIGHASH: number;
        RECSIGHASH: number;
        SECKEY: number;
        PUBKEY: number;
        PUBKEYHASH: number;
        SUBPUBKEYHASH: number;
        ASSETID: number;
        MESSAGE: number;
    };
    static props: ChainParams;
}
export declare class Uint256 {
    private value;
    constructor(value?: number | string | Uint8Array | Uint256, radix?: number);
    compareTo(rval: number | Uint256): number;
    subtract(rval: number | Uint256, mutate?: boolean): Uint256;
    divideAndRemainder(rval: number | Uint256): Uint256[];
    divide(rval: number | Uint256, mutate?: boolean): Uint256;
    multiply(rval: number | Uint256, mutate?: boolean): Uint256;
    remainder(rval: number | Uint256, mutate?: boolean): Uint256;
    shiftRight(shift: number, mutate?: boolean): Uint256;
    shiftLeft(shift: number, mutate?: boolean): Uint256;
    mutable(mutable?: boolean): Uint256;
    pow(rval: number, mutate?: boolean): Uint256;
    add(rval: Uint256 | number, mutate?: boolean): Uint256;
    safeAdd(rval: Uint256 | number, mutate?: boolean): Uint256;
    gcd(rval: Uint256, mutate?: boolean): Uint256;
    sub(rval: Uint256 | number, mutate?: boolean): Uint256;
    safeSub(rval: Uint256 | number, mutate?: boolean): Uint256;
    divmod(rval: Uint256 | number): Uint256[];
    div(rval: Uint256 | number, mutate?: boolean): Uint256;
    mod(rval: Uint256 | number, mutate?: boolean): Uint256;
    mul(rval: Uint256 | number, mutate?: boolean): Uint256;
    safeMul(rval: Uint256 | number, mutate?: boolean): Uint256;
    and(rval: Uint256 | number, mutate?: boolean): Uint256;
    andNot(rval: Uint256 | number, mutate?: boolean): Uint256;
    or(rval: Uint256 | number, mutate?: boolean): Uint256;
    xor(rval: Uint256 | number, mutate?: boolean): Uint256;
    not(mutate?: boolean): Uint256;
    shl(shift: number, mutate?: boolean): Uint256;
    shr(shift: number, mutate?: boolean): Uint256;
    eq(rval: Uint256 | number): boolean;
    neq(rval: Uint256 | number): boolean;
    cmp(rval: Uint256 | number): number;
    lte(rval: Uint256 | number): boolean;
    lt(rval: Uint256 | number): boolean;
    gte(rval: Uint256 | number): boolean;
    gt(rval: Uint256 | number): boolean;
    copy(): Uint256;
    valueOf(): number;
    toSafeInteger(): Uint256 | number;
    toInteger(): number;
    toString(radix?: number): string;
    toHex(): string;
    toCompactHex(): string;
    toJSON(): string;
    toUint8Array(): Uint8Array;
    testBit(n: number): boolean;
    setBit(n: number, mutate?: boolean): Uint256;
    flipBit(n: number, mutate?: boolean): Uint256;
    clearBit(n: number, mutate?: boolean): Uint256;
    byteCount(): number;
    isSafeInteger(): boolean;
    negate(mutate?: boolean): Uint256;
    min(rval: Uint256 | number, mutate?: boolean): Uint256;
    max(rval: Uint256 | number, mutate?: boolean): Uint256;
}
export declare class Recsighash {
    data: Uint8Array;
    constructor(data?: string | Uint8Array);
    equals(value: Recsighash): boolean;
}
export declare class Seckey {
    data: Uint8Array;
    constructor(data?: string | Uint8Array);
    equals(value: Seckey): boolean;
}
export declare class Pubkey {
    data: Uint8Array;
    constructor(data?: string | Uint8Array);
    equals(value: Pubkey): boolean;
}
export declare class Pubkeyhash {
    data: Uint8Array;
    constructor(data?: string | Uint8Array);
    equals(value: Pubkeyhash): boolean;
}
export declare class Subpubkeyhash {
    data: Uint8Array;
    constructor(data?: string | Uint8Array);
    equals(value: Pubkeyhash): boolean;
}
export declare class AssetId {
    id: number | string;
    handle: string;
    chain: string | null;
    token: string | null;
    checksum: string | null;
    constructor(data?: number | string | BigNumber | Uint8Array);
    equals(value: AssetId): boolean;
    toUint8Array(): Uint8Array;
    toUint256(): Uint256;
    toHex(): string;
    isValid(): boolean;
    static fromHandle(chain: string, token?: string, contractAddress?: string): AssetId;
}
export declare class Segwit {
    static tweak(outputBits: number, input: Uint8Array, inputBits: number, padding: number): Uint8Array | null;
    static encode(prefix: string, version: number, program: Uint8Array): string | null;
    static decode(prefix: string, address: string): {
        program: Uint8Array;
        version: number;
    } | null;
}
export declare class Signing {
    static messageHash(signableMessage: string): Uint256;
    static mnemonicgen(strength?: number): string;
    static keygen(): Seckey;
    static recover(hash: Uint256, signature: Recsighash): Pubkey | null;
    static recoverHash(hash: Uint256, signature: Recsighash): Pubkeyhash | null;
    static sign(hash: Uint256, secretKey: Seckey): Recsighash | null;
    static verify(hash: Uint256, publicKey: Pubkey, signature: Recsighash): boolean;
    static verifyMnemonic(mnemonic: string): boolean;
    static verifySecretKey(secretKey: Seckey): boolean;
    static verifyPublicKey(publicKey: Pubkey): boolean;
    static verifyAddress(address: string): boolean;
    static deriveSecretKeyFromMnemonic(mnemonic: string): Seckey | null;
    static deriveSecretKey(seed: Uint8Array): Seckey;
    static derivePublicKey(secretKey: Seckey): Pubkey;
    static derivePublicKeyHash(publicKey: Pubkey): Pubkeyhash;
    static deriveCipherKeypair(secretKey: Seckey, nonce: Uint256): Promise<{
        cipherSecretKey: Seckey;
        cipherPublicKey: Pubkey;
    } | null>;
    static publicEncrypt(cipherPublicKey: Pubkey, plaintext: Uint8Array, entropy: Uint8Array): Promise<Uint8Array | null>;
    static privateDecrypt(cipherSecretKey: Seckey, cipherPublicKey: Pubkey, ciphertext: Uint8Array): Promise<Uint8Array | null>;
    static decodeSecretKey(value: string): Seckey | null;
    static encodeSecretKey(secretKey: Seckey): string | null;
    static decodePublicKey(value: string): Pubkey | null;
    static encodePublicKey(publicKey: Pubkey): string | null;
    static decodeAddress(value: string): Pubkeyhash | null;
    static decodeSubaddress(value: string): Subpubkeyhash | null;
    static encodeAddress(publicKeyHash: Pubkeyhash): string | null;
    static encodeSubaddress(publicKeyHash: Pubkeyhash, derivationHash?: Pubkeyhash): string | null;
    static baseAddressOf(address: string): string | null;
    static maskAddressOf(address: string, derivation: string | null): Subpubkeyhash | null;
    static derivationHashOf(data: Uint8Array): Pubkeyhash;
}
export declare class Hashing {
    static hash32(data: Uint8Array): number;
    static hash160(data: Uint8Array): Uint8Array;
    static hash256(data: Uint8Array): Uint8Array;
    static hash512(data: Uint8Array): Uint8Array;
}
export declare class ByteUtil {
    static hexStringToUint8Array(data: string): Uint8Array;
    static utf8StringToUint8Array(data: string): Uint8Array;
    static byteStringToUint8Array(data: string): Uint8Array;
    static uint8ArrayToHexString(data: Uint8Array): string;
    static uint8ArrayToByteString(data: Uint8Array): string;
    static uint8ArrayToUtf8String(data: Uint8Array): string;
    static uint8ArrayCompare(a: Uint8Array, b: Uint8Array): boolean;
    static uint8ArraySwapEndianness(data: Uint8Array): Uint8Array;
}

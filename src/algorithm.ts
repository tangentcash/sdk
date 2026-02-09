import secp256k1 from 'secp256k1';
import sodium from 'libsodium-wrappers';
import * as bip39 from '@scure/bip39';
import { Base64 } from 'js-base64';
import { wordlist } from '@scure/bip39/wordlists/english';
import { randomBytes } from '@ethersproject/random';
import { UInt256 } from '@radixdlt/uint256';
import { bech32m } from 'bech32';
import { sha1 } from '@noble/hashes/sha1';
import { sha3_512 } from '@noble/hashes/sha3';
import { blake2b } from '@noble/hashes/blake2b';
import { ripemd160 } from '@noble/hashes/ripemd160';
import { TextUtil } from './text';
import BigNumber from 'bignumber.js';

export type ChainParams = {
  NAME: string,
  SECKEY_VERSION: number,
  SECKEY_PREFIX: string,
  PUBKEY_VERSION: number,
  PUBKEY_PREFIX: string,
  ADDRESS_VERSION: number,
  ADDRESS_PREFIX: string,
  MESSAGE_MAGIC: number
}

export class Chain {
  static mainnet: ChainParams = {
    NAME: 'mainnet',
    SECKEY_VERSION: 0xF,
    SECKEY_PREFIX: 'sec',
    PUBKEY_VERSION: 0xE,
    PUBKEY_PREFIX: 'pub',
    ADDRESS_VERSION: 0x4,
    ADDRESS_PREFIX: 'tc',
    MESSAGE_MAGIC: 0x73d308e9
  };
  static testnet: ChainParams = {
    NAME: 'testnet',
    SECKEY_VERSION: 0xE,
    SECKEY_PREFIX: 'sect',
    PUBKEY_VERSION: 0xD,
    PUBKEY_PREFIX: 'pubt',
    ADDRESS_VERSION: 0x5,
    ADDRESS_PREFIX: 'tct',
    MESSAGE_MAGIC: 0x73d308e9
  };
  static regtest: ChainParams = {
    NAME: 'regtest',
    SECKEY_VERSION: 0xD,
    SECKEY_PREFIX: 'secrt',
    PUBKEY_VERSION: 0xC,
    PUBKEY_PREFIX: 'pubrt',
    ADDRESS_VERSION: 0x6,
    ADDRESS_PREFIX: 'tcrt',
    MESSAGE_MAGIC: 0x73d308e9
  };
  static policy = {
    TOKEN_NAME: 'TAN',
    PRODUCTION_COMMITTEE: 12,
    PARTICIPATION_COMMITTEE: [5, 23],
  };
  static size = {
    HASHSIG: 65,
    SECKEY: 32,
    PUBKEY: 33,
    PUBKEYHASH: 20,
    ASSETID: 32,
    MESSAGE: 0xffffff
  }
  static props: ChainParams = this.mainnet;
}

export class Uint256 {
  private value: UInt256;
  
  constructor(value?: number | string | Uint8Array | Uint256, radix?: number) {
    if (value != null) {
      if (value instanceof Uint8Array) {
        value = ByteUtil.uint8ArrayToHexString(value);
      }

      if (value instanceof Uint256)
        this.value = new UInt256(value.value);
      else if (typeof value == 'string')
        this.value = new UInt256(value, radix);
      else if (typeof value == 'number')
        this.value = new UInt256(value);
      else
        this.value = new UInt256();
    }
    else
      this.value = new UInt256();
  }
  compareTo(rval: number | Uint256): number {
    return this.value.compareTo(rval instanceof Uint256 ? rval.value : rval);
  }
  subtract(rval: number | Uint256, mutate?: boolean): Uint256 {
    const result = new Uint256();
    result.value = this.value.subtract(rval instanceof Uint256 ? rval.value : rval, mutate);
    return result;
  }
  divideAndRemainder(rval: number | Uint256): Uint256[] {
    return this.value.divideAndRemainder(rval instanceof Uint256 ? rval.value : rval).map((value) => {
      const result = new Uint256();
      result.value = value;
      return result;
    });
  }
  divide(rval: number | Uint256, mutate?: boolean): Uint256 {
    const result = new Uint256();
    result.value = this.value.divide(rval instanceof Uint256 ? rval.value : rval, mutate);
    return result;
  }
  multiply(rval: number | Uint256, mutate?: boolean): Uint256 {
    const result = new Uint256();
    result.value = this.value.multiply(rval instanceof Uint256 ? rval.value : rval, mutate);
    return result;
  }
  remainder(rval: number | Uint256, mutate?: boolean): Uint256 {
    const result = new Uint256();
    result.value = this.value.remainder(rval instanceof Uint256 ? rval.value : rval, mutate);
    return result;
  }
  shiftRight(shift: number, mutate?: boolean): Uint256 {
    const result = new Uint256();
    result.value = this.value.shiftRight(shift, mutate);
    return result;
  }
  shiftLeft(shift: number, mutate?: boolean): Uint256 {
    const result = new Uint256();
    result.value = this.value.shiftLeft(shift, mutate);
    return result;
  }
  mutable(mutable?: boolean): Uint256 {
    const result = new Uint256();
    result.value = this.value.mutable(mutable);
    return result;
  }
  pow(rval: number, mutate?: boolean): Uint256 {
    const result = new Uint256();
    result.value = this.value.pow(rval, mutate);
    return result;
  }
  add(rval: Uint256 | number, mutate?: boolean): Uint256 {
    const result = new Uint256();
    result.value = this.value.add(rval instanceof Uint256 ? rval.value : rval, mutate);
    return result;
  }
  safeAdd(rval: Uint256 | number, mutate?: boolean): Uint256 {
    const result = new Uint256();
    result.value = this.value.safeAdd(rval instanceof Uint256 ? rval.value : rval, mutate);
    return result;
  }
  gcd(rval: Uint256, mutate?: boolean): Uint256 {
    const result = new Uint256();
    result.value = this.value.gcd(rval instanceof Uint256 ? rval.value : rval, mutate);
    return result;
  }
  sub(rval: Uint256 | number, mutate?: boolean): Uint256 {
    const result = new Uint256();
    result.value = this.value.sub(rval instanceof Uint256 ? rval.value : rval, mutate);
    return result;
  }
  safeSub(rval: Uint256 | number, mutate?: boolean): Uint256 {
    const result = new Uint256();
    result.value = this.value.safeSub(rval instanceof Uint256 ? rval.value : rval, mutate);
    return result;
  }
  divmod(rval: Uint256 | number): Uint256[] {
    return this.value.divmod(rval instanceof Uint256 ? rval.value : rval).map((value) => {
      const result = new Uint256();
      result.value = value;
      return result;
    });
  }
  div(rval: Uint256 | number, mutate?: boolean): Uint256 {
    const result = new Uint256();
    result.value = this.value.div(rval instanceof Uint256 ? rval.value : rval, mutate);
    return result;
  }
  mod(rval: Uint256 | number, mutate?: boolean): Uint256 {
    const result = new Uint256();
    result.value = this.value.mod(rval instanceof Uint256 ? rval.value : rval, mutate);
    return result;
  }
  mul(rval: Uint256 | number, mutate?: boolean): Uint256 {
    const result = new Uint256();
    result.value = this.value.mul(rval instanceof Uint256 ? rval.value : rval, mutate);
    return result;
  }
  safeMul(rval: Uint256 | number, mutate?: boolean): Uint256 {
    const result = new Uint256();
    result.value = this.value.safeMul(rval instanceof Uint256 ? rval.value : rval, mutate);
    return result;
  }
  and(rval: Uint256 | number, mutate?: boolean): Uint256 {
    const result = new Uint256();
    result.value = this.value.and(rval instanceof Uint256 ? rval.value : rval, mutate);
    return result;
  }
  andNot(rval: Uint256 | number, mutate?: boolean): Uint256 {
    const result = new Uint256();
    result.value = this.value.andNot(rval instanceof Uint256 ? rval.value : rval, mutate);
    return result;
  }
  or(rval: Uint256 | number, mutate?: boolean): Uint256 {
    const result = new Uint256();
    result.value = this.value.or(rval instanceof Uint256 ? rval.value : rval, mutate);
    return result;
  }
  xor(rval: Uint256 | number, mutate?: boolean): Uint256 {
    const result = new Uint256();
    result.value = this.value.xor(rval instanceof Uint256 ? rval.value : rval, mutate);
    return result;
  }
  not(mutate?: boolean): Uint256 {
    const result = new Uint256();
    result.value = this.value.not(mutate);
    return result;
  }
  shl(shift: number, mutate?: boolean): Uint256 {
    const result = new Uint256();
    result.value = this.value.shl(shift, mutate);
    return result;
  }
  shr(shift: number, mutate?: boolean): Uint256 {
    const result = new Uint256();
    result.value = this.value.shr(shift, mutate);
    return result;
  }
  eq(rval: Uint256 | number): boolean {
    return this.value.eq(rval instanceof Uint256 ? rval.value : rval);
  }
  neq(rval: Uint256 | number): boolean {
    return this.value.neq(rval instanceof Uint256 ? rval.value : rval);
  }
  cmp(rval: Uint256 | number): number {
    return this.value.cmp(rval instanceof Uint256 ? rval.value : rval);
  }
  lte(rval: Uint256 | number): boolean {
    return this.value.lte(rval instanceof Uint256 ? rval.value : rval);
  }
  lt(rval: Uint256 | number): boolean {
    return this.value.lt(rval instanceof Uint256 ? rval.value : rval);
  }
  gte(rval: Uint256 | number): boolean {
    return this.value.gte(rval instanceof Uint256 ? rval.value : rval);
  }
  gt(rval: Uint256 | number): boolean {
    return this.value.gt(rval instanceof Uint256 ? rval.value : rval);
  }
  copy(): Uint256 {
    const result = new Uint256();
    result.value = this.value.copy();
    return result;
  }
  valueOf(): number {
    return this.value.valueOf();
  }
  toSafeInteger(): Uint256 | number {
    return this.isSafeInteger() ? this.valueOf() : this;
  }
  toInteger(): number {
    return this.isSafeInteger() ? this.valueOf() : Number.MAX_SAFE_INTEGER;
  }
  toString(radix?: number): string {
    return (radix == 16 ? '0x' : '') + this.value.toString(radix);
  }
  toHex(): string {
    return ByteUtil.uint8ArrayToHexString(this.toUint8Array());
  }
  toCompactHex(): string {
    const hex = this.toHex();
    let offset = 0;
    while (hex[2 + offset] == '0')
      ++offset;
    if (!offset)
      return hex;

    const result = hex.substring(2 + offset);
    return result.length > 0 ? '0x' + result : '0x0';
  }
  toJSON(): string {
    return this.value.toJSON();
  }
  toUint8Array(): Uint8Array {
    return this.value.toByteArray().reverse();
  }
  testBit(n: number): boolean {
    return this.value.testBit(n);
  }
  setBit(n: number, mutate?: boolean): Uint256 {
    const result = new Uint256();
    result.value = this.value.setBit(n, mutate);
    return result;
  }
  flipBit(n: number, mutate?: boolean): Uint256 {
    const result = new Uint256();
    result.value = this.value.flipBit(n, mutate);
    return result;
  }
  clearBit(n: number, mutate?: boolean): Uint256 {
    const result = new Uint256();
    result.value = this.value.clearBit(n, mutate);
    return result;
  }
  byteCount(): number {
    let data = this.toUint8Array(), offset = 0;
    while (offset < data.length && data[offset] == 0)
      ++offset;
    return 32 - offset;
  }
  isSafeInteger(): boolean {
    let value = parseInt(this.toString());
    return !isNaN(value) && Number.isSafeInteger(value);
  }
  negate(mutate?: boolean): Uint256 {
    const result = new Uint256();
    result.value = this.value.negate(mutate);
    return result;
  }
  min(rval: Uint256 | number, mutate?: boolean): Uint256 {
    const result = new Uint256();
    result.value = this.value.min(rval instanceof Uint256 ? rval.value : rval, mutate);
    return result;
  }
  max(rval: Uint256 | number, mutate?: boolean): Uint256 {
    const result = new Uint256();
    result.value = this.value.max(rval instanceof Uint256 ? rval.value : rval, mutate);
    return result;
  }
}

export class Hashsig {
  data: Uint8Array;

  constructor(data?: string | Uint8Array) {
    let result: Uint8Array | null = null;
    if (data != null) {
      if (typeof data == 'string')
        result = ByteUtil.hexStringToUint8Array(data);
      else if (data instanceof Uint8Array)
        result = data;
    }

    if (!result || result.length != Chain.size.HASHSIG)
      this.data = new Uint8Array(Chain.size.HASHSIG);
    else
      this.data = result;
  }
  equals(value: Hashsig): boolean {
    return ByteUtil.uint8ArrayCompare(this.data, value.data);
  }
}

export class Seckey {
  data: Uint8Array;

  constructor(data?: string | Uint8Array) {
    let result: Uint8Array | null = null;
    if (data != null) {
      if (typeof data == 'string')
        result = ByteUtil.hexStringToUint8Array(data);
      else if (data instanceof Uint8Array)
        result = data;
    }

    if (!result || result.length != Chain.size.SECKEY)
      this.data = new Uint8Array(Chain.size.SECKEY);
    else
      this.data = result;
  }
  equals(value: Seckey): boolean {
    return ByteUtil.uint8ArrayCompare(this.data, value.data);
  }
}

export class Pubkey {
  data: Uint8Array;

  constructor(data?: string | Uint8Array) {
    let result: Uint8Array | null = null;
    if (data != null) {
      if (typeof data == 'string')
        result = ByteUtil.hexStringToUint8Array(data);
      else if (data instanceof Uint8Array)
        result = data;
    }

    if (!result || result.length != Chain.size.PUBKEY)
      this.data = new Uint8Array(Chain.size.PUBKEY);
    else
      this.data = result;
  }
  equals(value: Pubkey): boolean {
    return ByteUtil.uint8ArrayCompare(this.data, value.data);
  }
}

export class Pubkeyhash {
  data: Uint8Array;

  constructor(data?: string | Uint8Array) {
    let result: Uint8Array | null = null;
    if (data != null) {
      if (typeof data == 'string')
        result = ByteUtil.hexStringToUint8Array(data);
      else if (data instanceof Uint8Array)
        result = data;
    }

    if (!result || result.length != Chain.size.PUBKEYHASH)
      this.data = new Uint8Array(Chain.size.PUBKEYHASH);
    else
      this.data = result;
  }
  equals(value: Pubkeyhash): boolean {
    return ByteUtil.uint8ArrayCompare(this.data, value.data);
  }
}

export class AssetId {
  id: string;
  handle: string;
  chain: string | null;
  token: string | null;
  checksum: string | null;

  constructor(data?: number | string | BigNumber | Uint8Array) {
    data = BigNumber.isBigNumber(data) ? data.toNumber() : data;
    data = typeof data == 'number' ? '0x' + data.toString(16) : data;
    data = typeof data == 'string' ? new Uint256(data).toUint8Array() : data;
    try {
      if (!(data instanceof Uint8Array))
        throw false;

      const numeric = new Uint256(data);
      if (numeric.eq(0))
        throw false;
      
      this.id = numeric.toCompactHex();
      this.handle = ByteUtil.uint8ArrayToByteString(numeric.toUint8Array().slice(32 - numeric.byteCount()));

      const segments = this.handle.split(':');
      this.chain = segments[0] || Chain.policy.TOKEN_NAME;
      this.token = segments[1] || null;
      this.checksum = segments[2] || null;
      if (!!this.token != !!this.checksum) {
        this.token = this.checksum = null;
      }
      if (this.chain == Chain.policy.TOKEN_NAME)
        this.id = (this.token != null || this.checksum != null ? new Uint256(ByteUtil.byteStringToUint8Array(`:${this.token}:${this.checksum}`)).toCompactHex() : '0x0');
    } catch {
      this.id = '0x0';
      this.handle = Chain.policy.TOKEN_NAME;
      this.chain = Chain.policy.TOKEN_NAME;
      this.token = null;
      this.checksum = null;
    }
  }
  equals(value: AssetId): boolean {
    return this.id == value.id;
  }
  toUint8Array(): Uint8Array {
    return ByteUtil.hexStringToUint8Array(this.id);
  }
  toUint256(): Uint256 {
    return new Uint256(this.toUint8Array());
  }
  toHex(): string {
    return ByteUtil.uint8ArrayToHexString(this.toUint8Array());
  }
  isValid(): boolean {
    return this.id.length > 0 && this.handle.length > 0 && this.chain != null && (!this.token || (this.token != null && this.checksum != null));
  }
  static fromHandle(chain: string, token?: string, contractAddress?: string): AssetId {
    let handle = chain == Chain.policy.TOKEN_NAME ? '' : chain.substring(0, 8);
    if (token != null && token.length > 0) {
      let normalizedToken = token.split('').filter(x => x.charCodeAt(0) >= 0x20 && x.charCodeAt(0) < 0x7F).join('').trim();
      handle = (handle + ':' + normalizedToken.substring(0, 11)).toUpperCase();
      if (contractAddress != null && contractAddress.length > 0) {
        handle = (handle + ':' + this.checksumOf(contractAddress).substring(0, Chain.size.ASSETID - (handle.length + 1)));
      }
    }
    return new AssetId(ByteUtil.byteStringToUint8Array(handle));
  }
  static checksumOf(contractAddress: string): string {
    return Base64.fromUint8Array(sha1(TextUtil.isHexEncoding(contractAddress) ? ByteUtil.hexStringToUint8Array(contractAddress) : contractAddress), true).replace(/[-_]/g, '');
  }
}

export class Segwit {
  static tweak(outputBits: number, input: Uint8Array, inputBits: number, padding: number): Uint8Array | null {
    let bits: number = 0;
    let value: number = 0;
    let max: number = (1 << outputBits) - 1;
    let inputSize = input.length;
    let output = new Uint8Array(input.length * 4);
    let outputSize = 0;
    let index = 0;

    while (inputSize--) {
      value = ((value << inputBits) | input[index++]) >>> 0;
      bits += inputBits;
      while (bits >= outputBits) {
        bits -= outputBits;
        output[outputSize++] = ((value >>> bits) & max) >>> 0;
      }
    }

    if (padding) {
      if (bits)
        output[outputSize++] = ((value << (outputBits - bits)) & max) >>> 0;
    }
    else if (((value << (outputBits - bits)) & max) >>> 0 || bits >= inputBits)
      return null;

    return output.slice(0, outputSize);
  }
  static encode(prefix: string, version: number, program: Uint8Array): string | null {
    if (version == 0 && program.length != 20 && program.length != 32)
      return null;
    else if (program.length < 2 || program.length > 40)
      return null;

    let data = this.tweak(5, program, 8, 1);
    if (!data)
      return null;

    data = Uint8Array.from([version, ...data]);
    try {
      return bech32m.encode(prefix, data);
    } catch {
      return null;
    }
  }
  static decode(prefix: string, address: string): { program: Uint8Array, version: number } | null {
    try {
      let program = bech32m.decode(address);
      if (program.words.length == 0 || program.words.length > 65)
        return null;
  
      if (program.prefix != prefix)
        return null;
  
      let data = this.tweak(8, new Uint8Array(program.words.slice(1)), 5, 0);
      if (!data || data.length < 2 || data.length > 40)
        return null;

      if (data[0] == 0 && data.length != 20 && data.length != 32)
        return null;

      return { program: data, version: program.words[0] };
    } catch {
      return null;
    }
  }
}

export class Signing {
  static messageHash(signableMessage: string): Uint256 {
    return new Uint256(Hashing.hash256(new Uint8Array([...new Uint256(Chain.props.MESSAGE_MAGIC).toUint8Array(), ...ByteUtil.byteStringToUint8Array(signableMessage)])));
  }
  static mnemonicgen(strength: number = 256): string {
    return bip39.generateMnemonic(wordlist, strength);
  }
  static keygen(): Seckey {
    let key = new Seckey();
    while (true) {
      let data: Uint8Array = randomBytes(key.data.length);
      if (!data || data.length != key.data.length)
        break;
      
      key.data = Uint8Array.from(data);
      if (this.verifySecretKey(key))
        break;
    }
    return key;
  }
  static recover(hash: Uint256, signature: Hashsig): Pubkey | null {
    let recoveryId = signature.data[signature.data.length - 1];
    if (recoveryId > 4)
      return null;

    try {
      const result = secp256k1.ecdsaRecover(signature.data.slice(0, 64), recoveryId, hash.toUint8Array(), true);
      if (!result)
        return null;

      return new Pubkey(result);
    } catch {
      return null;
    }
  }
  static recoverHash(hash: Uint256, signature: Hashsig): Pubkeyhash | null {
    let publicKey = this.recover(hash, signature);
    if (!publicKey)
      return null;

    return this.derivePublicKeyHash(publicKey);
  }
  static sign(hash: Uint256, secretKey: Seckey): Hashsig | null {
    try {
      const result = secp256k1.ecdsaSign(hash.toUint8Array(), secretKey.data);
      const signature = new Hashsig();
      signature.data = Uint8Array.from([...result.signature, result.recid]);
      return signature;
    } catch {
      return null;
    }
  }
  static verify(hash: Uint256, publicKey: Pubkey, signature: Hashsig): boolean {
    try {
      return secp256k1.ecdsaVerify(signature.data.slice(0, 64), hash.toUint8Array(), publicKey.data);
    } catch {
      return false;
    }
  }
  static verifyMnemonic(mnemonic: string): boolean {
    return bip39.validateMnemonic(mnemonic, wordlist);
  }
  static verifySecretKey(secretKey: Seckey): boolean {
    try {
      return secp256k1.privateKeyVerify(secretKey.data);
    } catch {
      return false;
    }
  }
  static verifyPublicKey(publicKey: Pubkey): boolean {
    try {
      return secp256k1.publicKeyVerify(publicKey.data);
    } catch {
      return false;
    }
  }
  static verifyAddress(address: string): boolean {
    return this.decodeAddress(address) != null;
  }
  static deriveSecretKeyFromMnemonic(mnemonic: string): Seckey | null {
    let seed = Uint8Array.from(bip39.mnemonicToSeedSync(mnemonic));
    return this.deriveSecretKey(seed);
  }
  static deriveSecretKey(seed: Uint8Array): Seckey {
    let secretKey = new Seckey();
    secretKey.data = seed;
    while (true) {
      secretKey.data = Hashing.hash256(secretKey.data);
      if (this.verifySecretKey(secretKey))
        break;
    }
    return secretKey;
  }
  static derivePublicKey(secretKey: Seckey): Pubkey {
    return new Pubkey(secp256k1.publicKeyCreate(secretKey.data, true));
  }
  static derivePublicKeyHash(publicKey: Pubkey): Pubkeyhash {
    let publicKeyHash = new Pubkeyhash();
    publicKeyHash.data = Hashing.hash160(publicKey.data);
    return publicKeyHash;
  }
  static async deriveCipherKeypair(secretKey: Seckey, nonce: Uint256): Promise<{ cipherSecretKey: Seckey, cipherPublicKey: Pubkey } | null> {
    try {
      await sodium.ready;
      const seed = Hashing.hash256(new Uint8Array([...secretKey.data, ...nonce.toUint8Array()]));
      const keypair = sodium.crypto_box_seed_keypair(seed);
      return {
        cipherSecretKey: new Seckey(keypair.privateKey),
        cipherPublicKey: new Pubkey(new Uint8Array([...keypair.publicKey, 0]))
      }
    } catch (ex) {
      console.error(ex);
      return null;
    }
  }
  static async publicEncrypt(cipherPublicKey: Pubkey, plaintext: Uint8Array, entropy: Uint8Array): Promise<Uint8Array | null> {
    if (!plaintext.length)
      return null;

    let salt = Hashing.hash512(entropy);
    let body = new Uint8Array([...salt, ...plaintext]);
    for (let i = salt.length; i < body.length; i++)
      body[i] ^= salt[i % salt.length];
    body = new Uint8Array([...body, ...Hashing.hash256(plaintext)]);

    try {
      await sodium.ready;

      const seed = Hashing.hash256(entropy);
      const ephemeralKeypair = sodium.crypto_box_seed_keypair(seed);
      const nonceBytes = 24;
      const state = sodium.crypto_generichash_init(null, nonceBytes);
      sodium.crypto_generichash_update(state, ephemeralKeypair.publicKey);
      sodium.crypto_generichash_update(state, cipherPublicKey.data.slice(0, 32));

      const nonce = sodium.crypto_generichash_final(state, nonceBytes);
      const ciphertext = sodium.crypto_box_easy(body, nonce, cipherPublicKey.data.slice(0, 32), ephemeralKeypair.privateKey);
      return Uint8Array.from([...ephemeralKeypair.publicKey, ...ciphertext]);
    } catch (ex) {
      return null;
    }
  }
  static async privateDecrypt(cipherSecretKey: Seckey, cipherPublicKey: Pubkey, ciphertext: Uint8Array): Promise<Uint8Array | null> {
    try {
      await sodium.ready;
      const body = sodium.crypto_box_seal_open(ciphertext, cipherPublicKey.data.slice(0, 32), cipherSecretKey.data);
      if (!body || body.length < 96)
        return null;

      let saltBodySize = body.length - 32;
      let salt = body.slice(0, 64);
      for (let i = salt.length; i < saltBodySize; i++)
        body[i] ^= salt[i % salt.length];

      let plaintextSize = body.length - 96;
      let checksum = body.slice(saltBodySize);
      let plaintext = body.slice(salt.length, salt.length + plaintextSize);
      let candidate = Hashing.hash256(plaintext);
      if (checksum.length !== candidate.length)
        return null;
      
      for (let i = 0; i < checksum.length; i++) {
        if (checksum[i] !== candidate[i])
          return null;
      }

      return plaintext;
    } catch {
      return null;
    }
  }
  static decodeSecretKey(value: string): Seckey | null {
    let result = Segwit.decode(Chain.props.SECKEY_PREFIX, value);
    if (!result || result.version != Chain.props.SECKEY_VERSION || result.program.length != Chain.size.SECKEY)
      return null;

    let secretKey = new Seckey();
    secretKey.data = result.program;
    return secretKey;
  }
  static encodeSecretKey(secretKey: Seckey): string | null {
    return Segwit.encode(Chain.props.SECKEY_PREFIX, Chain.props.SECKEY_VERSION, secretKey.data);
  }
  static decodePublicKey(value: string): Pubkey | null {
    let result = Segwit.decode(Chain.props.PUBKEY_PREFIX, value);
    if (!result || result.version != Chain.props.PUBKEY_VERSION || result.program.length != Chain.size.PUBKEY)
      return null;

    let publicKey = new Pubkey();
    publicKey.data = result.program;
    return publicKey;
  }
  static encodePublicKey(publicKey: Pubkey): string | null {
    return Segwit.encode(Chain.props.PUBKEY_PREFIX, Chain.props.PUBKEY_VERSION, publicKey.data);
  }
  static decodeAddress(value: string): Pubkeyhash | null {
    let result = Segwit.decode(Chain.props.ADDRESS_PREFIX, value);
    if (!result || result.version != Chain.props.ADDRESS_VERSION || result.program.length != Chain.size.PUBKEYHASH)
      return null;

    return result ? new Pubkeyhash(result.program) : null;
  }
  static encodeAddress(publicKeyHash: Pubkeyhash): string | null {
    return Segwit.encode(Chain.props.ADDRESS_PREFIX, Chain.props.ADDRESS_VERSION, publicKeyHash.data);
  }
}

export class Hashing {
  static hash32(data: Uint8Array): number {
    const buffer = sha1(data);
    const view = new DataView(buffer.buffer);
    return view.getUint32(0, true);
  }
  static hash160(data: Uint8Array): Uint8Array {
    return ripemd160(data);
  }
  static hash256(data: Uint8Array): Uint8Array {
    return blake2b(data, { dkLen: 32 });
  }
  static hash512(data: Uint8Array): Uint8Array {
    return sha3_512(data);
  }
}

export class ByteUtil {
  static hexStringToUint8Array(data: string): Uint8Array {
    if (data.startsWith('0x'))
      data = data.substring(2);
    let match = data.match(/.{1,2}/g);
    return Uint8Array.from(match ? match.map((byte: string) => parseInt(byte, 16)) : []);
  }
  static utf8StringToUint8Array(data: string): Uint8Array {
    return new TextEncoder().encode(data);
  }
  static byteStringToUint8Array(data: string): Uint8Array {
    return Uint8Array.from([...data].map((x) => x.charCodeAt(0)));
  }
  static uint8ArrayToHexString(data: Uint8Array): string {
    return data.length > 0 ? '0x' + [...data].map(x => x.toString(16).padStart(2, '0')).join('') : '0x0';
  }
  static uint8ArrayToByteString(data: Uint8Array): string {
    return String.fromCharCode(...data);
  }
  static uint8ArrayToUtf8String(data: Uint8Array): string {
    return new TextDecoder('utf8').decode(data);
  }
  static uint8ArrayCompare(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length)
      return false;

    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i])
        return false;
    }

    return true;
  }
  static uint8ArraySwapEndianness(data: Uint8Array): Uint8Array {
    let result = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    for (let i = 0; i < data.byteLength; i += data.BYTES_PER_ELEMENT) {
      for (let j = i, k = i; j > k; j--, k++) {
        let tmp = result[k];
        result[k] = result[j];
        result[j] = tmp;
      }
    }
    return result;
  }
  static bigNumberToString(data: BigNumber) {
    const text = data.toFixed(18);
    const index = text.indexOf('.');
    if (index === -1)
      return text;
    
    let length = text.length;
    while (length > index + 1 && text[length - 1] === '0')
        length--;
    
    return text.substring(0, length === index + 1 ? index : length);
  }
}
var _a;
import secp256k1 from 'secp256k1';
import sodium from 'libsodium-wrappers';
import * as bip39 from '@scure/bip39';
import { Base64 } from 'js-base64';
import { wordlist } from '@scure/bip39/wordlists/english';
import { randomBytes } from '@ethersproject/random';
import { UInt256 } from 'uint256';
import { bech32m } from 'bech32';
import { sha1 } from '@noble/hashes/sha1';
import { sha3_512 } from '@noble/hashes/sha3';
import { blake2b } from '@noble/hashes/blake2b';
import { ripemd160 } from '@noble/hashes/ripemd160';
import { TextUtil } from './text';
import BigNumber from 'bignumber.js';
export class Chain {
}
_a = Chain;
Chain.mainnet = {
    NAME: 'mainnet',
    SECKEY_VERSION: 0xF,
    SECKEY_PREFIX: 'sec',
    PUBKEY_VERSION: 0xE,
    PUBKEY_PREFIX: 'pub',
    ADDRESS_VERSION: 0x4,
    ADDRESS_PREFIX: 'tc',
    PRODUCTION_COMMITTEE: 12,
    PARTICIPATION_COMMITTEE: [2, 16],
    MESSAGE_MAGIC: 0x6a513fb6b3b71f02
};
Chain.testnet = {
    NAME: 'testnet',
    SECKEY_VERSION: 0xE,
    SECKEY_PREFIX: 'sect',
    PUBKEY_VERSION: 0xD,
    PUBKEY_PREFIX: 'pubt',
    ADDRESS_VERSION: 0x5,
    ADDRESS_PREFIX: 'tct',
    PRODUCTION_COMMITTEE: 12,
    PARTICIPATION_COMMITTEE: [2, 16],
    MESSAGE_MAGIC: 0x6a513fb6b3b71f02
};
Chain.regtest = {
    NAME: 'regtest',
    SECKEY_VERSION: 0xD,
    SECKEY_PREFIX: 'secrt',
    PUBKEY_VERSION: 0xC,
    PUBKEY_PREFIX: 'pubrt',
    ADDRESS_VERSION: 0x6,
    ADDRESS_PREFIX: 'tcrt',
    PRODUCTION_COMMITTEE: 12,
    PARTICIPATION_COMMITTEE: [1, 16],
    MESSAGE_MAGIC: 0x6a513fb6b3b71f02
};
Chain.size = {
    SIGHASH: 64,
    RECSIGHASH: 65,
    SECKEY: 32,
    PUBKEY: 33,
    PUBKEYHASH: 20,
    SUBPUBKEYHASH: 40,
    ASSETID: 32,
    MESSAGE: 0xffffff
};
Chain.props = _a.mainnet;
export class Uint256 {
    constructor(value, radix) {
        if (value != null) {
            if (value instanceof Uint256) {
                if (value.value.buffer) {
                    const copy = new ArrayBuffer(value.value.buffer.byteLength);
                    new Uint8Array(copy).set(new Uint8Array(value.value.buffer));
                    this.value = new UInt256(copy);
                }
                else
                    this.value = new UInt256();
            }
            else if (value instanceof Uint8Array) {
                if (value.length != 32) {
                    const copy = new Uint8Array(32);
                    if (value.length > 0)
                        copy.set(value.slice(0, 32), 0);
                    this.value = new UInt256(copy.buffer);
                }
                else
                    this.value = new UInt256(new Uint8Array(value).buffer);
            }
            else if (typeof value == 'string') {
                const isHex = value.startsWith('0x') || radix == 16;
                if (isHex) {
                    const numeric = (value.startsWith('0x') ? value.substring(2) : value);
                    const intermediate = new Uint256();
                    intermediate.value = new UInt256(numeric, 16);
                    this.value = new UInt256(intermediate.toHex());
                }
                else
                    this.value = new UInt256(value, radix);
            }
            else if (typeof value == 'number')
                this.value = new UInt256(value);
            else
                this.value = new UInt256();
        }
        else
            this.value = new UInt256();
    }
    compareTo(rval) {
        return this.value.compareTo(rval instanceof Uint256 ? rval.value : rval);
    }
    subtract(rval, mutate) {
        const result = new Uint256();
        result.value = this.value.subtract(rval instanceof Uint256 ? rval.value : rval, mutate);
        return result;
    }
    divideAndRemainder(rval) {
        return this.value.divideAndRemainder(rval instanceof Uint256 ? rval.value : rval).map((value) => {
            const result = new Uint256();
            result.value = value;
            return result;
        });
    }
    divide(rval, mutate) {
        const result = new Uint256();
        result.value = this.value.divide(rval instanceof Uint256 ? rval.value : rval, mutate);
        return result;
    }
    multiply(rval, mutate) {
        const result = new Uint256();
        result.value = this.value.multiply(rval instanceof Uint256 ? rval.value : rval, mutate);
        return result;
    }
    remainder(rval, mutate) {
        const result = new Uint256();
        result.value = this.value.remainder(rval instanceof Uint256 ? rval.value : rval, mutate);
        return result;
    }
    shiftRight(shift, mutate) {
        const result = new Uint256();
        result.value = this.value.shiftRight(shift, mutate);
        return result;
    }
    shiftLeft(shift, mutate) {
        const result = new Uint256();
        result.value = this.value.shiftLeft(shift, mutate);
        return result;
    }
    mutable(mutable) {
        const result = new Uint256();
        result.value = this.value.mutable(mutable);
        return result;
    }
    pow(rval, mutate) {
        const result = new Uint256();
        result.value = this.value.pow(rval, mutate);
        return result;
    }
    add(rval, mutate) {
        const result = new Uint256();
        result.value = this.value.add(rval instanceof Uint256 ? rval.value : rval, mutate);
        return result;
    }
    safeAdd(rval, mutate) {
        const result = new Uint256();
        result.value = this.value.safeAdd(rval instanceof Uint256 ? rval.value : rval, mutate);
        return result;
    }
    gcd(rval, mutate) {
        const result = new Uint256();
        result.value = this.value.gcd(rval instanceof Uint256 ? rval.value : rval, mutate);
        return result;
    }
    sub(rval, mutate) {
        const result = new Uint256();
        result.value = this.value.sub(rval instanceof Uint256 ? rval.value : rval, mutate);
        return result;
    }
    safeSub(rval, mutate) {
        const result = new Uint256();
        result.value = this.value.safeSub(rval instanceof Uint256 ? rval.value : rval, mutate);
        return result;
    }
    divmod(rval) {
        return this.value.divmod(rval instanceof Uint256 ? rval.value : rval).map((value) => {
            const result = new Uint256();
            result.value = value;
            return result;
        });
    }
    div(rval, mutate) {
        const result = new Uint256();
        result.value = this.value.div(rval instanceof Uint256 ? rval.value : rval, mutate);
        return result;
    }
    mod(rval, mutate) {
        const result = new Uint256();
        result.value = this.value.mod(rval instanceof Uint256 ? rval.value : rval, mutate);
        return result;
    }
    mul(rval, mutate) {
        const result = new Uint256();
        result.value = this.value.mul(rval instanceof Uint256 ? rval.value : rval, mutate);
        return result;
    }
    safeMul(rval, mutate) {
        const result = new Uint256();
        result.value = this.value.safeMul(rval instanceof Uint256 ? rval.value : rval, mutate);
        return result;
    }
    and(rval, mutate) {
        const result = new Uint256();
        result.value = this.value.and(rval instanceof Uint256 ? rval.value : rval, mutate);
        return result;
    }
    andNot(rval, mutate) {
        const result = new Uint256();
        result.value = this.value.andNot(rval instanceof Uint256 ? rval.value : rval, mutate);
        return result;
    }
    or(rval, mutate) {
        const result = new Uint256();
        result.value = this.value.or(rval instanceof Uint256 ? rval.value : rval, mutate);
        return result;
    }
    xor(rval, mutate) {
        const result = new Uint256();
        result.value = this.value.xor(rval instanceof Uint256 ? rval.value : rval, mutate);
        return result;
    }
    not(mutate) {
        const result = new Uint256();
        result.value = this.value.not(mutate);
        return result;
    }
    shl(shift, mutate) {
        const result = new Uint256();
        result.value = this.value.shl(shift, mutate);
        return result;
    }
    shr(shift, mutate) {
        const result = new Uint256();
        result.value = this.value.shr(shift, mutate);
        return result;
    }
    eq(rval) {
        return this.value.eq(rval instanceof Uint256 ? rval.value : rval);
    }
    neq(rval) {
        return this.value.neq(rval instanceof Uint256 ? rval.value : rval);
    }
    cmp(rval) {
        return this.value.cmp(rval instanceof Uint256 ? rval.value : rval);
    }
    lte(rval) {
        return this.value.lte(rval instanceof Uint256 ? rval.value : rval);
    }
    lt(rval) {
        return this.value.lt(rval instanceof Uint256 ? rval.value : rval);
    }
    gte(rval) {
        return this.value.gte(rval instanceof Uint256 ? rval.value : rval);
    }
    gt(rval) {
        return this.value.gt(rval instanceof Uint256 ? rval.value : rval);
    }
    copy() {
        const result = new Uint256();
        result.value = this.value.copy();
        return result;
    }
    valueOf() {
        return this.value.valueOf();
    }
    toSafeInteger() {
        return this.isSafeInteger() ? this.valueOf() : this;
    }
    toString(radix) {
        return (radix == 16 ? '0x' : '') + this.value.toString(radix);
    }
    toHex() {
        return ByteUtil.uint8ArrayToHexString(ByteUtil.uint8ArraySwapEndianness(this.toUint8Array()));
    }
    toCompactHex() {
        const hex = this.toHex();
        let offset = 0;
        while (hex[2 + offset] == '0')
            ++offset;
        if (!offset)
            return hex;
        const result = hex.substring(2 + offset);
        return result.length > 0 ? '0x' + result : '0x0';
    }
    toJSON() {
        return this.value.toJSON();
    }
    toUint8Array() {
        return this.value.toByteArray();
    }
    testBit(n) {
        return this.value.testBit(n);
    }
    setBit(n, mutate) {
        const result = new Uint256();
        result.value = this.value.setBit(n, mutate);
        return result;
    }
    flipBit(n, mutate) {
        const result = new Uint256();
        result.value = this.value.flipBit(n, mutate);
        return result;
    }
    clearBit(n, mutate) {
        const result = new Uint256();
        result.value = this.value.clearBit(n, mutate);
        return result;
    }
    byteCount() {
        let data = this.toUint8Array(), bytes = 32;
        while (bytes > 0 && !data[bytes - 1])
            --bytes;
        return bytes;
    }
    isSafeInteger() {
        let value = parseInt(this.toString());
        return !isNaN(value) && Number.isSafeInteger(value);
    }
    negate(mutate) {
        const result = new Uint256();
        result.value = this.value.negate(mutate);
        return result;
    }
    min(rval, mutate) {
        const result = new Uint256();
        result.value = this.value.min(rval instanceof Uint256 ? rval.value : rval, mutate);
        return result;
    }
    max(rval, mutate) {
        const result = new Uint256();
        result.value = this.value.max(rval instanceof Uint256 ? rval.value : rval, mutate);
        return result;
    }
}
export class Recsighash {
    constructor(data) {
        let result = null;
        if (data != null) {
            if (typeof data == 'string')
                result = ByteUtil.hexStringToUint8Array(data);
            else if (data instanceof Uint8Array)
                result = data;
        }
        if (!result || result.length != Chain.size.RECSIGHASH)
            this.data = new Uint8Array(Chain.size.RECSIGHASH);
        else
            this.data = result;
    }
    equals(value) {
        return ByteUtil.uint8ArrayCompare(this.data, value.data);
    }
}
export class Seckey {
    constructor(data) {
        let result = null;
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
    equals(value) {
        return ByteUtil.uint8ArrayCompare(this.data, value.data);
    }
}
export class Pubkey {
    constructor(data) {
        let result = null;
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
    equals(value) {
        return ByteUtil.uint8ArrayCompare(this.data, value.data);
    }
}
export class Pubkeyhash {
    constructor(data) {
        let result = null;
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
    equals(value) {
        return ByteUtil.uint8ArrayCompare(this.data, value.data);
    }
}
export class Subpubkeyhash {
    constructor(data) {
        let result = null;
        if (data != null) {
            if (typeof data == 'string')
                result = ByteUtil.hexStringToUint8Array(data);
            else if (data instanceof Uint8Array)
                result = data;
        }
        if (!result || result.length != Chain.size.SUBPUBKEYHASH)
            this.data = new Uint8Array(Chain.size.SUBPUBKEYHASH);
        else
            this.data = result;
    }
    equals(value) {
        return ByteUtil.uint8ArrayCompare(this.data, value.data);
    }
}
export class AssetId {
    constructor(data) {
        if (typeof data == 'number') {
            data = ByteUtil.hexStringToUint8Array('0x' + data.toString(16));
        }
        else if (typeof data == 'string') {
            data = ByteUtil.hexStringToUint8Array(data);
        }
        else if (data instanceof BigNumber) {
            data = ByteUtil.hexStringToUint8Array('0x' + data.toString(16));
        }
        if (data instanceof Uint8Array) {
            let offset = 0;
            while (data[offset] == 0 && offset + 1 < data.length)
                ++offset;
            data = data.slice(offset);
            this.handle = ByteUtil.uint8ArrayToByteString(data);
            const numeric = new Uint256(data.reverse());
            const segments = this.handle.split(':');
            this.id = numeric.isSafeInteger() ? numeric.valueOf() : numeric.toCompactHex();
            this.chain = segments[0];
            this.token = segments[1] || null;
            this.checksum = segments[2] || null;
        }
        else {
            this.id = 0;
            this.handle = '';
            this.chain = null;
            this.token = null;
            this.checksum = null;
        }
    }
    equals(value) {
        return this.id.toString() == value.id.toString();
    }
    toUint8Array() {
        return ByteUtil.byteStringToUint8Array(this.handle).reverse();
    }
    toUint256() {
        return new Uint256(this.toUint8Array());
    }
    toHex() {
        return ByteUtil.uint8ArrayToHexString(this.toUint8Array().reverse());
    }
    isValid() {
        return (typeof this.id == 'number' ? this.id > 0 : this.id.length > 0) && this.handle.length > 0 && this.chain != null && (!this.token || (this.token != null && this.checksum != null));
    }
    static fromHandle(chain, token, contractAddress) {
        let handle = chain.substring(0, 8);
        if (token != null && token.length > 0) {
            handle = (handle + ':' + token.substring(0, 8)).toUpperCase();
            if (contractAddress != null && contractAddress.length > 0) {
                let hash = Base64.fromUint8Array(sha1(TextUtil.isHexEncoding(contractAddress) ? ByteUtil.hexStringToUint8Array(contractAddress) : contractAddress), true);
                handle = (handle + ':' + hash.substring(0, Chain.size.ASSETID - (handle.length + 1)));
            }
        }
        else
            handle = handle.toUpperCase();
        return new AssetId(ByteUtil.byteStringToUint8Array(handle));
    }
}
export class Segwit {
    static tweak(outputBits, input, inputBits, padding) {
        let bits = 0;
        let value = 0;
        let max = (1 << outputBits) - 1;
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
    static encode(prefix, version, program) {
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
        }
        catch {
            return null;
        }
    }
    static decode(prefix, address) {
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
        }
        catch {
            return null;
        }
    }
}
export class Signing {
    static messageHash(signableMessage) {
        return new Uint256(Hashing.hash256(new Uint8Array([...new Uint256(Chain.props.MESSAGE_MAGIC).toUint8Array(), ...ByteUtil.byteStringToUint8Array(signableMessage)])));
    }
    static mnemonicgen(strength = 256) {
        return bip39.generateMnemonic(wordlist, strength);
    }
    static keygen() {
        let key = new Seckey();
        while (true) {
            let data = randomBytes(key.data.length);
            if (!data || data.length != key.data.length)
                break;
            key.data = Uint8Array.from(data);
            if (this.verifySecretKey(key))
                break;
        }
        return key;
    }
    static recover(hash, signature) {
        let recoveryId = signature.data[signature.data.length - 1];
        if (recoveryId > 4)
            return null;
        try {
            const result = secp256k1.ecdsaRecover(signature.data.slice(0, 64), recoveryId, hash.toUint8Array(), true);
            if (!result)
                return null;
            return new Pubkey(result);
        }
        catch {
            return null;
        }
    }
    static recoverHash(hash, signature) {
        let publicKey = this.recover(hash, signature);
        if (!publicKey)
            return null;
        return this.derivePublicKeyHash(publicKey);
    }
    static sign(hash, secretKey) {
        try {
            const result = secp256k1.ecdsaSign(hash.toUint8Array(), secretKey.data);
            const signature = new Recsighash();
            signature.data = Uint8Array.from([...result.signature, result.recid]);
            return signature;
        }
        catch {
            return null;
        }
    }
    static verify(hash, publicKey, signature) {
        try {
            return secp256k1.ecdsaVerify(signature.data.slice(0, 64), hash.toUint8Array(), publicKey.data);
        }
        catch {
            return false;
        }
    }
    static verifyMnemonic(mnemonic) {
        return bip39.validateMnemonic(mnemonic, wordlist);
    }
    static verifySecretKey(secretKey) {
        try {
            return secp256k1.privateKeyVerify(secretKey.data);
        }
        catch {
            return false;
        }
    }
    static verifyPublicKey(publicKey) {
        try {
            return secp256k1.publicKeyVerify(publicKey.data);
        }
        catch {
            return false;
        }
    }
    static verifyAddress(address) {
        return this.decodeAddress(address) != null;
    }
    static deriveSecretKeyFromMnemonic(mnemonic) {
        let seed = Uint8Array.from(bip39.mnemonicToSeedSync(mnemonic));
        return this.deriveSecretKey(seed);
    }
    static deriveSecretKey(seed) {
        let secretKey = new Seckey();
        secretKey.data = seed;
        while (true) {
            secretKey.data = Hashing.hash256(secretKey.data);
            if (this.verifySecretKey(secretKey))
                break;
        }
        return secretKey;
    }
    static derivePublicKey(secretKey) {
        return new Pubkey(secp256k1.publicKeyCreate(secretKey.data, true));
    }
    static derivePublicKeyHash(publicKey) {
        let publicKeyHash = new Pubkeyhash();
        publicKeyHash.data = Hashing.hash160(publicKey.data);
        return publicKeyHash;
    }
    static async deriveCipherKeypair(secretKey, nonce) {
        try {
            await sodium.ready;
            const seed = Hashing.hash256(new Uint8Array([...secretKey.data, ...nonce.toUint8Array()]));
            const keypair = sodium.crypto_box_seed_keypair(seed);
            return {
                cipherSecretKey: new Seckey(keypair.privateKey),
                cipherPublicKey: new Pubkey(new Uint8Array([...keypair.publicKey, 0]))
            };
        }
        catch (ex) {
            console.error(ex);
            return null;
        }
    }
    static async publicEncrypt(cipherPublicKey, plaintext, entropy) {
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
        }
        catch (ex) {
            return null;
        }
    }
    static async privateDecrypt(cipherSecretKey, cipherPublicKey, ciphertext) {
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
        }
        catch {
            return null;
        }
    }
    static decodeSecretKey(value) {
        let result = Segwit.decode(Chain.props.SECKEY_PREFIX, value);
        if (!result || result.version != Chain.props.SECKEY_VERSION || result.program.length != Chain.size.SECKEY)
            return null;
        let secretKey = new Seckey();
        secretKey.data = result.program;
        return secretKey;
    }
    static encodeSecretKey(secretKey) {
        return Segwit.encode(Chain.props.SECKEY_PREFIX, Chain.props.SECKEY_VERSION, secretKey.data);
    }
    static decodePublicKey(value) {
        let result = Segwit.decode(Chain.props.PUBKEY_PREFIX, value);
        if (!result || result.version != Chain.props.PUBKEY_VERSION || result.program.length != Chain.size.PUBKEY)
            return null;
        let publicKey = new Pubkey();
        publicKey.data = result.program;
        return publicKey;
    }
    static encodePublicKey(publicKey) {
        return Segwit.encode(Chain.props.PUBKEY_PREFIX, Chain.props.PUBKEY_VERSION, publicKey.data);
    }
    static decodeAddress(value) {
        const result = this.decodeSubaddress(value);
        return result ? new Pubkeyhash(result.data.slice(0, Chain.size.PUBKEYHASH)) : null;
    }
    static decodeSubaddress(value) {
        let result = Segwit.decode(Chain.props.ADDRESS_PREFIX, value);
        if (!result || result.version != Chain.props.ADDRESS_VERSION || (result.program.length != Chain.size.PUBKEYHASH && result.program.length != Chain.size.SUBPUBKEYHASH))
            return null;
        let subPublicKeyHash = new Subpubkeyhash();
        subPublicKeyHash.data = result.program.length == Chain.size.SUBPUBKEYHASH ? result.program : Uint8Array.from([...result.program, new Array(Chain.size.SUBPUBKEYHASH - result.program.length).fill(0)]);
        if (result.program.length > Chain.size.PUBKEYHASH) {
            for (let i = 0; i < subPublicKeyHash.data.length; i++) {
                subPublicKeyHash.data[i] ^= subPublicKeyHash.data[i + Chain.size.PUBKEYHASH];
            }
        }
        return subPublicKeyHash;
    }
    static encodeAddress(publicKeyHash) {
        return this.encodeSubaddress(publicKeyHash);
    }
    static encodeSubaddress(publicKeyHash, derivationHash) {
        let data = publicKeyHash.data;
        if (derivationHash != null) {
            data = Uint8Array.from([...publicKeyHash.data, ...derivationHash.data]);
            for (let i = 0; i < publicKeyHash.data.length; i++) {
                data[i] ^= derivationHash.data[i];
            }
        }
        return Segwit.encode(Chain.props.ADDRESS_PREFIX, Chain.props.ADDRESS_VERSION, data);
    }
    static baseAddressOf(address) {
        const publicKeyHash = this.decodeAddress(address);
        return publicKeyHash ? this.encodeAddress(publicKeyHash) : null;
    }
    static maskAddressOf(address, derivation) {
        const subPublicKeyHash = this.decodeSubaddress(address);
        if (!subPublicKeyHash)
            return null;
        else if (!derivation)
            return subPublicKeyHash;
        const subaddress = Signing.encodeSubaddress(new Pubkeyhash(subPublicKeyHash.data.slice(0, Chain.size.PUBKEYHASH)), Signing.derivationHashOf(ByteUtil.utf8StringToUint8Array(derivation)));
        return subaddress ? Signing.decodeSubaddress(subaddress) : null;
    }
    static derivationHashOf(data) {
        const result = new Pubkeyhash();
        result.data = Hashing.hash160(data);
        return result;
    }
}
export class Hashing {
    static hash32(data) {
        const buffer = sha1(data);
        const view = new DataView(buffer.buffer);
        return view.getUint32(0, true);
    }
    static hash160(data) {
        return ripemd160(data);
    }
    static hash256(data) {
        return blake2b(data, { dkLen: 32 });
    }
    static hash512(data) {
        return sha3_512(data);
    }
}
export class ByteUtil {
    static hexStringToUint8Array(data) {
        if (data.startsWith('0x'))
            data = data.substring(2);
        let match = data.match(/.{1,2}/g);
        return Uint8Array.from(match ? match.map((byte) => parseInt(byte, 16)) : []);
    }
    static utf8StringToUint8Array(data) {
        return new TextEncoder().encode(data);
    }
    static byteStringToUint8Array(data) {
        return Uint8Array.from([...data].map((x) => x.charCodeAt(0)));
    }
    static uint8ArrayToHexString(data) {
        return '0x' + [...data].map(x => x.toString(16).padStart(2, '0')).join('');
    }
    static uint8ArrayToByteString(data) {
        return String.fromCharCode(...data);
    }
    static uint8ArrayToUtf8String(data) {
        return new TextDecoder('utf8').decode(data);
    }
    static uint8ArrayCompare(a, b) {
        if (a.length !== b.length)
            return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i])
                return false;
        }
        return true;
    }
    static uint8ArraySwapEndianness(data) {
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
}

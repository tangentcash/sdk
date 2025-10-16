"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaUtil = exports.StreamUtil = exports.Stream = exports.Viewable = void 0;
const algorithm_1 = require("./algorithm");
const text_1 = require("./text");
const bignumber_js_1 = __importDefault(require("bignumber.js"));
bignumber_js_1.default.config({ EXPONENTIAL_AT: 1e+9 });
var Viewable;
(function (Viewable) {
    Viewable[Viewable["DecimalNaN"] = 0] = "DecimalNaN";
    Viewable[Viewable["DecimalZero"] = 1] = "DecimalZero";
    Viewable[Viewable["DecimalNeg1"] = 2] = "DecimalNeg1";
    Viewable[Viewable["DecimalNeg2"] = 3] = "DecimalNeg2";
    Viewable[Viewable["DecimalPos1"] = 4] = "DecimalPos1";
    Viewable[Viewable["DecimalPos2"] = 5] = "DecimalPos2";
    Viewable[Viewable["True"] = 6] = "True";
    Viewable[Viewable["False"] = 7] = "False";
    Viewable[Viewable["UintMin"] = 8] = "UintMin";
    Viewable[Viewable["UintMax"] = 40] = "UintMax";
    Viewable[Viewable["StringAny10"] = 41] = "StringAny10";
    Viewable[Viewable["StringMin10"] = 42] = "StringMin10";
    Viewable[Viewable["StringMax10"] = 146] = "StringMax10";
    Viewable[Viewable["StringAny16"] = 147] = "StringAny16";
    Viewable[Viewable["StringMin16"] = 148] = "StringMin16";
    Viewable[Viewable["StringMax16"] = 252] = "StringMax16";
    Viewable[Viewable["Invalid"] = 255] = "Invalid";
})(Viewable || (exports.Viewable = Viewable = {}));
class Stream {
    constructor(data) {
        this.data = data || new Uint8Array();
        this.checksum = null;
        this.seek = 0;
    }
    clear() {
        this.data = new Uint8Array();
        this.checksum = null;
        this.seek = 0;
        return this;
    }
    rewind(offset = 0) {
        this.seek = (offset <= this.data.length ? offset : this.data.length);
        return this;
    }
    writeString(value) {
        if (text_1.TextUtil.isHexEncoding(value)) {
            let data = algorithm_1.ByteUtil.hexStringToUint8Array(value);
            let source = algorithm_1.ByteUtil.uint8ArrayToByteString(data);
            if (source.length > StreamUtil.getMaxStringSize()) {
                let type = StreamUtil.getStringType(source, true);
                let size = Math.min(algorithm_1.Chain.size.MESSAGE, source.length);
                this.write(new Uint8Array([type]));
                this.writeInteger(new algorithm_1.Uint256(size));
                this.write(data.slice(0, size));
            }
            else {
                let type = StreamUtil.getStringType(source, true);
                let size = StreamUtil.getStringSize(type);
                this.write(new Uint8Array([type]));
                this.write(data.slice(0, size));
            }
        }
        else if (value.length > StreamUtil.getMaxStringSize()) {
            let size = Math.min(algorithm_1.Chain.size.MESSAGE, value.length);
            let type = StreamUtil.getStringType(value, false);
            this.write(new Uint8Array([type]));
            this.writeInteger(new algorithm_1.Uint256(size));
            this.write(algorithm_1.ByteUtil.utf8StringToUint8Array(value.substring(0, size)));
        }
        else {
            let type = StreamUtil.getStringType(value, false);
            let size = StreamUtil.getStringSize(type);
            this.write(new Uint8Array([type]));
            this.write(algorithm_1.ByteUtil.utf8StringToUint8Array(value.substring(0, size)));
        }
        return this;
    }
    writeBinaryString(value) {
        if (value.length > StreamUtil.getMaxStringSize()) {
            let size = Math.min(algorithm_1.Chain.size.MESSAGE, value.length);
            let type = StreamUtil.getStringType(value, false);
            this.write(new Uint8Array([type]));
            this.writeInteger(new algorithm_1.Uint256(size));
            this.write(value.slice(0, size));
        }
        else {
            let type = StreamUtil.getStringType(value, false);
            let size = StreamUtil.getStringSize(type);
            this.write(new Uint8Array([type]));
            this.write(value.slice(0, size));
        }
        return this;
    }
    writeBinaryStringOptimized(value) {
        let size = value.length;
        while (size > 0 && !value[size - 1])
            --size;
        return size > 0 ? this.writeBinaryString(value.slice(0, size)) : this.writeString('');
    }
    writeDecimal(value) {
        if (value.isNaN()) {
            let type = Viewable.DecimalNaN;
            this.write(new Uint8Array([type]));
            return this;
        }
        else if (value.isZero()) {
            let type = Viewable.DecimalZero;
            this.write(new Uint8Array([type]));
            return this;
        }
        let numeric = value.toString().split('.');
        let type = numeric.length > 1 ? (value.isNegative() ? Viewable.DecimalNeg2 : Viewable.DecimalPos2) : (value.isNegative() ? Viewable.DecimalNeg1 : Viewable.DecimalPos1);
        this.write(new Uint8Array([type]));
        this.writeInteger(new algorithm_1.Uint256(numeric[0].replace('-', '')));
        if (numeric.length > 1)
            this.writeInteger(new algorithm_1.Uint256(numeric[1].split('').reverse().join('')));
        return this;
    }
    writeInteger(value) {
        if (typeof value == 'number')
            value = new algorithm_1.Uint256(value);
        let type = StreamUtil.getIntegerType(value);
        let size = StreamUtil.getIntegerSize(type);
        this.write(new Uint8Array([type]));
        this.write(value.toUint8Array().slice(32 - size).reverse());
        return this;
    }
    writeBoolean(value) {
        let type = (value ? Viewable.True : Viewable.False);
        this.write(new Uint8Array([type]));
        return this;
    }
    writeTypeslessInteger(value) {
        let size = StreamUtil.getIntegerSize(StreamUtil.getIntegerType(value));
        this.write(value.toUint8Array().slice(32 - size).reverse());
        return this;
    }
    writeTypesless(value) {
        this.write(value);
        return this;
    }
    readType() {
        let data = this.read(1);
        if (data == null)
            return null;
        return data[0];
    }
    readString(type) {
        if (StreamUtil.isString(type)) {
            let size = StreamUtil.getStringSize(type);
            let data = this.read(size);
            if (data == null || data.length != size)
                return size > 0 ? null : '';
            return StreamUtil.isString16(type) ? algorithm_1.ByteUtil.uint8ArrayToHexString(data) : algorithm_1.ByteUtil.uint8ArrayToByteString(data);
        }
        else if (type != Viewable.StringAny10 && type != Viewable.StringAny16)
            return null;
        let subtype = this.readType();
        if (subtype == null)
            return null;
        let size = this.readInteger(subtype)?.valueOf();
        if (!size || size > algorithm_1.Chain.size.MESSAGE)
            return null;
        let data = this.read(size);
        if (data == null || data.length != size)
            return size > 0 ? null : '';
        return StreamUtil.isString16(type) ? algorithm_1.ByteUtil.uint8ArrayToHexString(data) : algorithm_1.ByteUtil.uint8ArrayToByteString(data);
    }
    readBinaryString(type) {
        if (StreamUtil.isString(type)) {
            let size = StreamUtil.getStringSize(type);
            let data = this.read(size);
            if (data == null || data.length != size)
                return size > 0 ? null : new Uint8Array();
            return data;
        }
        else if (type != Viewable.StringAny10 && type != Viewable.StringAny16)
            return null;
        let subtype = this.readType();
        if (subtype == null)
            return null;
        let size = this.readInteger(subtype)?.valueOf();
        if (!size || size > algorithm_1.Chain.size.MESSAGE)
            return null;
        let data = this.read(size);
        if (data == null || data.length != size)
            return size > 0 ? null : new Uint8Array();
        return data;
    }
    readDecimal(type) {
        if (type == Viewable.DecimalNaN)
            return new bignumber_js_1.default(NaN);
        else if (type == Viewable.DecimalZero)
            return new bignumber_js_1.default(0);
        else if (type != Viewable.DecimalNeg1 && type != Viewable.DecimalNeg2 && type != Viewable.DecimalPos1 && type != Viewable.DecimalPos2)
            return null;
        let subtype = this.readType();
        if (subtype == null)
            return null;
        let left = this.readInteger(subtype);
        if (left == null)
            return null;
        let numeric = '-' + left.toString();
        if (type == Viewable.DecimalNeg2 || type == Viewable.DecimalPos2) {
            subtype = this.readType();
            if (subtype == null)
                return null;
            let right = this.readInteger(subtype);
            if (right == null)
                return null;
            numeric += '.' + right.toString().split('').reverse().join('');
        }
        return new bignumber_js_1.default(type != Viewable.DecimalNeg1 && type != Viewable.DecimalNeg2 ? numeric.substring(1) : numeric);
    }
    readInteger(type) {
        if (!StreamUtil.isInteger(type))
            return null;
        let size = StreamUtil.getIntegerSize(type);
        let data = this.read(size);
        if (data == null || data.length != size)
            return size == 0 ? new algorithm_1.Uint256(0) : null;
        return new algorithm_1.Uint256(data.reverse());
    }
    readSafeInteger(type) {
        let value = this.readInteger(type);
        return value != null ? value.toSafeInteger() : value;
    }
    readBoolean(type) {
        if (type != Viewable.True && type != Viewable.False)
            return null;
        return type == Viewable.True;
    }
    isEof() {
        return this.seek >= this.data.length;
    }
    encode() {
        return algorithm_1.ByteUtil.uint8ArrayToHexString(this.data);
    }
    hash(renew = false) {
        if (renew || this.checksum == null)
            this.checksum = new algorithm_1.Uint256(algorithm_1.Hashing.hash256(this.data));
        return this.checksum;
    }
    write(value) {
        if (value != null && value.length > 0) {
            this.data = new Uint8Array([...this.data, ...value]);
            this.checksum = null;
        }
    }
    read(size) {
        if (!size || size + this.seek > this.data.length)
            return null;
        let slice = this.data.slice(this.seek, this.seek + size);
        this.seek += size;
        return slice;
    }
    static decode(data) {
        return new Stream(text_1.TextUtil.isHexEncoding(data) ? algorithm_1.ByteUtil.hexStringToUint8Array(data) : algorithm_1.ByteUtil.byteStringToUint8Array(data));
    }
}
exports.Stream = Stream;
class StreamUtil {
    static isInteger(type) {
        return type >= Viewable.UintMin && type <= Viewable.UintMax;
    }
    static isString(type) {
        return this.isString10(type) || this.isString16(type);
    }
    static isString10(type) {
        return type >= Viewable.StringMin10 && type <= Viewable.StringMax10;
    }
    static isString16(type) {
        return type >= Viewable.StringMin16;
    }
    static getIntegerSize(type) {
        if (type < Viewable.UintMin)
            return 0;
        return type - Viewable.UintMin;
    }
    static getIntegerType(data) {
        return Viewable.UintMin + data.byteCount();
    }
    static getStringType(data, hexEncoding) {
        let limit = this.getMaxStringSize();
        if (hexEncoding) {
            if (data.length > limit)
                return Viewable.StringAny16;
            return (Viewable.StringMin16 + Math.min(data.length, limit));
        }
        else {
            if (data.length > limit)
                return Viewable.StringAny10;
            return (Viewable.StringMin10 + Math.min(data.length, limit));
        }
    }
    static getStringSize(type) {
        if (this.isString10(type))
            return type - Viewable.StringMin10;
        if (this.isString16(type))
            return type - Viewable.StringMin16;
        return 0;
    }
    static getMaxStringSize() {
        return Viewable.StringMax10 - Viewable.StringMin10;
    }
}
exports.StreamUtil = StreamUtil;
class SchemaUtil {
    static store(stream, object, schema) {
        const write = (field, type, value) => {
            switch (type) {
                case 'uint8': {
                    if (!(value instanceof algorithm_1.Uint256) && typeof value != 'number')
                        throw new TypeError('field ' + field + ' is not of type uint8 (number, uint256)');
                    let numeric = (value instanceof algorithm_1.Uint256 ? value : new algorithm_1.Uint256(typeof value == 'number' ? value : 0));
                    if (numeric.gte(this.UINT08_MAX))
                        throw new TypeError('field ' + field + ' is out of uint8 range');
                    stream.writeInteger(numeric);
                    break;
                }
                case 'uint16': {
                    if (!(value instanceof algorithm_1.Uint256) && typeof value != 'number')
                        throw new TypeError('field ' + field + ' is not of type uint16 (number, uint256)');
                    let numeric = (value instanceof algorithm_1.Uint256 ? value : new algorithm_1.Uint256(typeof value == 'number' ? value : 0));
                    if (numeric.gte(this.UINT16_MAX))
                        throw new TypeError('field ' + field + ' is out of uint16 range');
                    stream.writeInteger(numeric);
                    break;
                }
                case 'uint32': {
                    if (!(value instanceof algorithm_1.Uint256) && typeof value != 'number')
                        throw new TypeError('field ' + field + ' is not of type uint32 (number, uint256)');
                    let numeric = (value instanceof algorithm_1.Uint256 ? value : new algorithm_1.Uint256(typeof value == 'number' ? value : 0));
                    if (numeric.gte(this.UINT32_MAX))
                        throw new TypeError('field ' + field + ' is out of uint32 range');
                    stream.writeInteger(numeric);
                    break;
                }
                case 'uint64': {
                    if (!(value instanceof algorithm_1.Uint256) && typeof value != 'number')
                        throw new TypeError('field ' + field + ' is not of type uint64 (number, uint256)');
                    let numeric = (value instanceof algorithm_1.Uint256 ? value : new algorithm_1.Uint256(typeof value == 'number' ? value : 0));
                    if (numeric.gte(this.UINT64_MAX))
                        throw new TypeError('field ' + field + ' is out of uint64 range');
                    stream.writeInteger(numeric);
                    break;
                }
                case 'uint128': {
                    if (!(value instanceof algorithm_1.Uint256))
                        throw new TypeError('field ' + field + ' is not of type uint128 (uint256)');
                    if (value.gte(this.UINT128_MAX))
                        throw new TypeError('field ' + field + ' is out of uint128 range');
                    stream.writeInteger(value);
                    break;
                }
                case 'uint256': {
                    if (!(value instanceof algorithm_1.Uint256))
                        throw new TypeError('field ' + field + ' is not of type uint256');
                    stream.writeInteger(value);
                    break;
                }
                case 'decimal': {
                    if (!bignumber_js_1.default.isBigNumber(value))
                        throw new TypeError('field ' + field + ' is not of type decimal (bignumber)');
                    stream.writeDecimal(value);
                    break;
                }
                case 'binary': {
                    if (!(value instanceof Uint8Array))
                        throw new TypeError('field ' + field + ' is not of type binary (uint8array)');
                    stream.writeBinaryString(value);
                    break;
                }
                case 'string': {
                    if (typeof value != 'string')
                        throw new TypeError('field ' + field + ' is not of type string');
                    stream.writeString(value);
                    break;
                }
                case 'typeless': {
                    if (!(value instanceof Uint8Array))
                        throw new TypeError('field ' + field + ' is not of type uint8array');
                    stream.writeTypesless(value);
                    break;
                }
                case 'boolean': {
                    if (typeof value != 'boolean')
                        throw new TypeError('field ' + field + ' is not of type boolean');
                    stream.writeBoolean(value);
                    break;
                }
                case 'hashsig': {
                    if (!(value instanceof algorithm_1.Hashsig))
                        throw new TypeError('field ' + field + ' is not of type hashsig');
                    stream.writeBinaryStringOptimized(value.data);
                    break;
                }
                case 'seckey': {
                    if (!(value instanceof algorithm_1.Seckey))
                        throw new TypeError('field ' + field + ' is not of type seckey');
                    stream.writeBinaryStringOptimized(value.data);
                    break;
                }
                case 'pubkey': {
                    if (!(value instanceof algorithm_1.Pubkey))
                        throw new TypeError('field ' + field + ' is not of type pubkey');
                    stream.writeBinaryStringOptimized(value.data);
                    break;
                }
                case 'pubkeyhash': {
                    if (!value) {
                        stream.writeString('');
                        break;
                    }
                    else if (!(value instanceof algorithm_1.Pubkeyhash))
                        throw new TypeError('field ' + field + ' is not of type pubkeyhash');
                    stream.writeBinaryStringOptimized(value.data);
                    break;
                }
                case 'assetid': {
                    if (!(value instanceof algorithm_1.AssetId))
                        throw new TypeError('field ' + field + ' is not of type assetid');
                    stream.writeInteger(new algorithm_1.Uint256(value.toUint8Array()));
                    break;
                }
                case 'args': {
                    if (!Array.isArray(value))
                        throw new TypeError('field ' + field + ' is not of type array');
                    this.storeArray(stream, value, true);
                    break;
                }
                default:
                    break;
            }
        };
        if (schema['type'] !== undefined && typeof schema.getType == 'function') {
            const type = schema.getType();
            object.type = typeof type == 'string' ? algorithm_1.Hashing.hash32(algorithm_1.ByteUtil.byteStringToUint8Array(type)) : type;
        }
        else {
            delete schema['type'];
        }
        for (let field in schema) {
            let type = schema[field];
            let value = object[field];
            if (Array.isArray(type)) {
                const elements = value;
                stream.writeInteger(elements.length);
                for (let i = 0; i < elements.length; i++) {
                    const element = elements[i];
                    if (type.length > 1 && type.length % 2 == 0) {
                        for (let i = 0; i < type.length; i += 2) {
                            const arrayField = type[i + 0];
                            write(arrayField, type[i + 1], element[arrayField]);
                        }
                    }
                    else {
                        write(type[0], type[1], element);
                    }
                }
            }
            else {
                write(field, type, value);
            }
        }
    }
    static load(stream, schema) {
        const read = (field, type) => {
            let subtype = stream.readType();
            if (subtype == null)
                throw new TypeError('field ' + field + ' of type ' + type + ' not found');
            let value = null;
            switch (type) {
                case 'uint8':
                case 'uint16':
                case 'uint32':
                case 'uint64':
                case 'uint128':
                case 'uint256':
                    value = stream.readSafeInteger(subtype);
                    break;
                case 'decimal':
                    value = stream.readDecimal(subtype);
                    break;
                case 'binary':
                    value = stream.readBinaryString(subtype);
                    break;
                case 'string':
                    value = stream.readString(subtype);
                    break;
                case 'typeless':
                    throw new TypeError('field ' + field + ' of type ' + type + ' is write-only');
                case 'boolean':
                    value = stream.readBoolean(subtype);
                    break;
                case 'hashsig':
                    value = stream.readBinaryString(subtype);
                    if (value != null)
                        value = new algorithm_1.Hashsig(value.length == algorithm_1.Chain.size.HASHSIG ? value : Uint8Array.from([...value, ...new Array(algorithm_1.Chain.size.HASHSIG - value.length).fill(0)]));
                    break;
                case 'seckey':
                    value = stream.readBinaryString(subtype);
                    if (value != null)
                        value = new algorithm_1.Seckey(value.length == algorithm_1.Chain.size.SECKEY ? value : Uint8Array.from([...value, ...new Array(algorithm_1.Chain.size.SECKEY - value.length).fill(0)]));
                    break;
                case 'pubkey':
                    value = stream.readBinaryString(subtype);
                    if (value != null)
                        value = new algorithm_1.Pubkey(value.length == algorithm_1.Chain.size.PUBKEY ? value : Uint8Array.from([...value, ...new Array(algorithm_1.Chain.size.PUBKEY - value.length).fill(0)]));
                    break;
                case 'pubkeyhash':
                    value = stream.readBinaryString(subtype);
                    if (value != null)
                        value = new algorithm_1.Pubkeyhash(value.length == algorithm_1.Chain.size.PUBKEYHASH ? value : Uint8Array.from([...value, ...new Array(algorithm_1.Chain.size.PUBKEYHASH - value.length).fill(0)]));
                    break;
                case 'assetid':
                    value = stream.readInteger(subtype);
                    if (value != null) {
                        value = new algorithm_1.AssetId(value.toUint8Array());
                    }
                    break;
                case 'args':
                    value = this.loadArray(stream, true);
                    break;
                default:
                    break;
            }
            if (value == null)
                throw new TypeError('field ' + field + ' of type ' + type + ' not found');
            return value;
        };
        let object = {};
        for (let field in schema) {
            let type = schema[field];
            if (Array.isArray(type)) {
                let subtype = stream.readType();
                if (subtype == null)
                    throw new TypeError('field ' + field + ' size not found');
                const elements = [];
                const size = stream.readSafeInteger(subtype);
                if (typeof size == 'number' && size != null) {
                    for (let i = 0; i < size; i++) {
                        let element = {};
                        if (type.length > 1 && type.length % 2 == 0) {
                            for (let i = 0; i < type.length; i += 2) {
                                const arrayField = type[i + 0];
                                element[arrayField] = read(arrayField, type[i + 1]);
                            }
                        }
                        else {
                            element = read(type[0], type[1]);
                        }
                        elements.push(element);
                    }
                }
                object[field] = elements;
            }
            else {
                object[field] = read(field, type);
            }
        }
        return object;
    }
    static storeRollup(stream, object, schema, subtransactions) {
        let assets = [], groups = {};
        for (let i = 0; i < subtransactions.length; i++) {
            const subtransaction = subtransactions[i];
            if (!(subtransaction.args?.asset instanceof algorithm_1.AssetId))
                throw new Error('Field \'asset\' is required');
            const asset = subtransaction.args.asset.toUint256();
            const assetId = asset.toHex();
            let group = groups[assetId];
            if (!group) {
                assets.push(subtransaction.args.asset.toUint256());
                groups[assetId] = [subtransaction];
            }
            else {
                group.push(subtransaction);
            }
        }
        const emptySignature = new algorithm_1.Hashsig();
        assets = assets.sort((a, b) => a.compareTo(b));
        SchemaUtil.store(stream, object, schema);
        stream.writeInteger(assets.length);
        for (let i = 0; i < assets.length; i++) {
            const asset = assets[i];
            const transactions = groups[asset.toHex()];
            stream.writeInteger(asset);
            stream.writeInteger(transactions.length);
            for (let j = 0; j < transactions.length; j++) {
                const subtransaction = transactions[j];
                if (typeof subtransaction.schema.getType != 'function') {
                    throw new Error('Function \'getType\' is required');
                }
                const type = subtransaction.schema.getType();
                const internalTransaction = subtransaction.args.signature instanceof algorithm_1.Hashsig ? subtransaction.args.signature.equals(emptySignature) : true;
                stream.writeBoolean(internalTransaction);
                stream.writeInteger(typeof type == 'string' ? algorithm_1.Hashing.hash32(algorithm_1.ByteUtil.byteStringToUint8Array(type)) : type);
                if (!internalTransaction) {
                    stream.writeInteger(subtransaction.args.nonce);
                    stream.writeBinaryStringOptimized(subtransaction.args.signature.data);
                }
                for (let item in schema) {
                    delete subtransaction.schema[item];
                }
                SchemaUtil.store(stream, subtransaction.args, subtransaction.schema);
            }
        }
    }
    static loadRollup(stream, schema, typeToSchema) {
        const transaction = this.load(stream, schema);
        if (!transaction)
            throw new TypeError('Not a valid rollup');
        const assetsSize256 = stream.readInteger(stream.readType() || Viewable.Invalid);
        if (!assetsSize256)
            throw new TypeError('Field \'assets_size\' is required');
        const assetsSize = assetsSize256.toInteger();
        transaction.transactions = [];
        for (let i = 0; i < assetsSize; i++) {
            const asset = stream.readInteger(stream.readType() || Viewable.Invalid);
            if (!asset)
                throw new TypeError('Field \'asset[' + i + ']\' is required');
            const transactionsSize256 = stream.readInteger(stream.readType() || Viewable.Invalid);
            if (!transactionsSize256)
                throw new TypeError('Field \'transactions_size[' + i + ']\' is required');
            const transactionsSize = transactionsSize256.toInteger();
            for (let j = 0; j < transactionsSize; j++) {
                const internalTransaction = stream.readBoolean(stream.readType() || Viewable.Invalid);
                const type = stream.readInteger(stream.readType() || Viewable.Invalid);
                if (!type)
                    throw new TypeError('Field \'type[' + j + ']\' is required');
                let nonce = null;
                let signature = null;
                if (!internalTransaction) {
                    nonce = stream.readInteger(stream.readType() || Viewable.Invalid);
                    if (!nonce)
                        throw new TypeError('Field \'nonce[' + j + ']\' is required');
                    let signatureValue = stream.readBinaryString(stream.readType() || Viewable.Invalid);
                    if (!signatureValue)
                        throw new TypeError('Field \'signature[' + j + ']\' is required');
                    signature = new algorithm_1.Hashsig(signatureValue.length == algorithm_1.Chain.size.HASHSIG ? signatureValue : Uint8Array.from([...signatureValue, ...new Array(algorithm_1.Chain.size.HASHSIG - signatureValue.length).fill(0)]));
                }
                const subschema = { ...typeToSchema(type.toInteger()) };
                for (let item in schema) {
                    delete subschema[item];
                }
                const subtransaction = SchemaUtil.load(stream, subschema);
                subtransaction.type = type;
                subtransaction.asset = new algorithm_1.AssetId(asset.toUint8Array());
                subtransaction.nonce = nonce;
                subtransaction.signature = signature;
                transaction.transactions.push(subtransaction);
            }
        }
        return transaction;
    }
    static storeArray(stream, data, sized) {
        if (sized)
            stream.writeInteger(data.length);
        for (let i = 0; i < data.length; i++) {
            const value = data[i];
            if ((value instanceof algorithm_1.Uint256) || typeof value == 'number')
                stream.writeInteger(value);
            else if (bignumber_js_1.default.isBigNumber(value))
                stream.writeDecimal(value);
            else if (value instanceof Uint8Array)
                stream.writeBinaryString(value);
            else if (typeof value == 'string')
                stream.writeString(value);
            else if (typeof value == 'boolean')
                stream.writeBoolean(value);
            else if (value instanceof algorithm_1.Hashsig || value instanceof algorithm_1.Seckey || value instanceof algorithm_1.Pubkey || value instanceof algorithm_1.Pubkeyhash)
                stream.writeBinaryStringOptimized(value.data);
            else if (value instanceof algorithm_1.AssetId)
                stream.writeInteger(new algorithm_1.Uint256(value.toUint8Array()));
            else
                throw new Error('array argument ' + i + ' is not serializable');
        }
    }
    static loadArray(stream, sized) {
        let result = [];
        let size = sized ? stream.readInteger(stream.readType() || Viewable.Invalid)?.toInteger() || Infinity : Infinity;
        if (sized && !isFinite(size))
            throw new Error('array is does not have a size');
        for (let i = 0; i < size; i++) {
            if (stream.isEof()) {
                if (sized && i != size - 1)
                    throw new Error('array argument ' + i + ' is not found');
                break;
            }
            let type = stream.readType();
            if (type == null)
                throw new Error('array argument ' + i + ' type is not valid');
            if ([Viewable.StringAny10, Viewable.StringAny16].includes(type)) {
                let value = stream.readString(type);
                if (value == null)
                    break;
                result.push(value);
            }
            else if ([Viewable.DecimalNaN, Viewable.DecimalZero, Viewable.DecimalNeg1, Viewable.DecimalNeg2, Viewable.DecimalPos1, Viewable.DecimalPos2].includes(type)) {
                let value = stream.readDecimal(type);
                if (value == null)
                    break;
                result.push(value.isLessThan(new bignumber_js_1.default(Number.MAX_SAFE_INTEGER)) && (value.decimalPlaces() || 0) < 6 ? value.toNumber() : value.toString());
            }
            else if ([Viewable.True, Viewable.False].includes(type)) {
                let value = stream.readBoolean(type);
                if (value == null)
                    break;
                result.push(value);
            }
            else if (StreamUtil.isString16(type)) {
                let value = stream.readBinaryString(type);
                if (value == null)
                    break;
                result.push(algorithm_1.ByteUtil.uint8ArrayToHexString(value));
            }
            else if (StreamUtil.isString10(type)) {
                let value = stream.readString(type);
                if (value == null)
                    break;
                result.push(text_1.TextUtil.isAsciiEncoding(value) ? value : algorithm_1.ByteUtil.uint8ArrayToHexString(algorithm_1.ByteUtil.byteStringToUint8Array(value)));
            }
            else if (StreamUtil.isInteger(type)) {
                let value = stream.readSafeInteger(type);
                if (value == null)
                    break;
                result.push(value);
            }
            else {
                throw new Error('array argument ' + i + ' is not deserializable');
            }
        }
        return result;
    }
}
exports.SchemaUtil = SchemaUtil;
SchemaUtil.UINT08_MAX = new algorithm_1.Uint256(Math.pow(2, 8) - 1);
SchemaUtil.UINT16_MAX = new algorithm_1.Uint256(Math.pow(2, 16) - 1);
SchemaUtil.UINT32_MAX = new algorithm_1.Uint256(Math.pow(2, 32) - 1);
SchemaUtil.UINT64_MAX = new algorithm_1.Uint256(2).pow(64).subtract(1);
SchemaUtil.UINT128_MAX = new algorithm_1.Uint256(2).pow(128).subtract(1);

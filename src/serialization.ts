import { AssetId, ByteUtil, Chain, Hashing, Pubkey, Pubkeyhash, Seckey, Hashsig, Uint256 } from "./algorithm";
import { TextUtil } from "./text";
import BigNumber from "bignumber.js";

BigNumber.config({ EXPONENTIAL_AT: 1e+9 });

export enum Viewable {
  DecimalNaN,
  DecimalZero,
  DecimalNeg1,
  DecimalNeg2,
  DecimalPos1,
  DecimalPos2,
  True,
  False,
  UintMin,
  UintMax = UintMin + 32,
  StringAny10,
  StringMin10,
  StringMax10 = StringMin10 + 104,
  StringAny16,
  StringMin16,
  StringMax16 = StringMin16 + 104,
  Invalid = 255
}

export class Stream {
  data: Uint8Array;
  checksum: Uint256 | null;
  seek: number;

  constructor(data?: Uint8Array) {
    this.data = data || new Uint8Array();
    this.checksum = null;
    this.seek = 0;
  }
  clear(): Stream {
    this.data = new Uint8Array();
    this.checksum = null;
    this.seek = 0;
    return this;
  }
  rewind(offset: number = 0): Stream {
    this.seek = (offset <= this.data.length ? offset : this.data.length);
    return this;
  }
  writeString(value: string): Stream {
    if (TextUtil.isHexEncoding(value)) {
      let data = ByteUtil.hexStringToUint8Array(value);
      let source: string = ByteUtil.uint8ArrayToByteString(data);
      if (source.length > StreamUtil.getMaxStringSize()) {
        let type = StreamUtil.getStringType(source, true);
        let size = Math.min(Chain.size.MESSAGE, source.length);
        this.write(new Uint8Array([type]));
        this.writeInteger(new Uint256(size));
        this.write(data.slice(0, size));
      } else {
        let type = StreamUtil.getStringType(source, true);
        let size = StreamUtil.getStringSize(type);
        this.write(new Uint8Array([type]));
        this.write(data.slice(0, size));
      }
    } else if (value.length > StreamUtil.getMaxStringSize()) {
      let size = Math.min(Chain.size.MESSAGE, value.length);
      let type = StreamUtil.getStringType(value, false);
      this.write(new Uint8Array([type]));
      this.writeInteger(new Uint256(size));
      this.write(ByteUtil.utf8StringToUint8Array(value.substring(0, size)));
    } else {
      let type = StreamUtil.getStringType(value, false);
      let size = StreamUtil.getStringSize(type);
      this.write(new Uint8Array([type]));
      this.write(ByteUtil.utf8StringToUint8Array(value.substring(0, size)));
    }
    return this;
  }
  writeBinaryString(value: Uint8Array): Stream {
    if (value.length > StreamUtil.getMaxStringSize()) {
      let size = Math.min(Chain.size.MESSAGE, value.length);
      let type = StreamUtil.getStringType(value, false);
      this.write(new Uint8Array([type]));
      this.writeInteger(new Uint256(size));
      this.write(value.slice(0, size));
    } else {
      let type = StreamUtil.getStringType(value, false);
      let size = StreamUtil.getStringSize(type);
      this.write(new Uint8Array([type]));
      this.write(value.slice(0, size));
    }
    return this;
  }
  writeBinaryStringOptimized(value: Uint8Array): Stream {
    let size = value.length;
    while (size > 0 && !value[size - 1])
      --size;

    return size > 0 ? this.writeBinaryString(value.slice(0, size)) : this.writeString('');
  }
  writeDecimal(value: BigNumber): Stream {
    if (value.isNaN()) {
      let type = Viewable.DecimalNaN;
      this.write(new Uint8Array([type]));
      return this;
    } else if (value.isZero()) {
      let type = Viewable.DecimalZero;
      this.write(new Uint8Array([type]));
      return this;
    }

    let numeric = value.toString().split('.');
    let type = numeric.length > 1 ? (value.isNegative() ? Viewable.DecimalNeg2 : Viewable.DecimalPos2) : (value.isNegative() ? Viewable.DecimalNeg1 : Viewable.DecimalPos1);
    this.write(new Uint8Array([type]));
    this.writeInteger(new Uint256(numeric[0].replace('-', '')));
    if (numeric.length > 1)
      this.writeInteger(new Uint256(numeric[1].split('').reverse().join('')));
    return this;
  }
  writeInteger(value: Uint256 | number): Stream {
    if (typeof value == 'number')
      value = new Uint256(value);

    let type = StreamUtil.getIntegerType(value);
    let size = StreamUtil.getIntegerSize(type);
    this.write(new Uint8Array([type]));
    this.write(value.toUint8Array().slice(32 - size).reverse());
    return this;
  }
  writeBoolean(value: boolean): Stream {
    let type = (value ? Viewable.True : Viewable.False);
    this.write(new Uint8Array([type]));
    return this;
  }
  writeTypeslessInteger(value: Uint256): Stream {
    let size = StreamUtil.getIntegerSize(StreamUtil.getIntegerType(value));
    this.write(value.toUint8Array().slice(32 - size).reverse());
    return this;
  }
  writeTypesless(value: Uint8Array): Stream {
    this.write(value);
    return this;
  }
  readType(): Viewable | null {
    let data = this.read(1);
    if (data == null)
      return null;

    return data[0] as Viewable;
  }
  readString(type: Viewable): string | null {
    if (StreamUtil.isString(type)) {
      let size = StreamUtil.getStringSize(type);
      let data = this.read(size);
      if (data == null || data.length != size)
        return size > 0 ? null : '';
      
      return StreamUtil.isString16(type) ? ByteUtil.uint8ArrayToHexString(data) : ByteUtil.uint8ArrayToByteString(data);
    } else if (type != Viewable.StringAny10 && type != Viewable.StringAny16)
      return null;

    let subtype: Viewable | null = this.readType();
    if (subtype == null)
        return null;
    
    let size: number | undefined = this.readInteger(subtype)?.valueOf();
    if (!size || size > Chain.size.MESSAGE)
      return null;

    let data = this.read(size);
    if (data == null || data.length != size)
      return size > 0 ? null : '';

    return StreamUtil.isString16(type) ? ByteUtil.uint8ArrayToHexString(data) : ByteUtil.uint8ArrayToByteString(data);
  }
  readBinaryString(type: Viewable): Uint8Array | null {
    if (StreamUtil.isString(type)) {
      let size = StreamUtil.getStringSize(type);
      let data = this.read(size);
      if (data == null || data.length != size)
        return size > 0 ? null : new Uint8Array();
      
      return data;
    } else if (type != Viewable.StringAny10 && type != Viewable.StringAny16)
      return null;

    let subtype: Viewable | null = this.readType();
    if (subtype == null)
        return null;
    
    let size: number | undefined = this.readInteger(subtype)?.valueOf();
    if (!size || size > Chain.size.MESSAGE)
      return null;

    let data = this.read(size);
    if (data == null || data.length != size)
      return size > 0 ? null : new Uint8Array();

    return data;
  }
  readDecimal(type: Viewable): BigNumber | null {
    if (type == Viewable.DecimalNaN)
      return new BigNumber(NaN);
    else if (type == Viewable.DecimalZero)
      return new BigNumber(0);
    else if (type != Viewable.DecimalNeg1 && type != Viewable.DecimalNeg2 && type != Viewable.DecimalPos1 && type != Viewable.DecimalPos2)
      return null;

    let subtype: Viewable | null = this.readType();
    if (subtype == null)
      return null;
    
    let left: Uint256 | null = this.readInteger(subtype);
    if (left == null)
      return null;

    let numeric = '-' + left.toString();
    if (type == Viewable.DecimalNeg2 || type == Viewable.DecimalPos2) {
      subtype = this.readType();
      if (subtype == null)
        return null;

      let right: Uint256 | null = this.readInteger(subtype);
      if (right == null)
        return null;

      numeric += '.' + right.toString().split('').reverse().join('');
    }

    return new BigNumber(type != Viewable.DecimalNeg1 && type != Viewable.DecimalNeg2 ? numeric.substring(1) : numeric);
  }
  readInteger(type: Viewable): Uint256 | null {
    if (!StreamUtil.isInteger(type))
      return null;
    
    let size = StreamUtil.getIntegerSize(type);
    let data = this.read(size);
    if (data == null || data.length != size)
      return size == 0 ? new Uint256(0) : null;

    return new Uint256(data.reverse());
  }
  readSafeInteger(type: Viewable): Uint256 | number | null {
    let value = this.readInteger(type);
    return value != null ? value.toSafeInteger() : value;
  }
  readBoolean(type: Viewable): boolean | null {
    if (type != Viewable.True && type != Viewable.False)
      return null;

    return type == Viewable.True;
  }
  isEof(): boolean {
    return this.seek >= this.data.length;
  }
  encode(): string {
    return ByteUtil.uint8ArrayToHexString(this.data);
  }
  hash(renew: boolean = false): Uint256 {
    if (renew || this.checksum == null)
      this.checksum = new Uint256(Hashing.hash256(this.data));
    return this.checksum;
  }
  private write(value: Uint8Array): void {
    if (value != null && value.length > 0) {
      this.data = new Uint8Array([...this.data, ...value]);
      this.checksum = null;
    }
  }
  private read(size: number): Uint8Array | null {
    if (!size || size + this.seek > this.data.length)
      return null;

    let slice = this.data.slice(this.seek, this.seek + size);
    this.seek += size;
    return slice;
  }
  static decode(data: string): Stream {
    return new Stream(TextUtil.isHexEncoding(data) ? ByteUtil.hexStringToUint8Array(data) : ByteUtil.byteStringToUint8Array(data));
  }
}

export class StreamUtil {
	static isInteger(type: Viewable) {
    return type >= Viewable.UintMin && type <= Viewable.UintMax;
  }
  static isString(type: Viewable) {
    return this.isString10(type) || this.isString16(type);
  }
  static isString10(type: Viewable) {
    return type >= Viewable.StringMin10 && type <= Viewable.StringMax10;
  }
  static isString16(type: Viewable) {
    return type >= Viewable.StringMin16;
  }
  static getIntegerSize(type: Viewable): number {
    if (type < Viewable.UintMin)
      return 0;

    return type - Viewable.UintMin;
  }
  static getIntegerType(data: Uint256): Viewable {
    return Viewable.UintMin + data.byteCount();
  }
  static getStringType(data: string | Uint8Array, hexEncoding: boolean): Viewable {
    let limit = this.getMaxStringSize();
    if (hexEncoding) {
      if (data.length > limit)
        return Viewable.StringAny16;

      return (Viewable.StringMin16 + Math.min(data.length, limit)) as Viewable;
    } else {
      if (data.length > limit)
        return Viewable.StringAny10;

      return (Viewable.StringMin10 + Math.min(data.length, limit)) as Viewable;
    }
  }
  static getStringSize(type: Viewable): number {
    if (this.isString10(type))
      return type - Viewable.StringMin10;

    if (this.isString16(type))
      return type - Viewable.StringMin16;

    return 0;
  }
  static getMaxStringSize(): number {
    return Viewable.StringMax10 - Viewable.StringMin10;
  }
}

export class SchemaUtil {
  static UINT08_MAX = new Uint256(Math.pow(2, 8) - 1);
  static UINT16_MAX = new Uint256(Math.pow(2, 16) - 1);
  static UINT32_MAX = new Uint256(Math.pow(2, 32) - 1);
  static UINT64_MAX = new Uint256(2).pow(64).subtract(1);
  static UINT128_MAX = new Uint256(2).pow(128).subtract(1);

  static store(stream: Stream, object: any, schema: any): void {
    const write = (field: string, type: string, value: any) => {
      switch (type) {
        case 'uint8': {
          if (!(value instanceof Uint256) && typeof value != 'number')
            throw new TypeError('field ' + field + ' is not of type uint8 (number, uint256)');

          let numeric = (value instanceof Uint256 ? value : new Uint256(typeof value == 'number' ? value : 0));
          if (numeric.gte(this.UINT08_MAX))
            throw new TypeError('field ' + field + ' is out of uint8 range');

          stream.writeInteger(numeric);
          break;
        }
        case 'uint16': {
          if (!(value instanceof Uint256) && typeof value != 'number')
            throw new TypeError('field ' + field + ' is not of type uint16 (number, uint256)');

          let numeric = (value instanceof Uint256 ? value : new Uint256(typeof value == 'number' ? value : 0));
          if (numeric.gte(this.UINT16_MAX))
            throw new TypeError('field ' + field + ' is out of uint16 range');

          stream.writeInteger(numeric);
          break;
        }
        case 'uint32': {
          if (!(value instanceof Uint256) && typeof value != 'number')
            throw new TypeError('field ' + field + ' is not of type uint32 (number, uint256)');

          let numeric = (value instanceof Uint256 ? value : new Uint256(typeof value == 'number' ? value : 0));
          if (numeric.gte(this.UINT32_MAX))
            throw new TypeError('field ' + field + ' is out of uint32 range');

          stream.writeInteger(numeric);
          break;
        }
        case 'uint64': {
          if (!(value instanceof Uint256) && typeof value != 'number')
            throw new TypeError('field ' + field + ' is not of type uint64 (number, uint256)');

          let numeric = (value instanceof Uint256 ? value : new Uint256(typeof value == 'number' ? value : 0));
          if (numeric.gte(this.UINT64_MAX))
            throw new TypeError('field ' + field + ' is out of uint64 range');

          stream.writeInteger(numeric);
          break;
        }
        case 'uint128': {
          if (!(value instanceof Uint256))
            throw new TypeError('field ' + field + ' is not of type uint128 (uint256)');

          if (value.gte(this.UINT128_MAX))
            throw new TypeError('field ' + field + ' is out of uint128 range');

          stream.writeInteger(value);
          break;
        }
        case 'uint256': {
          if (!(value instanceof Uint256))
            throw new TypeError('field ' + field + ' is not of type uint256');

          stream.writeInteger(value);
          break;
        }
        case 'decimal': {
          if (!BigNumber.isBigNumber(value))
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
          if (!(value instanceof Hashsig))
            throw new TypeError('field ' + field + ' is not of type hashsig');

          stream.writeBinaryStringOptimized(value.data);
          break;
        }
        case 'seckey': {
          if (!(value instanceof Seckey))
            throw new TypeError('field ' + field + ' is not of type seckey');

          stream.writeBinaryStringOptimized(value.data);
          break;
        }
        case 'pubkey': {
          if (!(value instanceof Pubkey))
            throw new TypeError('field ' + field + ' is not of type pubkey');

          stream.writeBinaryStringOptimized(value.data);
          break;
        }
        case 'pubkeyhash': {
          if (!value) {
            stream.writeString('');
            break;
          }
          else if (!(value instanceof Pubkeyhash))
            throw new TypeError('field ' + field + ' is not of type pubkeyhash');

          stream.writeBinaryStringOptimized(value.data);
          break;
        }
        case 'assetid': {
          if (!(value instanceof AssetId))
            throw new TypeError('field ' + field + ' is not of type assetid');

          stream.writeInteger(new Uint256(value.toUint8Array()));
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
      object.type = typeof type == 'string' ? Hashing.hash32(ByteUtil.byteStringToUint8Array(type)) : type;
    } else {
      delete schema['type'];
    }

    for (let field in schema) {
      let type = schema[field];
      let value = object[field];
      if (Array.isArray(type)) {
        const elements: any[] = value;
        stream.writeInteger(elements.length);
        for (let i = 0; i < elements.length; i++) {
          const element = elements[i];
          if (type.length > 1 && type.length % 2 == 0) {
            for (let i = 0; i < type.length; i += 2) {
              const arrayField = type[i + 0];
              write(arrayField, type[i + 1], element[arrayField]);
            }
          } else {
            write(type[0], type[1], element);
          }
        }
      } else {
        let optional = type?.indexOf('?') != -1;
        if (optional && value !== undefined)
          write(field, type?.replace('?', ''), value);
        else if (!optional)
          write(field, type, value);
      }
    }
  }
  static load(stream: Stream, schema: any): any {
    const read = (field: string, type: string) => {
      let subtype = stream.readType();
      if (subtype == null)
        throw new TypeError('field ' + field + ' of type ' + type + ' not found');

      let value: any = null;
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
            value = new Hashsig(value.length == Chain.size.HASHSIG ? value : Uint8Array.from([...value, ...new Array(Chain.size.HASHSIG - value.length).fill(0)]));
          break;
        case 'seckey':
          value = stream.readBinaryString(subtype);
          if (value != null)
            value = new Seckey(value.length == Chain.size.SECKEY ? value : Uint8Array.from([...value, ...new Array(Chain.size.SECKEY - value.length).fill(0)]));
          break;
        case 'pubkey':
          value = stream.readBinaryString(subtype);
          if (value != null)
            value = new Pubkey(value.length == Chain.size.PUBKEY ? value : Uint8Array.from([...value, ...new Array(Chain.size.PUBKEY - value.length).fill(0)]));
          break;
        case 'pubkeyhash':
          value = stream.readBinaryString(subtype);
          if (value != null)
            value = new Pubkeyhash(value.length == Chain.size.PUBKEYHASH ? value : Uint8Array.from([...value, ...new Array(Chain.size.PUBKEYHASH - value.length).fill(0)]));
          break;
        case 'assetid':
          value = stream.readInteger(subtype);
          if (value != null) {
            value = new AssetId(value.toUint8Array());
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
    let object: any = { };
    for (let field in schema) {
      let type = schema[field];
      if (Array.isArray(type)) {
        let subtype = stream.readType();
        if (subtype == null)
          throw new TypeError('field ' + field + ' size not found');
  
        const elements: any[] = [];
        const size = stream.readSafeInteger(subtype);
        if (typeof size == 'number' && size != null) {
          for (let i = 0; i < size; i++) {
            let element: any = { };
            if (type.length > 1 && type.length % 2 == 0) {
              for (let i = 0; i < type.length; i += 2) {
                const arrayField: string = type[i + 0];
                element[arrayField] = read(arrayField, type[i + 1]);
              }
            } else {
              element = read(type[0], type[1]);
            }
            elements.push(element);
          }
        }

        object[field] = elements;
      } else {
        console.log(schema, field, type);
        let optional = type?.indexOf('?') != -1;
        if (optional) {
          let seek = stream.seek;
          try {
            object[field] = read(field, type?.replace('?', ''));
          } catch {
            stream.seek = seek;
          }
        } else {
          object[field] = read(field, type);
        }
      }
    }
    return object;
  }
  static storeRollup(stream: Stream, object: any, schema: any, subtransactions: { args: any; schema: any; }[]) {
      let assets: Uint256[] = [], groups: Record<string, { args: any; schema: any; }[]> = { };
      for (let i = 0; i < subtransactions.length; i++) {
          const subtransaction = subtransactions[i];
          if (!(subtransaction.args?.asset instanceof AssetId))
              throw new Error('Field \'asset\' is required');
          
          const asset: Uint256 = subtransaction.args.asset.toUint256();
          const assetId: string = asset.toHex();
          let group = groups[assetId];
          if (!group) {
              assets.push(subtransaction.args.asset.toUint256());
              groups[assetId] = [subtransaction];
          } else {
              group.push(subtransaction);
          }
      }

      const emptySignature = new Hashsig();
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
              const internalTransaction = subtransaction.args.signature instanceof Hashsig ? subtransaction.args.signature.equals(emptySignature) : true;
              stream.writeBoolean(internalTransaction);
              stream.writeInteger(typeof type == 'string' ? Hashing.hash32(ByteUtil.byteStringToUint8Array(type)) : type);
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
  static loadRollup(stream: Stream, schema: any, typeToSchema: (type: number) => any): any {
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
        
        let nonce: Uint256 | null = null;
        let signature: Hashsig | null = null;
        if (!internalTransaction) {
          nonce = stream.readInteger(stream.readType() || Viewable.Invalid);
          if (!nonce)
            throw new TypeError('Field \'nonce[' + j + ']\' is required');

          let signatureValue = stream.readBinaryString(stream.readType() || Viewable.Invalid);
          if (!signatureValue)
            throw new TypeError('Field \'signature[' + j + ']\' is required');

          signature = new Hashsig(signatureValue.length == Chain.size.HASHSIG ? signatureValue : Uint8Array.from([...signatureValue, ...new Array(Chain.size.HASHSIG - signatureValue.length).fill(0)]));
        }

        const subschema = { ...typeToSchema(type.toInteger()) };
        for (let item in schema) {
          delete subschema[item];
        }

        const subtransaction = SchemaUtil.load(stream, subschema);
        subtransaction.type = type;
        subtransaction.asset = new AssetId(asset.toUint8Array());
        subtransaction.nonce = nonce;
        subtransaction.signature = signature;
        transaction.transactions.push(subtransaction);
      }
    }
    return transaction;
  }
  static storeArray(stream: Stream, data: any[], sized: boolean): void {
    if (sized)
      stream.writeInteger(data.length);
    
    for (let i = 0; i < data.length; i++) {
      const value = data[i];
      if ((value instanceof Uint256) || typeof value == 'number')
        stream.writeInteger(value);
      else if (BigNumber.isBigNumber(value))
        stream.writeDecimal(value);
      else if (value instanceof Uint8Array)
        stream.writeBinaryString(value);
      else if (typeof value == 'string')
        stream.writeString(value);
      else if (typeof value == 'boolean')
        stream.writeBoolean(value);
      else if (value instanceof Hashsig || value instanceof Seckey || value instanceof Pubkey || value instanceof Pubkeyhash)
        stream.writeBinaryStringOptimized(value.data);
      else if (value instanceof AssetId)
        stream.writeInteger(new Uint256(value.toUint8Array()));
      else
        throw new Error('array argument ' + i + ' is not serializable');
    }
  }
  static loadArray(stream: Stream, sized: boolean): any[] {
    let result: any[] = [];
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

        result.push(value.isLessThan(new BigNumber(Number.MAX_SAFE_INTEGER)) && (value.decimalPlaces() || 0) < 6 ? value.toNumber() : value.toString());
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

        result.push(ByteUtil.uint8ArrayToHexString(value));
      }
      else if (StreamUtil.isString10(type)) {
        let value = stream.readString(type);
        if (value == null)
          break;

        result.push(TextUtil.isAsciiEncoding(value) ? value : ByteUtil.uint8ArrayToHexString(ByteUtil.byteStringToUint8Array(value)));
      }
      else if (StreamUtil.isInteger(type)) {
        let value = stream.readSafeInteger(type);
        if (value == null)
          break;
        
        result.push(value);
      } else {
        throw new Error('array argument ' + i + ' is not deserializable');
      }
    }
    return result;
  }
}
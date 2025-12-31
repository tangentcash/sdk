"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Readability = void 0;
exports.lerp = lerp;
const algorithm_1 = require("./algorithm");
const schema_1 = require("./schema");
const assets_json_1 = __importDefault(require("./assets.json"));
const bignumber_js_1 = __importDefault(require("bignumber.js"));
function lerp(a, b, t) {
    return a * (1 - t) + b * t;
}
class Readability {
    static toAssetQuery(asset) {
        const token = asset.token || null;
        const chain = asset.chain || 'Unknown';
        const name = assets_json_1.default[token?.toUpperCase() || chain?.toUpperCase()];
        return name ? name + ' ' + (token || chain) : (token || chain);
    }
    static toAssetSymbol(asset) {
        return asset.token || asset.chain || '?';
    }
    static toAssetFallback(asset) {
        return this.toAssetSymbol(asset).substring(0, 3);
    }
    static toAssetImage(asset) {
        const target = this.toAssetSymbol(asset);
        return target.length > 0 && target != '?' ? '/cryptocurrency/' + target.toLowerCase() + '.svg' : '';
    }
    static toAssetName(asset, chainOnly) {
        const token = chainOnly ? null : asset.token || null;
        const chain = asset.chain || 'Unknown';
        if (token != null)
            return chain + ' ' + (assets_json_1.default[token.toUpperCase()] || token);
        return assets_json_1.default[chain.toUpperCase()] || chain;
    }
    static toTaggedAddress(tagAddress) {
        const [address, tag] = tagAddress.split('#');
        return { address: address, tag: tag || null };
    }
    static toTransactionType(type) {
        if (typeof type == 'string')
            return schema_1.Transactions.typenames[type] || 'Non-standard';
        for (let name in schema_1.Transactions.typenames) {
            if (algorithm_1.Hashing.hash32(algorithm_1.ByteUtil.byteStringToUint8Array(name)) == type) {
                return schema_1.Transactions.typenames[name];
            }
        }
        return 'Non-standard';
    }
    static toFunctionName(method) {
        let start = method.indexOf(' ');
        if (start != -1) {
            while (start + 1 < method.length && !method[start].trim().length)
                ++start;
            let end = method.indexOf('(', start);
            if (end != -1) {
                method = method.substring(start, end);
            }
        }
        method = method
            .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
            .replace(/([a-z\d])([A-Z])/g, '$1 $2')
            .replace(/_/g, ' ')
            .trim().toLowerCase();
        return method.length > 0 ? method[0].toUpperCase() + method.substring(1) : '';
    }
    static toSubscript(value) {
        let result = '';
        for (let i = 0; i < value.length; i++) {
            const char = this.subscripts[value[i]];
            if (typeof char == 'string')
                result += char;
        }
        return result;
    }
    static toValue(asset, value, delta, trailing) {
        if (value == null)
            return 'N/A';
        const numeric = new bignumber_js_1.default(bignumber_js_1.default.isBigNumber(value) ? value.toPrecision(12) : value);
        if (numeric.isNaN())
            return 'N/A';
        const places = numeric.decimalPlaces();
        const text = (places ? numeric.toFormat(places) : numeric.toString()).split('.');
        if (trailing && text.length < 2)
            text.push('0');
        if (text.length > 1) {
            let length = 0;
            while (text[1][length] == '0')
                ++length;
            if (length >= 3) {
                const zeros = length.toString();
                text[1] = '0' + this.toSubscript(zeros) + text[1].substring(length, length + 6);
            }
            else {
                text[1] = text[1].substring(0, Math.min(6, text[1].length));
            }
        }
        let symbol = asset ? this.toAssetSymbol(asset) : null;
        let result = text[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (text.length > 1 ? '.' + text[1] : '');
        if (symbol != null) {
            const prefix = this.prefixes[symbol];
            if (prefix != null) {
                result = prefix + result;
            }
            else {
                result += ' ' + symbol;
            }
        }
        return delta ? ((numeric.gt(0) ? '+' : '') + result) : result;
    }
    static toMoney(asset, value, delta) {
        return this.toValue(asset, value, delta || false, true);
    }
    static toUnit(value, delta) {
        if (value == null)
            return 'N/A';
        const numeric = bignumber_js_1.default.isBigNumber(value) ? value : new bignumber_js_1.default(value);
        const asset = new algorithm_1.AssetId();
        asset.chain = numeric.eq(1) ? 'unit' : 'units';
        return this.toValue(asset, numeric, delta || false, false);
    }
    static toGas(value, delta) {
        if (value == null)
            return 'N/A';
        const numeric = bignumber_js_1.default.isBigNumber(value) ? value : new bignumber_js_1.default(value);
        const asset = new algorithm_1.AssetId();
        asset.chain = numeric.eq(1) ? 'gas unit' : 'gas units';
        return this.toValue(asset, numeric, delta || false, false);
    }
    static toTimespan(value, delta) {
        if (value == null)
            return 'N/A';
        const numeric = bignumber_js_1.default.isBigNumber(value) ? value : new bignumber_js_1.default(value);
        const seconds = numeric.gte(1000);
        const asset = new algorithm_1.AssetId();
        asset.chain = seconds ? 'sec.' : 'ms';
        return this.toValue(asset, seconds ? numeric.dividedBy(1000) : numeric, delta || false, false);
    }
    static toTimePassed(time) {
        const diffInSeconds = Math.floor((new Date().getTime() - time.getTime()) / 1000);
        const seconds = diffInSeconds % 60;
        const minutes = Math.floor(diffInSeconds / 60) % 60;
        const hours = Math.floor(diffInSeconds / 3600) % 24;
        const days = Math.floor(diffInSeconds / 86400);
        if (days > 0) {
            return `${days} day${days !== 1 ? 's' : ''}`;
        }
        else if (hours > 0) {
            return `${hours} hour${hours !== 1 ? 's' : ''}`;
        }
        else if (minutes > 0) {
            return `${minutes} min.`;
        }
        else {
            return `${seconds} sec.`;
        }
    }
    static toCount(name, value, delta) {
        if (value == null)
            return 'N/A';
        const numeric = bignumber_js_1.default.isBigNumber(value) ? value : new bignumber_js_1.default(value);
        const asset = new algorithm_1.AssetId();
        asset.chain = numeric.eq(1) ? name : (name + 's');
        return this.toValue(asset, numeric, delta || false, false);
    }
    static toHash(value, size) {
        if (!value)
            return 'N/A';
        return value.length <= (size || 16) ? value : (value.substring(0, size || 16) + '...' + value.substring(value.length - (size || 16)));
    }
    static toAddress(value, size) {
        if (!value)
            return 'N/A';
        return value.length <= (size || 8) ? value : (value.substring(0, size || 8) + '...' + value.substring(value.length - (size || 8)));
    }
    static toPercentageDelta(prevValue, nextValue) {
        const delta = this.toPercentageDeltaNumber(prevValue, nextValue);
        return (delta.gt(0) ? '+' : '') + delta.toFixed(2) + '%';
    }
    static toPercentageDeltaNumber(prevValue, nextValue) {
        const prevNumeric = bignumber_js_1.default.isBigNumber(prevValue) ? prevValue : new bignumber_js_1.default(prevValue);
        const nextNumeric = bignumber_js_1.default.isBigNumber(nextValue) ? nextValue : new bignumber_js_1.default(nextValue);
        return prevNumeric.gt(0) ? nextNumeric.minus(prevNumeric).dividedBy(prevNumeric).multipliedBy(100) : new bignumber_js_1.default(0);
    }
}
exports.Readability = Readability;
Readability.subscripts = {
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
Readability.prefixes = {
    'USD': '$'
};

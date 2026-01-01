"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextUtil = void 0;
const bignumber_js_1 = __importDefault(require("bignumber.js"));
class TextUtil {
    static findFirstNotOf(data, alphabet, offset = 0) {
        for (let i = offset; i < data.length; ++i) {
            if (alphabet.indexOf(data[i]) == -1)
                return i;
        }
        return -1;
    }
    static isHexEncoding(data, strict = false) {
        if (!data.length || data.length % 2 != 0)
            return false;
        let prefix = data.length >= 2 && data[0] == '0' && data[1] == 'x';
        if (strict && !prefix)
            return false;
        return this.findFirstNotOf(prefix ? data.substring(2) : data, strict ? '0123456789abcdef' : '0123456789abcdefABCDEF') == -1;
    }
    static isAsciiEncoding(data) {
        return /^[\x00-\x7F]*$/.test(data);
    }
    static toValue(prevValue, nextValue) {
        try {
            if (!nextValue.length)
                return nextValue;
            let value = nextValue.trim();
            if (value.endsWith('.'))
                value += '0';
            const numeric = new bignumber_js_1.default(value, 10);
            if (numeric.isLessThan(0) || numeric.isNaN() || !numeric.isFinite())
                throw false;
            return nextValue;
        }
        catch {
            return prevValue;
        }
    }
    static toValueOrPercent(prevValue, nextValue) {
        if (nextValue.indexOf('%') == -1)
            return this.toValue(prevValue, nextValue);
        return this.toValue(prevValue.replace(/%/g, ''), nextValue.replace(/%/g, '')) + '%';
    }
    static toPercent(prevValue, nextValue) {
        if (!nextValue.length)
            return '';
        return this.toValue(prevValue.replace(/%/g, ''), nextValue.replace(/%/g, '')) + '%';
    }
    static toNumericValue(value) {
        return new bignumber_js_1.default(value.length > 0 ? value.replace(/%/g, '') : 0);
    }
    static toNumericValueOrPercent(value) {
        const isAbsolute = value.indexOf('%') == -1;
        const result = isAbsolute ? this.toNumericValue(value) : this.toNumericValue(value).dividedBy(100);
        return {
            relative: isAbsolute ? null : result,
            absolute: isAbsolute ? result : null,
            value: result
        };
    }
}
exports.TextUtil = TextUtil;

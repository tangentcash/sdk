"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Assetlist = void 0;
const assetlist_json_1 = __importDefault(require("./assetlist.json"));
class Assetlist {
    static toQuery(asset) {
        const token = asset.token || null;
        const chain = asset.chain || 'Unknown';
        const name = assetlist_json_1.default[token?.toUpperCase() || chain?.toUpperCase()];
        return name ? name + ' ' + (token || chain) : (token || chain);
    }
    static toName(asset, chainOnly, tokenOnly) {
        const token = chainOnly ? null : asset.token || null;
        const chain = asset.chain || 'Unknown';
        if (token != null)
            return tokenOnly ? (assetlist_json_1.default[token.toUpperCase()] || token) : (chain + ' ' + (assetlist_json_1.default[token.toUpperCase()] || token));
        return assetlist_json_1.default[chain.toUpperCase()] || chain;
    }
}
exports.Assetlist = Assetlist;

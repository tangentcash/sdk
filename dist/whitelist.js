"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Whitelist = void 0;
const algorithm_1 = require("./algorithm");
const whitelist_json_1 = __importDefault(require("./whitelist.json"));
class Whitelist {
    static tokens() {
        return this.whitelistOfTokens;
    }
    static ids() {
        if (!this.whitelistOfIds) {
            const result = new Set();
            for (let symbol in this.whitelistOfTokens) {
                const defs = this.whitelistOfTokens[symbol];
                for (let chain in defs) {
                    const contractAddress = defs[chain];
                    if (Array.isArray(contractAddress)) {
                        for (let i = 0; i < contractAddress.length; i++) {
                            result.add(algorithm_1.AssetId.fromHandle(chain, symbol, contractAddress[i]).id);
                        }
                    }
                    else {
                        result.add(algorithm_1.AssetId.fromHandle(chain, symbol, contractAddress).id);
                    }
                }
            }
            this.whitelistOfIds = result;
        }
        return this.whitelistOfIds;
    }
    static has(asset) {
        return !asset.token || !asset.checksum ? true : this.ids().has(asset.id);
    }
    static fake(asset, contractAddress) {
        return asset.token != null && !(contractAddress !== undefined ? contractAddress : this.contractAddressOf(asset)) && !!this.whitelistOfTokens[asset.token];
    }
    static contractAddressOf(asset) {
        let contractAddress = this.idToContractAddress[asset.id];
        if (typeof contractAddress != 'boolean' && typeof contractAddress != 'string')
            contractAddress = this.idToContractAddress[asset.id] = this.queryContractAddressOf(asset);
        return contractAddress;
    }
    static queryContractAddressOf(asset) {
        if (!asset.token || !asset.checksum)
            return true;
        const contracts = this.whitelistOfTokens[asset.token];
        if (!contracts)
            return false;
        for (let chain in contracts) {
            if (asset.chain != chain)
                continue;
            const target = contracts[chain];
            if (Array.isArray(target)) {
                for (let i = 0; i < target.length; i++) {
                    if (asset.checksum == algorithm_1.Hashing.atca160ascii(target[i]).substring(0, asset.checksum.length)) {
                        return target[i];
                    }
                }
            }
            else if (asset.checksum == algorithm_1.Hashing.atca160ascii(target).substring(0, asset.checksum.length)) {
                return target;
            }
        }
        return false;
    }
}
exports.Whitelist = Whitelist;
Whitelist.idToContractAddress = {};
Whitelist.whitelistOfTokens = whitelist_json_1.default;
Whitelist.whitelistOfIds = null;

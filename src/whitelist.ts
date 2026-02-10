import { AssetId, Hashing } from './algorithm';
import TokenWhitelist from './whitelist.json';

export class Whitelist {
    static whitelistOfTokens: Record<string, Record<string, string | string[]>> = TokenWhitelist;
    static whitelistOfIds: Set<string> | null = null;

    static tokens(): Record<string, Record<string, string | string[]>> {
        return this.whitelistOfTokens;
    }
    static ids(): Set<string> { 
        if (!this.whitelistOfIds) {
            const result = new Set<string>();
            for (let symbol in Whitelist) {
                const defs = (Whitelist as any)[symbol];
                for (let chain in defs) {
                    const contractAddress = defs[chain];
                    if (Array.isArray(contractAddress)) {
                        for (let i = 0; i < contractAddress.length; i++) {
                            result.add(AssetId.fromHandle(chain, symbol, contractAddress[i]).id);
                        }
                    } else {
                        result.add(AssetId.fromHandle(chain, symbol, contractAddress).id);
                    }
                }
            }
            this.whitelistOfIds = result;
        }
        return this.whitelistOfIds;
    }
    static has(asset: AssetId): boolean {
        return !asset.token || !asset.checksum ? true : this.ids().has(asset.id);
    }
    static contractAddressOf(asset: AssetId): boolean | string {
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
                    if (asset.checksum == Hashing.atca160ascii(target[i]).substring(0, asset.checksum.length)) {
                        return target[i];
                    }
                }
            } else if (asset.checksum == Hashing.atca160ascii(target).substring(0, asset.checksum.length)) {
                return target;
            }
        }

        return false;
    }
}
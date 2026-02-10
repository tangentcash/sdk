import { AssetId } from './algorithm';
export declare class Whitelist {
    static whitelistOfTokens: Record<string, Record<string, string | string[]>>;
    static whitelistOfIds: Set<string> | null;
    static tokens(): Record<string, Record<string, string | string[]>>;
    static ids(): Set<string>;
    static has(asset: AssetId): boolean;
    static contractAddressOf(asset: AssetId): boolean | string;
}

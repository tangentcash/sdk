import { AssetId } from './algorithm';
export declare class Whitelist {
    static idToContractAddress: Record<string, boolean | string>;
    static whitelistOfTokens: Record<string, Record<string, string | string[]>>;
    static whitelistOfIds: Set<string> | null;
    static tokens(): Record<string, Record<string, string | string[]>>;
    static ids(): Set<string>;
    static has(asset: AssetId): boolean;
    static fake(asset: AssetId, contractAddress?: string | boolean): boolean;
    static contractAddressOf(asset: AssetId): string | boolean;
    private static queryContractAddressOf;
}

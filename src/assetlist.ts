import { AssetId } from "./algorithm";
import TokenAssetlist from './assetlist.json';

export class Assetlist {
  static toQuery(asset: AssetId): string {
    const token: string | null = asset.token || null;
    const chain: string = asset.chain || 'Unknown';
    const name: string | null = (TokenAssetlist as Record<string, string>)[token?.toUpperCase() || chain?.toUpperCase()];
    return name ? name + ' ' + (token || chain) : (token || chain);
  }
  static toName(asset: AssetId, chainOnly?: boolean, tokenOnly?: boolean): string {
    const token: string | null = chainOnly ? null : asset.token || null;
    const chain: string = asset.chain || 'Unknown';
    if (token != null)
      return tokenOnly ? ((TokenAssetlist as Record<string, string>)[token.toUpperCase()] || token) : (chain + ' ' + ((TokenAssetlist as Record<string, string>)[token.toUpperCase()] || token));

    return (TokenAssetlist as Record<string, string>)[chain.toUpperCase()] || chain;
  }
}
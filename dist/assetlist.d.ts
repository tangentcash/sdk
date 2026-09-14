import { AssetId } from "./algorithm";
export declare class Assetlist {
    static toQuery(asset: AssetId): string;
    static toName(asset: AssetId, chainOnly?: boolean, tokenOnly?: boolean): string;
}

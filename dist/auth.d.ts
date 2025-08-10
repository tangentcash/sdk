import { Hashsig, Pubkey, Pubkeyhash } from './algorithm';
type Internal = {
    resolveTxt: ((hostname: string) => Promise<string[][]>) | null;
    createServer: ((callback: any) => any) | null;
};
export type Prompt = {
    url?: string;
};
export type Entity = {
    publicKey: Pubkey;
    hostname: string;
    trustless: boolean;
    message: string | null;
};
export type Approval = {
    account: Pubkeyhash;
    signature: Hashsig | null;
};
export declare class Authorizer {
    static internal: Internal;
    static config: {
        host: string;
        port: number;
    };
    static server: any | null;
    static decide: ((request: Entity) => Promise<Approval>) | null;
    static prompt(decide: (request: Entity) => Promise<Approval>): Promise<void>;
    static try(request: Prompt): Promise<boolean>;
    private static getPublicKeyFromTXT;
    private static isIpAddress;
}
export {};

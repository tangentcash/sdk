import { Hashsig, Pubkey, Pubkeyhash } from './algorithm';
export type Prompt = {
    url?: string;
};
export type Entity = {
    publicKey: Pubkey;
    hostname: string;
    trustless: boolean;
    reasoning: 'account' | 'identity' | 'message' | 'transaction';
    signable: string | null;
    favicon: string | null;
    description: string | null;
};
export type Approval = {
    account: Pubkeyhash;
    signature: Hashsig | null;
};
export type Implementation = {
    prompt: (request: Entity) => Promise<Approval>;
    resolveDomainTXT: (hostname: string) => Promise<string[]>;
};
export declare class NodeImplementation {
    static resolveTxt: any;
    static resolveDomainTXT(hostname: string): Promise<string[]>;
}
export declare class Authorizer {
    static implementation: Implementation | null;
    static applyImplementation(implementation: Implementation | null): void;
    static schema(entity: Entity): string;
    static try(request: Prompt): Promise<boolean>;
    private static isIpAddress;
}

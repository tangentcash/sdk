import { Hashsig, Pubkey, Pubkeyhash, Uint256 } from './algorithm';
export declare enum ApprovalType {
    account = "account",
    identity = "identity",
    message = "message",
    transaction = "transaction"
}
export type Prompt = {
    url?: string;
};
export type Entity = {
    proof: {
        publicKey: Pubkey;
        challenge: Uint8Array;
        signature: Hashsig;
        hostname: string;
        trustless: boolean;
    };
    about: {
        favicon: string | null;
        description: string | null;
    };
    sign: {
        message: Uint8Array | null;
    };
    kind: ApprovalType;
};
export type Approval = {
    account: Pubkeyhash;
    proof: {
        hash: Uint256 | null;
        message: Uint8Array | null;
        signature: Hashsig | null;
    };
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
    static schema(entity: Entity, signer?: Pubkeyhash): string;
    static try(request: Prompt): Promise<boolean>;
    private static isIpAddress;
}

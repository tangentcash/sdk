import { AssetId, Hashsig, Pubkey, Pubkeyhash, Uint256 } from './algorithm';
export declare enum Approving {
    account = "account",
    identity = "identity",
    message = "message",
    transaction = "transaction"
}
export type AuthPrompt = {
    url?: string;
};
export type AuthEntity = {
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
        asset: AssetId | null;
    };
    kind: Approving;
};
export type AuthApproval = {
    account: Pubkeyhash;
    proof: {
        hash: Uint256 | null;
        message: Uint8Array | null;
        signature: Hashsig | null;
    };
};
export type AuthRequest = {
    type: 'challenge';
    challenge: string;
} | {
    type: 'approval';
    challenge: string;
    account: string | null;
    proof: {
        hash: string | null;
        message: string | null;
        signature: string | null;
    };
} | {
    type: 'rejection';
    challenge: string;
    error: string;
};
export type AuthResponse = {
    proof?: {
        publicKey?: string;
        signature?: string;
    };
    about?: {
        favicon?: string;
        description?: string;
    };
    sign?: {
        message?: string;
        asset?: string;
    };
    kind?: string;
};
export type AuthImplementation = {
    prompt: (request: AuthEntity) => Promise<AuthApproval>;
    resolveDomainTXT: (hostname: string) => Promise<string[]>;
};
export declare class NodeImplementation {
    static resolveTxt: any;
    static resolveDomainTXT(hostname: string): Promise<string[]>;
}
export declare class Authorizer {
    static implementation: AuthImplementation | null;
    static applyImplementation(implementation: AuthImplementation | null): void;
    static schema(entity: AuthEntity, signer?: Pubkeyhash): string;
    static try(request: AuthPrompt): Promise<boolean>;
    static isIpAddress(ip: string): boolean;
}

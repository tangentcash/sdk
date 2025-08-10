import { Hashsig, Pubkey, Pubkeyhash } from './algorithm';
export type Prompt = {
    url?: string;
};
export type Entity = {
    publicKey: Pubkey;
    hostname: string;
    trustless: boolean;
    signable: string | null;
    description: string | null;
};
export type Approval = {
    account: Pubkeyhash;
    signature: Hashsig | null;
};
export type Implementation = {
    prompt: (request: Entity) => Promise<Approval>;
    serveTryFunction: (host: string, port: number, action: (args: any) => Promise<any>) => Promise<any>;
    resolveDomainTXT: (hostname: string) => Promise<string[]>;
};
export declare class NodeImplementation {
    static createServer: any;
    static resolveTxt: any;
    static serveTryFunction(host: string, port: number, action: (args: any) => Promise<any>): Promise<any>;
    static resolveDomainTXT(hostname: string): Promise<string[]>;
}
export declare class Authorizer {
    static config: {
        host: string;
        port: number;
    };
    static implementation: Implementation | null;
    static prompt(implementation: Implementation | null): Promise<void>;
    static try(request: Prompt): Promise<boolean>;
    private static isIpAddress;
}

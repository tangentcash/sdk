import jayson from 'jayson';
import dgram from 'dgram';
import { Hashsig, Pubkey, Pubkeyhash } from './algorithm';
export declare const discoveryMessage = "tangent::authorizer";
export type AuthRequest = {
    publicKey: Pubkey;
    hostname: string;
    trustless: boolean;
};
export type AuthResponse = {
    account: Pubkeyhash;
    signature: Hashsig | null;
};
export declare class Authorizer {
    static config: {
        host: string;
        port: number;
    };
    static server: {
        rpc: jayson.HttpServer;
        discovery: dgram.Socket;
    } | null;
    static decide: ((request: AuthRequest) => Promise<AuthResponse>) | null;
    static prompt(decide: (request: AuthRequest) => Promise<AuthResponse>): Promise<void>;
    static discover(timeout?: number): Promise<string | null>;
    static try(authorizerURL: URL, solverURL: URL): Promise<any>;
    private static authorize;
    private static getPublicKeyFromTXT;
    private static isIpAddress;
}

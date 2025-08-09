import jayson from 'jayson';
import dgram from 'dgram';
import { resolveTxt } from 'dns/promises';
import { ByteUtil, Hashing, Pubkey, Pubkeyhash, Recsighash, Signing, Uint256 } from './algorithm';
import { randomBytes } from '@noble/hashes/utils';

export const discoveryMessage = 'tangent::authorizer';

export type AuthRequest = {
    publicKey: Pubkey;
    hostname: string;
    trustless: boolean;
}

export type AuthResponse = {
    account: Pubkeyhash,
    derivation: Pubkeyhash | null,
    signature: Recsighash | null
}

export class Authorizer {
    static config = { host: '0.0.0.0', port: 57673 };
    static server: { rpc: jayson.HttpServer, discovery: dgram.Socket } | null = null;
    static decide: ((request: AuthRequest) => Promise<AuthResponse>) | null = null;

    static async prompt(decide: (request: AuthRequest) => Promise<AuthResponse>): Promise<void> {
        this.decide = decide;
        if (this.decide != null) {
            if (!this.server) {
                const server = this.server = {
                    rpc: new jayson.Server({
                        authorize: async (args: any[], reply: (error: { code: number, message: string } | null, value: any) => void): Promise<void> => {
                            try {
                                reply(null, await this.authorize(args));
                            } catch (exception: any) {
                                reply({ code: -Hashing.hash32(ByteUtil.byteStringToUint8Array(exception.message)), message: exception.message }, null);
                            }
                        }
                    }).http(),
                    discovery: dgram.createSocket('udp4')
                };
                server.discovery.on('message', (message, _) => {
                    if (message.toString() == discoveryMessage) {
                        server.discovery.send(message);
                    }
                });
                await new Promise<void>((resolve) => server.rpc.listen(this.config.port, this.config.host, resolve));
            }
        } else if (this.server != null) {
            await new Promise<void>((resolve, _) => this.server?.discovery.close(() => resolve()));
            await new Promise<void>((resolve, reject) => this.server?.rpc.close((error) => error ? reject(error) : resolve()));
            this.server = null;
        }
    }
    static async discover(timeout: number = 5000): Promise<string | null> {
        try {
            const client = dgram.createSocket('udp4');
            client.setBroadcast(true);

            const result = new Promise<string | null>((resolve, _) => {
                const timer = setTimeout(() => {
                    resolve(null);
                    client.close();
                }, timeout);
                client.on('message', (message, rinfo) => {
                    if (message.toString() == discoveryMessage) {
                        client.close();
                        clearTimeout(timer);
                        resolve(`http://${rinfo.address}:${this.config.port}/`);
                    }
                });
            });
            await new Promise((resolve, reject) => client.send(discoveryMessage, this.config.port, '255.255.255.255', (err) => err ? reject(err) : resolve(undefined)));
            return await result;
        } catch (exception: any) {
            throw new Error('Discovery failed: ' + exception.message);
        }
    }
    static async try(authorizerURL: URL, solverURL: URL): Promise<any> {
        const response = await (await fetch(authorizerURL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: "2.0",
                id: ByteUtil.uint8ArrayToHexString(randomBytes(8)),
                method: "authorize",
                params: [solverURL.toString()]
            })
        })).json();
        return response;
    }
    private static async authorize(args: any[]): Promise<any> {
        if (args.length != 1)
            throw new Error('Exactly 1 argument expected (url: string_uri)');
        else if (!this.decide)
            throw new Error('Authorization disabled');
        
        try {
            let url: URL;
            try { url = new URL(args[0]) } catch { throw new Error('Not a valid URL') };

            const challenge = Hashing.hash256(Uint8Array.from([...randomBytes(32), ...Hashing.hash256(ByteUtil.byteStringToUint8Array(url.toString()))]));
            const solution = await (await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'challenge',
                    challenge: ByteUtil.uint8ArrayToHexString(challenge)
                })
            })).json();
            if (typeof solution.signature != 'string')
                throw new Error('Server failed to respond with challenge solution');

            const signature = new Recsighash(ByteUtil.hexStringToUint8Array(solution.challenge));
            const publicKey = Signing.recover(new Uint256(challenge), signature);
            if (!publicKey)
                throw new Error('Signature is not acceptable');

            const domainPublicKey = this.isIpAddress(url.hostname) ? await this.getPublicKeyFromTXT(url.hostname) : null;
            let result: AuthResponse;
            try {
                result = await this.decide({
                    publicKey: publicKey,
                    hostname: url.hostname,
                    trustless: domainPublicKey != null && domainPublicKey.equals(publicKey)
                });
            } catch {
                throw new Error('Operation not permitted (user rejected)');
            }
            
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'confirmation',
                    account: Signing.encodeSubaddress(result.account, result.derivation || undefined),
                    signature: result.signature != null ? ByteUtil.uint8ArrayToHexString(result.signature.data) : null
                })
            });
            return await response.json();
        } catch (exception: any) {
            throw new Error('Authorization failed: ' + exception.message);
        }
    }
    private static async getPublicKeyFromTXT(hostname: string): Promise<Pubkey> {
        try {
            const records = await resolveTxt(hostname);
            for (let i = 0; i < records.length; i++) {
                const subRecords = records[i];
                for (let j = 0; j < subRecords.length; j++) {
                    const publicKey = Signing.decodePublicKey(subRecords[j]);
                    if (publicKey != null) {
                        return publicKey;
                    }
                }
            }
        } catch { }
        throw new Error('Provided domain name does not have a tangent encoded public key TXT record');
    }
    private static isIpAddress(ip: string): boolean {
        const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (ipv4Regex.test(ip) && ip.split('.').every((x: string) => parseInt(x) <= 255))
            return true;

        const cleanIp = ip.replace(/^\[|\]$/g, '');
        const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
        const compressedIpv6Regex = /^([0-9a-fA-F]{1,4}:)*::([0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4}$/;       
        return ipv6Regex.test(cleanIp) || compressedIpv6Regex.test(cleanIp);
    }
}
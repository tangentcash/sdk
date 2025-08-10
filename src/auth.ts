import { ByteUtil, Hashing, Hashsig, Pubkey, Pubkeyhash, Signing, Uint256 } from './algorithm';
import { randomBytes } from '@noble/hashes/utils';

export type Prompt = {
    url?: string;
}

export type Entity = {
    publicKey: Pubkey;
    hostname: string;
    trustless: boolean;
    signable: string | null;
    description: string | null;
}

export type Approval = {
    account: Pubkeyhash,
    signature: Hashsig | null
}

export type Implementation = {
    prompt: (request: Entity) => Promise<Approval>,
    serveTryFunction: (host: string, port: number, action: (args: any) => Promise<any>) => Promise<any>,
    resolveDomainTXT: (hostname: string) => Promise<string[]>
};

export class NodeImplementation {
    static createServer: any = null;
    static resolveTxt: any = null;

    static async serveTryFunction(host: string, port: number, action: (args: any) => Promise<any>): Promise<any> {
        if (!this.createServer)
            this.createServer = (await import('http')).createServer;

        const server = this.createServer(async (req: any, res: any) => {
            try {
                if (req.method != 'POST')
                    throw new Error('Only POST method is allowed');

                const result = JSON.stringify(await action(JSON.parse(await new Promise((resolve, reject) => {
                    let body = '';
                    req.on('data', (chunk: any) => body += chunk.toString());
                    req.on('end', () => resolve(body));
                    req.on('error', reject);
                }))));
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(result);
            } catch (exception: any) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: exception.message }));
            }
        });
        await new Promise<void>((resolve) => server.listen(port, host, resolve));
        return server;
    }
    static async resolveDomainTXT(hostname: string): Promise<string[]> {
        if (!this.resolveTxt)
            this.resolveTxt = (await import('dns/promises')).resolveTxt;

        const result = await this.resolveTxt(hostname);
        return result.flat();
    }
}

export class Authorizer {
    static config = { host: 'localhost', port: 57673 };
    static implementation: Implementation | null;

    static async prompt(implementation: Implementation | null): Promise<void> {
        this.implementation = implementation;
        if (this.implementation != null) {
            await this.implementation.serveTryFunction(this.config.host, this.config.port, this.try);
        }
    }
    static async try(request: Prompt): Promise<boolean> {
        let url: URL;
        try {
            url = new URL(request.url || '');
        } catch {
            return false;
        }

        try {
            const challenge = Hashing.hash256(Uint8Array.from([...randomBytes(32), ...Hashing.hash256(ByteUtil.byteStringToUint8Array(url.toString()))]));
            const challenge16 = ByteUtil.uint8ArrayToHexString(challenge);
            const solution: { signature?: string, message?: string, description?: string } = await (await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'challenge',
                    challenge: challenge16
                })
            })).json();         
        
            let result: { type: 'approval', challenge: string, account: string | null, signature: string | null } | { type: 'rejection', challenge: string, error: string };
            try {
                if (typeof solution.signature != 'string')
                    throw new Error('Challenge response must contain "signature" hex string');

                if (solution.message != null && typeof solution.message != 'string')
                    throw new Error('Challenge response "message" must be a hex string');

                if (solution.description != null && typeof solution.description != 'string')
                    throw new Error('Challenge response "description" must be a string');

                const publicKey = Signing.recover(new Uint256(challenge), new Hashsig(ByteUtil.hexStringToUint8Array(solution.signature)));
                if (!publicKey)
                    throw new Error('Challenge signature is not acceptable');

                try {
                    if (!this.implementation)
                        throw new Error('account sharing refused');

                    const domainPublicKey = this.isIpAddress(url.hostname) ? (await this.implementation.resolveDomainTXT(url.hostname)).map((x) => Signing.decodePublicKey(x)).filter((x) => x != null)[0] || null : null;
                    const decision = await this.implementation.prompt({
                        publicKey: publicKey,
                        hostname: url.hostname,
                        trustless: domainPublicKey != null && domainPublicKey.equals(publicKey),
                        signable: solution.message || null,
                        description: solution.description || null
                    });
                    if (solution.message != null && !decision.signature)
                        throw new Error('message signing refused');

                    result = {
                        type: 'approval',
                        challenge: challenge16,
                        account: Signing.encodeAddress(decision.account),
                        signature: decision.signature != null ? ByteUtil.uint8ArrayToHexString(decision.signature.data) : null
                    };
                } catch (exception: any) {
                    throw new Error(exception.message ? 'User rejection: ' + exception.message : 'User rejection');
                }
            } catch (exception: any) {
                result = {
                    type: 'rejection',
                    challenge: challenge16,
                    error: exception.message
                }
            }

            try {
                await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(result)
                });
                return true;
            } catch {
                return false;
            }
        } catch {
            return false;
        }
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
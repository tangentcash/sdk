import { ByteUtil, Hashing, Hashsig, Pubkey, Pubkeyhash, Signing, Uint256 } from './algorithm';
import { randomBytes } from '@noble/hashes/utils';

type Internal = {
    resolveTxt: ((hostname: string) => Promise<string[][]>) | null,
    createServer: ((callback: any) => any) | null
}

export type Prompt = {
    url?: string;
}

export type Entity = {
    publicKey: Pubkey;
    hostname: string;
    trustless: boolean;
    message: string | null;
}

export type Approval = {
    account: Pubkeyhash,
    signature: Hashsig | null
}

export class Authorizer {
    static internal: Internal = {
        resolveTxt: null,
        createServer: null
    };
    static config = { host: 'localhost', port: 57673 };
    static server: any | null = null;
    static decide: ((request: Entity) => Promise<Approval>) | null = null;

    static async prompt(decide: (request: Entity) => Promise<Approval>): Promise<void> {
        this.decide = decide;
        if (this.decide != null) {
            if (!this.server) {
                try {
                    if (!this.internal.createServer)
                        this.internal.createServer = (await import('http')).createServer;
                } catch {
                    return;
                }

                this.server = this.internal.createServer(async (req: any, res: any) => {
                    try {
                        if (req.method != 'POST')
                            throw new Error('Only POST method is allowed');

                        const result = JSON.stringify(await this.try(JSON.parse(await new Promise((resolve, reject) => {
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
                await new Promise<void>((resolve) => this.server.listen(this.config.port, this.config.host, resolve));
            }
        } else if (this.server != null) {
            await new Promise<void>((resolve, reject) => this.server.close((error: any) => error ? reject(error) : resolve()));
            this.server = null;
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
            const solution: { signature?: string, message?: string } = await (await fetch(url, {
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
                    throw new Error('Challenge response must contain "message" hex string');

                const publicKey = Signing.recover(new Uint256(challenge), new Hashsig(ByteUtil.hexStringToUint8Array(solution.signature)));
                if (!publicKey)
                    throw new Error('Challenge signature is not acceptable');

                try {
                    if (!this.decide)
                        throw new Error('account sharing refused');

                    const domainPublicKey = this.isIpAddress(url.hostname) ? await this.getPublicKeyFromTXT(url.hostname) : null;
                    const decision = await this.decide({
                        publicKey: publicKey,
                        hostname: url.hostname,
                        trustless: domainPublicKey != null && domainPublicKey.equals(publicKey),
                        message: solution.message || null
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
    private static async getPublicKeyFromTXT(hostname: string): Promise<Pubkey | null> {
        try {
            if (!this.internal.resolveTxt)
                this.internal.resolveTxt = (await import('dns/promises')).resolveTxt;

            const records = await this.internal.resolveTxt(hostname);
            for (let i = 0; i < records.length; i++) {
                const subRecords = records[i];
                for (let j = 0; j < subRecords.length; j++) {
                    const publicKey = Signing.decodePublicKey(subRecords[j]);
                    if (publicKey != null) {
                        return publicKey;
                    }
                }
            }

            return null;
        } catch (exception: any) {
            throw new Error('DNS resolution failed: ' + exception.message);
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
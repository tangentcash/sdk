import { ByteUtil, Hashing, Hashsig, Pubkey, Pubkeyhash, Signing, Uint256 } from './algorithm';
import { randomBytes } from '@noble/hashes/utils';

export enum Approving {
    account = 'account',
    identity = 'identity',
    message = 'message',
    transaction = 'transaction'
}

export type AuthPrompt = {
    url?: string;
}

export type AuthEntity = {
    proof: { publicKey: Pubkey, challenge: Uint8Array, signature: Hashsig, hostname: string, trustless: boolean },
    about: { favicon: string | null, description: string | null },
    sign: { message: Uint8Array | null }
    kind: Approving;
}

export type AuthApproval = {
    account: Pubkeyhash,
    proof: {
        hash: Uint256 | null,
        message: Uint8Array | null,
        signature: Hashsig | null
    }
}

export type AuthRequest = {
    type: 'challenge',
    challenge: string,
} | {
    type: 'approval',
    challenge: string,
    account: string | null,
    proof: {
        hash: string | null,
        message: string | null,
        signature: string | null
    }
} | {
    type: 'rejection',
    challenge: string,
    error: string
}

export type AuthResponse = {
    proof?: { publicKey?: string, signature?: string },
    about?: { favicon?: string, description?: string },
    sign?: { message?: string },
    kind?: string
}

export type AuthImplementation = {
    prompt: (request: AuthEntity) => Promise<AuthApproval>,
    resolveDomainTXT: (hostname: string) => Promise<string[]>
};

export class NodeImplementation {
    static resolveTxt: any = null;

    static async resolveDomainTXT(hostname: string): Promise<string[]> {
        if (!this.resolveTxt)
            this.resolveTxt = (await import('dns/promises')).resolveTxt;

        const result = await this.resolveTxt(hostname);
        return result.flat();
    }
}

export class Authorizer {
    static implementation: AuthImplementation | null;

    static applyImplementation(implementation: AuthImplementation | null): void {
        this.implementation = implementation;
    }
    static schema(entity: AuthEntity, signer?: Pubkeyhash): string {
        const publicKey = entity.proof.publicKey.equals(new Pubkey()) ? '' : Signing.encodePublicKey(entity.proof.publicKey) || '';
        const result = new URL(`tangent://${publicKey ? publicKey + '@' : ''}${entity.proof.hostname}/approve/${entity.kind}`);
        const params = new URLSearchParams();
        params.append('proof.security', entity.proof.trustless ? 'safe' : 'unsafe');
        params.append('proof.challenge', ByteUtil.uint8ArrayToHexString(entity.proof.challenge));
        params.append('proof.signature', ByteUtil.uint8ArrayToHexString(entity.proof.signature.data));
        if (entity.sign.message != null)
            params.append('sign.message', ByteUtil.uint8ArrayToHexString(entity.sign.message));
        if (entity.about.favicon != null)
            params.append('about.favicon', entity.about.favicon);
        if (entity.about.description != null)
            params.append('about.description', entity.about.description);
        if (signer != null)
            params.append('signer', Signing.encodeAddress(signer) || '');
        return result.toString() + '?' + params.toString();
    }
    static async try(request: AuthPrompt): Promise<boolean> {
        if (!this.implementation)
            return false;

        let url: URL;
        try {
            url = new URL(request.url || '');
        } catch {
            return false;
        }

        try {
            const challenge = Hashing.hash256(Uint8Array.from([...randomBytes(32), ...Hashing.hash256(ByteUtil.byteStringToUint8Array(url.toString()))]));
            const challengeRequest: AuthRequest = {
                type: 'challenge',
                challenge: ByteUtil.uint8ArrayToHexString(challenge)
            };
            const solution: AuthResponse = await (await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(challengeRequest)
            })).json();     
            const entity: AuthEntity = {
                proof: {
                    publicKey: new Pubkey(solution.proof?.publicKey),
                    challenge: challenge,
                    signature: new Hashsig(),
                    hostname: url.hostname,
                    trustless: true
                },
                about: {
                    favicon: solution.about && typeof solution.about.favicon == 'string' ? solution.about.favicon || null : null,
                    description: solution.about && typeof solution.about.description == 'string' ? solution.about.description || null : null
                },
                sign: {
                    message: solution.sign && typeof solution.sign.message == 'string' ? ByteUtil.hexStringToUint8Array(solution.sign.message) || null : null
                },
                kind: typeof solution.kind == 'string' ? solution.kind as Approving : Approving.account
            };
            let acknowledgementRequest: AuthRequest;
            try {
                if (![Approving.account, Approving.identity, Approving.message, Approving.transaction].includes(entity.kind))
                    throw new Error('Invalid kind of entity (must be a valid type)');
                
                if (entity.about.favicon != null) {
                    try {
                        new URL (entity.about.favicon);
                    } catch {
                        throw new Error('Invalid favicon (must be a valid URL)');
                    }
                }

                const signature = solution.proof && typeof solution.proof.signature == 'string' ? new Hashsig(ByteUtil.hexStringToUint8Array(solution.proof.signature)) || new Hashsig() : new Hashsig();
                const message = this.schema(entity);
                const messageHash = new Uint256(Hashing.hash256(ByteUtil.byteStringToUint8Array(message)));
                const publicKey = Signing.recover(messageHash, signature);
                if (!publicKey)
                    throw new Error('Invalid signature (not acceptable for message "' + message + '")');

                try {
                    const domainPublicKey = this.isIpAddress(url.hostname) ? null : (await this.implementation.resolveDomainTXT(url.hostname)).map((x) => Signing.decodePublicKey(x)).filter((x) => x != null)[0] || null;
                    entity.proof.signature = signature;
                    entity.proof.trustless = entity.proof.publicKey.equals(publicKey) && domainPublicKey != null && domainPublicKey.equals(publicKey);

                    const decision = await this.implementation.prompt(entity);
                    if (entity.sign.message != null && (!decision.proof.hash || !decision.proof.message || !decision.proof.signature))
                        throw new Error('message signing refused');

                    acknowledgementRequest = {
                        type: 'approval',
                        challenge: ByteUtil.uint8ArrayToHexString(entity.proof.challenge),
                        account: Signing.encodeAddress(decision.account),
                        proof: {
                            hash: decision.proof.hash != null ? decision.proof.hash.toHex() : null,
                            message: decision.proof.message != null ? ByteUtil.uint8ArrayToHexString(decision.proof.message) : (entity.sign.message ? ByteUtil.uint8ArrayToHexString(entity.sign.message) : null),
                            signature: decision.proof.signature != null ? ByteUtil.uint8ArrayToHexString(decision.proof.signature.data) : null
                        }
                    };
                } catch (exception: any) {
                    throw new Error(exception.message ? 'User rejection: ' + exception.message : 'User rejection');
                }
            } catch (exception: any) {
                acknowledgementRequest = {
                    type: 'rejection',
                    challenge: ByteUtil.uint8ArrayToHexString(entity.proof.challenge),
                    error: exception.message     
                }
            }

            try {
                await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(acknowledgementRequest)
                });
                return acknowledgementRequest.type == 'approval';
            } catch {
                return false;
            }
        } catch {
            return false;
        }
    }
    static isIpAddress(ip: string): boolean {
        const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (ipv4Regex.test(ip) && ip.split('.').every((x: string) => parseInt(x) <= 255))
            return true;

        const cleanIp = ip.replace(/^\[|\]$/g, '');
        const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
        const compressedIpv6Regex = /^([0-9a-fA-F]{1,4}:)*::([0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4}$/;       
        return ipv6Regex.test(cleanIp) || compressedIpv6Regex.test(cleanIp);
    }
}
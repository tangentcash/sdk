import { ByteUtil, Hashing, Hashsig, Pubkey, Pubkeyhash, Signing, Uint256 } from './algorithm';
import { randomBytes } from '@noble/hashes/utils';

export enum ApprovalType {
    account = 'account',
    identity = 'identity',
    message = 'message',
    transaction = 'transaction'
}

export type Prompt = {
    url?: string;
}

export type Entity = {
    proof: { publicKey: Pubkey, challenge: Uint8Array, signature: Hashsig, hostname: string, trustless: boolean },
    about: { favicon: string | null, description: string | null },
    sign: { message: Uint8Array | null }
    kind: ApprovalType;
}

export type Approval = {
    account: Pubkeyhash,
    proof: { message: Uint8Array | null, signature: Hashsig | null }
}

export type Implementation = {
    prompt: (request: Entity) => Promise<Approval>,
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
    static implementation: Implementation | null;

    static applyImplementation(implementation: Implementation | null): void {
        this.implementation = implementation;
    }
    static schema(entity: Entity): string {
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
        return result.toString() + '?' + params.toString();
    }
    static async try(request: Prompt): Promise<boolean> {
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
            const solution: {
                proof?: { signature?: string },
                about?: { favicon?: string, description?: string },
                sign?: { message?: string },
                kind?: string
            } = await (await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'challenge',
                    challenge: ByteUtil.uint8ArrayToHexString(challenge)
                })
            })).json();     
            const entity: Entity = {
                proof: {
                    publicKey: new Pubkey(),
                    challenge: challenge,
                    signature: solution.proof && typeof solution.proof.signature == 'string' ? new Hashsig(ByteUtil.hexStringToUint8Array(solution.proof.signature)) || new Hashsig() : new Hashsig(),
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
                kind: typeof solution.kind == 'string' ? solution.kind as ApprovalType : ApprovalType.account
            };
            let result: { type: 'approval', challenge: string, account: string | null, proof: { message: string | null, signature: string | null } } | { type: 'rejection', challenge: string, error: string };
            try {
                if (![ApprovalType.account, ApprovalType.identity, ApprovalType.message, ApprovalType.transaction].includes(entity.kind))
                    throw new Error('Invalid kind of entity (must be a valid type)');

                if (entity.about.favicon != null) {
                    try {
                        new URL (entity.about.favicon);
                    } catch {
                        throw new Error('Invalid favicon (must be a valid URL)');
                    }
                }

                const message = this.schema(entity);
                const messageHash = new Uint256(Hashing.hash256(ByteUtil.byteStringToUint8Array(message)));
                const publicKey = Signing.recover(messageHash, entity.proof.signature);
                if (!publicKey)
                    throw new Error('Invalid signature (not acceptable for message "' + message + '")');

                try {
                    const domainPublicKey = this.isIpAddress(url.hostname) ? (await this.implementation.resolveDomainTXT(url.hostname)).map((x) => Signing.decodePublicKey(x)).filter((x) => x != null)[0] || null : null;
                    entity.proof.publicKey = publicKey;
                    entity.proof.trustless = domainPublicKey != null && domainPublicKey.equals(publicKey);

                    const decision = await this.implementation.prompt(entity);
                    if (entity.sign.message != null && !decision.proof.signature)
                        throw new Error('message signing refused');

                    result = {
                        type: 'approval',
                        challenge: ByteUtil.uint8ArrayToHexString(entity.proof.challenge),
                        account: Signing.encodeAddress(decision.account),
                        proof: {
                            message: decision.proof.message != null ? ByteUtil.uint8ArrayToHexString(decision.proof.message) : (entity.sign.message ? ByteUtil.uint8ArrayToHexString(entity.sign.message) : null),
                            signature: decision.proof.signature != null ? ByteUtil.uint8ArrayToHexString(decision.proof.signature.data) : null
                        }
                    };
                } catch (exception: any) {
                    throw new Error(exception.message ? 'User rejection: ' + exception.message : 'User rejection');
                }
            } catch (exception: any) {
                result = {
                    type: 'rejection',
                    challenge: ByteUtil.uint8ArrayToHexString(entity.proof.challenge),
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
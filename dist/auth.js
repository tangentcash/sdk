"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Authorizer = exports.NodeImplementation = exports.Approving = void 0;
const algorithm_1 = require("./algorithm");
const utils_1 = require("@noble/hashes/utils");
var Approving;
(function (Approving) {
    Approving["account"] = "account";
    Approving["identity"] = "identity";
    Approving["message"] = "message";
    Approving["transaction"] = "transaction";
})(Approving || (exports.Approving = Approving = {}));
class NodeImplementation {
    static async resolveDomainTXT(hostname) {
        if (!this.resolveTxt)
            this.resolveTxt = (await Promise.resolve().then(() => __importStar(require('dns/promises')))).resolveTxt;
        const result = await this.resolveTxt(hostname);
        return result.flat();
    }
}
exports.NodeImplementation = NodeImplementation;
NodeImplementation.resolveTxt = null;
class Authorizer {
    static applyImplementation(implementation) {
        this.implementation = implementation;
    }
    static schema(entity, signer) {
        const publicKey = entity.proof.publicKey.equals(new algorithm_1.Pubkey()) ? '' : algorithm_1.Signing.encodePublicKey(entity.proof.publicKey) || '';
        const result = new URL(`tangent://${publicKey ? publicKey + '@' : ''}${entity.proof.hostname}/approve/${entity.kind}`);
        const params = new URLSearchParams();
        params.append('proof.security', entity.proof.trustless ? 'safe' : 'unsafe');
        params.append('proof.challenge', algorithm_1.ByteUtil.uint8ArrayToHexString(entity.proof.challenge));
        params.append('proof.signature', algorithm_1.ByteUtil.uint8ArrayToHexString(entity.proof.signature.data));
        if (entity.sign.message != null)
            params.append('sign.message', algorithm_1.ByteUtil.uint8ArrayToHexString(entity.sign.message));
        if (entity.about.favicon != null)
            params.append('about.favicon', entity.about.favicon);
        if (entity.about.description != null)
            params.append('about.description', entity.about.description);
        if (signer != null)
            params.append('signer', algorithm_1.Signing.encodeAddress(signer) || '');
        return result.toString() + '?' + params.toString();
    }
    static async try(request) {
        if (!this.implementation)
            return false;
        let props = {};
        let url;
        try {
            url = new URL(request.url || '');
            url.searchParams.forEach((v, k) => props[k] = v);
            url.search = '';
        }
        catch {
            return false;
        }
        try {
            const challenge = algorithm_1.Hashing.hash256(Uint8Array.from([...(0, utils_1.randomBytes)(32), ...algorithm_1.Hashing.hash256(algorithm_1.ByteUtil.byteStringToUint8Array(url.toString()))]));
            const challengeRequest = {
                type: 'challenge',
                challenge: algorithm_1.ByteUtil.uint8ArrayToHexString(challenge),
                props: props
            };
            const solution = await (await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(challengeRequest)
            })).json();
            const entity = {
                proof: {
                    publicKey: new algorithm_1.Pubkey(solution.proof?.publicKey),
                    challenge: challenge,
                    signature: new algorithm_1.Hashsig(),
                    hostname: url.hostname,
                    trustless: true
                },
                about: {
                    favicon: solution.about && typeof solution.about.favicon == 'string' ? solution.about.favicon || null : null,
                    description: solution.about && typeof solution.about.description == 'string' ? solution.about.description || null : null
                },
                sign: {
                    message: solution.sign && typeof solution.sign.message == 'string' ? algorithm_1.ByteUtil.hexStringToUint8Array(solution.sign.message) || null : null
                },
                kind: typeof solution.kind == 'string' ? solution.kind : Approving.account
            };
            let acknowledgementRequest;
            try {
                if (![Approving.account, Approving.identity, Approving.message, Approving.transaction].includes(entity.kind))
                    throw new Error('Invalid kind of entity (must be a valid type)');
                if (entity.about.favicon != null) {
                    try {
                        new URL(entity.about.favicon);
                    }
                    catch {
                        throw new Error('Invalid favicon (must be a valid URL)');
                    }
                }
                const signature = solution.proof && typeof solution.proof.signature == 'string' ? new algorithm_1.Hashsig(algorithm_1.ByteUtil.hexStringToUint8Array(solution.proof.signature)) || new algorithm_1.Hashsig() : new algorithm_1.Hashsig();
                const message = this.schema(entity);
                const messageHash = new algorithm_1.Uint256(algorithm_1.Hashing.hash256(algorithm_1.ByteUtil.byteStringToUint8Array(message)));
                console.log(messageHash.toHex(), algorithm_1.ByteUtil.uint8ArrayToHexString(signature.data));
                const publicKey = algorithm_1.Signing.recover(messageHash, signature);
                if (!publicKey)
                    throw new Error('Invalid signature (not acceptable for message "' + message + '")');
                try {
                    const domainPublicKey = this.isIpAddress(url.hostname) ? (await this.implementation.resolveDomainTXT(url.hostname)).map((x) => algorithm_1.Signing.decodePublicKey(x)).filter((x) => x != null)[0] || null : null;
                    entity.proof.signature = signature;
                    entity.proof.trustless = entity.proof.publicKey.equals(publicKey) && domainPublicKey != null && domainPublicKey.equals(publicKey);
                    const decision = await this.implementation.prompt(entity);
                    if (entity.sign.message != null && (!decision.proof.hash || !decision.proof.message || !decision.proof.signature))
                        throw new Error('message signing refused');
                    acknowledgementRequest = {
                        type: 'approval',
                        challenge: algorithm_1.ByteUtil.uint8ArrayToHexString(entity.proof.challenge),
                        account: algorithm_1.Signing.encodeAddress(decision.account),
                        proof: {
                            hash: decision.proof.hash != null ? decision.proof.hash.toHex() : null,
                            message: decision.proof.message != null ? algorithm_1.ByteUtil.uint8ArrayToHexString(decision.proof.message) : (entity.sign.message ? algorithm_1.ByteUtil.uint8ArrayToHexString(entity.sign.message) : null),
                            signature: decision.proof.signature != null ? algorithm_1.ByteUtil.uint8ArrayToHexString(decision.proof.signature.data) : null
                        },
                        props: props
                    };
                }
                catch (exception) {
                    throw new Error(exception.message ? 'User rejection: ' + exception.message : 'User rejection');
                }
            }
            catch (exception) {
                acknowledgementRequest = {
                    type: 'rejection',
                    challenge: algorithm_1.ByteUtil.uint8ArrayToHexString(entity.proof.challenge),
                    error: exception.message,
                    props: props
                };
            }
            try {
                await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(acknowledgementRequest)
                });
                return true;
            }
            catch {
                return false;
            }
        }
        catch {
            return false;
        }
    }
    static isIpAddress(ip) {
        const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (ipv4Regex.test(ip) && ip.split('.').every((x) => parseInt(x) <= 255))
            return true;
        const cleanIp = ip.replace(/^\[|\]$/g, '');
        const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
        const compressedIpv6Regex = /^([0-9a-fA-F]{1,4}:)*::([0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4}$/;
        return ipv6Regex.test(cleanIp) || compressedIpv6Regex.test(cleanIp);
    }
}
exports.Authorizer = Authorizer;

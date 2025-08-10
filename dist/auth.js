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
exports.Authorizer = exports.NodeImplementation = void 0;
const algorithm_1 = require("./algorithm");
const utils_1 = require("@noble/hashes/utils");
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
    static async try(request) {
        if (!this.implementation)
            return false;
        let url;
        try {
            url = new URL(request.url || '');
        }
        catch {
            return false;
        }
        try {
            const challenge = algorithm_1.Hashing.hash256(Uint8Array.from([...(0, utils_1.randomBytes)(32), ...algorithm_1.Hashing.hash256(algorithm_1.ByteUtil.byteStringToUint8Array(url.toString()))]));
            const challenge16 = algorithm_1.ByteUtil.uint8ArrayToHexString(challenge);
            const solution = await (await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'challenge',
                    challenge: challenge16
                })
            })).json();
            let result;
            try {
                if (typeof solution.signature != 'string')
                    throw new Error('Challenge response must contain "signature" hex string');
                if (solution.message != null && typeof solution.message != 'string')
                    throw new Error('Challenge response "message" must be a hex string');
                if (solution.description != null && typeof solution.description != 'string')
                    throw new Error('Challenge response "description" must be a string');
                const publicKey = algorithm_1.Signing.recover(new algorithm_1.Uint256(challenge), new algorithm_1.Hashsig(algorithm_1.ByteUtil.hexStringToUint8Array(solution.signature)));
                if (!publicKey)
                    throw new Error('Challenge signature is not acceptable');
                try {
                    const domainPublicKey = this.isIpAddress(url.hostname) ? (await this.implementation.resolveDomainTXT(url.hostname)).map((x) => algorithm_1.Signing.decodePublicKey(x)).filter((x) => x != null)[0] || null : null;
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
                        account: algorithm_1.Signing.encodeAddress(decision.account),
                        signature: decision.signature != null ? algorithm_1.ByteUtil.uint8ArrayToHexString(decision.signature.data) : null
                    };
                }
                catch (exception) {
                    throw new Error(exception.message ? 'User rejection: ' + exception.message : 'User rejection');
                }
            }
            catch (exception) {
                result = {
                    type: 'rejection',
                    challenge: challenge16,
                    error: exception.message
                };
            }
            try {
                await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(result)
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

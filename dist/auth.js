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
exports.Authorizer = void 0;
const algorithm_1 = require("./algorithm");
const utils_1 = require("@noble/hashes/utils");
class Authorizer {
    static async prompt(decide) {
        this.decide = decide;
        if (this.decide != null) {
            if (!this.server) {
                try {
                    if (!this.internal.createServer)
                        this.internal.createServer = (await Promise.resolve().then(() => __importStar(require('http')))).createServer;
                }
                catch {
                    return;
                }
                this.server = this.internal.createServer(async (req, res) => {
                    try {
                        if (req.method != 'POST')
                            throw new Error('Only POST method is allowed');
                        const result = JSON.stringify(await this.try(JSON.parse(await new Promise((resolve, reject) => {
                            let body = '';
                            req.on('data', (chunk) => body += chunk.toString());
                            req.on('end', () => resolve(body));
                            req.on('error', reject);
                        }))));
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(result);
                    }
                    catch (exception) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: exception.message }));
                    }
                });
                await new Promise((resolve) => this.server.listen(this.config.port, this.config.host, resolve));
            }
        }
        else if (this.server != null) {
            await new Promise((resolve, reject) => this.server.close((error) => error ? reject(error) : resolve()));
            this.server = null;
        }
    }
    static async try(request) {
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
                    throw new Error('Challenge response must contain "message" hex string');
                const publicKey = algorithm_1.Signing.recover(new algorithm_1.Uint256(challenge), new algorithm_1.Hashsig(algorithm_1.ByteUtil.hexStringToUint8Array(solution.signature)));
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
    static async getPublicKeyFromTXT(hostname) {
        try {
            if (!this.internal.resolveTxt)
                this.internal.resolveTxt = (await Promise.resolve().then(() => __importStar(require('dns/promises')))).resolveTxt;
            const records = await this.internal.resolveTxt(hostname);
            for (let i = 0; i < records.length; i++) {
                const subRecords = records[i];
                for (let j = 0; j < subRecords.length; j++) {
                    const publicKey = algorithm_1.Signing.decodePublicKey(subRecords[j]);
                    if (publicKey != null) {
                        return publicKey;
                    }
                }
            }
            return null;
        }
        catch (exception) {
            throw new Error('DNS resolution failed: ' + exception.message);
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
Authorizer.internal = {
    resolveTxt: null,
    createServer: null
};
Authorizer.config = { host: 'localhost', port: 57673 };
Authorizer.server = null;
Authorizer.decide = null;

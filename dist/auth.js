"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Authorizer = exports.discoveryMessage = void 0;
const jayson_1 = __importDefault(require("jayson"));
const dgram_1 = __importDefault(require("dgram"));
const promises_1 = require("dns/promises");
const algorithm_1 = require("./algorithm");
const utils_1 = require("@noble/hashes/utils");
exports.discoveryMessage = 'tangent::authorizer';
class Authorizer {
    static async prompt(decide) {
        this.decide = decide;
        if (this.decide != null) {
            if (!this.server) {
                const server = this.server = {
                    rpc: new jayson_1.default.Server({
                        authorize: async (args, reply) => {
                            try {
                                reply(null, await this.authorize(args));
                            }
                            catch (exception) {
                                reply({ code: -algorithm_1.Hashing.hash32(algorithm_1.ByteUtil.byteStringToUint8Array(exception.message)), message: exception.message }, null);
                            }
                        }
                    }).http(),
                    discovery: dgram_1.default.createSocket('udp4')
                };
                server.discovery.on('message', (message, _) => {
                    if (message.toString() == exports.discoveryMessage) {
                        server.discovery.send(message);
                    }
                });
                await new Promise((resolve) => server.rpc.listen(this.config.port, this.config.host, resolve));
            }
        }
        else if (this.server != null) {
            await new Promise((resolve, _) => this.server?.discovery.close(() => resolve()));
            await new Promise((resolve, reject) => this.server?.rpc.close((error) => error ? reject(error) : resolve()));
            this.server = null;
        }
    }
    static async discover(timeout = 5000) {
        try {
            const client = dgram_1.default.createSocket('udp4');
            client.setBroadcast(true);
            const result = new Promise((resolve, _) => {
                const timer = setTimeout(() => {
                    resolve(null);
                    client.close();
                }, timeout);
                client.on('message', (message, rinfo) => {
                    if (message.toString() == exports.discoveryMessage) {
                        client.close();
                        clearTimeout(timer);
                        resolve(`http://${rinfo.address}:${this.config.port}/`);
                    }
                });
            });
            await new Promise((resolve, reject) => client.send(exports.discoveryMessage, this.config.port, '255.255.255.255', (err) => err ? reject(err) : resolve(undefined)));
            return await result;
        }
        catch (exception) {
            throw new Error('Discovery failed: ' + exception.message);
        }
    }
    static async try(authorizerURL, solverURL) {
        const response = await (await fetch(authorizerURL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: "2.0",
                id: algorithm_1.ByteUtil.uint8ArrayToHexString((0, utils_1.randomBytes)(8)),
                method: "authorize",
                params: [solverURL.toString()]
            })
        })).json();
        return response;
    }
    static async authorize(args) {
        if (args.length != 1)
            throw new Error('Exactly 1 argument expected (url: string_uri)');
        else if (!this.decide)
            throw new Error('Authorization disabled');
        try {
            let url;
            try {
                url = new URL(args[0]);
            }
            catch {
                throw new Error('Not a valid URL');
            }
            ;
            const challenge = algorithm_1.Hashing.hash256(Uint8Array.from([...(0, utils_1.randomBytes)(32), ...algorithm_1.Hashing.hash256(algorithm_1.ByteUtil.byteStringToUint8Array(url.toString()))]));
            const solution = await (await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'challenge',
                    challenge: algorithm_1.ByteUtil.uint8ArrayToHexString(challenge)
                })
            })).json();
            if (typeof solution.signature != 'string')
                throw new Error('Server failed to respond with challenge solution');
            const signature = new algorithm_1.Recsighash(algorithm_1.ByteUtil.hexStringToUint8Array(solution.challenge));
            const publicKey = algorithm_1.Signing.recover(new algorithm_1.Uint256(challenge), signature);
            if (!publicKey)
                throw new Error('Signature is not acceptable');
            const domainPublicKey = this.isIpAddress(url.hostname) ? await this.getPublicKeyFromTXT(url.hostname) : null;
            let result;
            try {
                result = await this.decide({
                    publicKey: publicKey,
                    hostname: url.hostname,
                    trustless: domainPublicKey != null && domainPublicKey.equals(publicKey)
                });
            }
            catch {
                throw new Error('Operation not permitted (user rejected)');
            }
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'confirmation',
                    account: algorithm_1.Signing.encodeSubaddress(result.account, result.derivation || undefined),
                    signature: result.signature != null ? algorithm_1.ByteUtil.uint8ArrayToHexString(result.signature.data) : null
                })
            });
            return await response.json();
        }
        catch (exception) {
            throw new Error('Authorization failed: ' + exception.message);
        }
    }
    static async getPublicKeyFromTXT(hostname) {
        try {
            const records = await (0, promises_1.resolveTxt)(hostname);
            for (let i = 0; i < records.length; i++) {
                const subRecords = records[i];
                for (let j = 0; j < subRecords.length; j++) {
                    const publicKey = algorithm_1.Signing.decodePublicKey(subRecords[j]);
                    if (publicKey != null) {
                        return publicKey;
                    }
                }
            }
        }
        catch { }
        throw new Error('Provided domain name does not have a tangent encoded public key TXT record');
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
Authorizer.config = { host: '0.0.0.0', port: 57673 };
Authorizer.server = null;
Authorizer.decide = null;

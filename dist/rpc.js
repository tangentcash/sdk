"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RPC = exports.EventResolver = exports.WalletKeychain = exports.NetworkType = exports.WalletType = exports.EventType = void 0;
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const algorithm_1 = require("./algorithm");
const types_1 = require("./types");
bignumber_js_1.default.config({ DECIMAL_PLACES: 18, ROUNDING_MODE: 1 });
const WEBSOCKET_TIMEOUT = 24000;
var EventType;
(function (EventType) {
    EventType[EventType["Error"] = 0] = "Error";
    EventType[EventType["Transfer"] = 1] = "Transfer";
    EventType[EventType["TransferIsolated"] = 2] = "TransferIsolated";
    EventType[EventType["TransferFee"] = 3] = "TransferFee";
    EventType[EventType["BridgePolicy"] = 4] = "BridgePolicy";
    EventType[EventType["BridgeTransaction"] = 5] = "BridgeTransaction";
    EventType[EventType["BridgeAccount"] = 6] = "BridgeAccount";
    EventType[EventType["BridgeTransfer"] = 7] = "BridgeTransfer";
    EventType[EventType["BridgeAttester"] = 8] = "BridgeAttester";
    EventType[EventType["BridgeParticipant"] = 9] = "BridgeParticipant";
    EventType[EventType["WitnessAccount"] = 10] = "WitnessAccount";
    EventType[EventType["WitnessTransaction"] = 11] = "WitnessTransaction";
    EventType[EventType["RollupReceipt"] = 12] = "RollupReceipt";
    EventType[EventType["Unknown"] = 13] = "Unknown";
})(EventType || (exports.EventType = EventType = {}));
var WalletType;
(function (WalletType) {
    WalletType["Mnemonic"] = "mnemonic";
    WalletType["SecretKey"] = "secretkey";
    WalletType["PublicKey"] = "publickey";
    WalletType["Address"] = "address";
})(WalletType || (exports.WalletType = WalletType = {}));
var NetworkType;
(function (NetworkType) {
    NetworkType["Mainnet"] = "mainnet";
    NetworkType["Testnet"] = "testnet";
    NetworkType["Regtest"] = "regtest";
})(NetworkType || (exports.NetworkType = NetworkType = {}));
class WalletKeychain {
    constructor() {
        this.type = null;
        this.secretKey = null;
        this.publicKey = null;
        this.publicKeyHash = null;
        this.address = null;
    }
    isValid() {
        switch (this.type) {
            case WalletType.Mnemonic:
            case WalletType.SecretKey:
                return this.secretKey != null && this.publicKey != null && this.publicKeyHash != null && this.address != null;
            case WalletType.PublicKey:
                return this.publicKey != null && this.publicKeyHash != null && this.address != null;
            case WalletType.Address:
                return this.publicKeyHash != null && this.address != null;
            default:
                return false;
        }
    }
    static fromMnemonic(mnemonic) {
        if (mnemonic.length != 24)
            return null;
        const secretKey = algorithm_1.Signing.deriveSecretKeyFromMnemonic(mnemonic.join(' '));
        if (!secretKey)
            return null;
        const serialized = algorithm_1.Signing.encodeSecretKey(secretKey);
        if (!serialized)
            return null;
        const result = this.fromSecretKey(serialized);
        if (!result)
            return null;
        result.type = WalletType.Mnemonic;
        return result;
    }
    static fromSecretKey(secretKey) {
        const result = new WalletKeychain();
        result.type = WalletType.SecretKey;
        result.secretKey = algorithm_1.Signing.decodeSecretKey(secretKey);
        if (!result.secretKey)
            return null;
        result.publicKey = algorithm_1.Signing.derivePublicKey(result.secretKey);
        if (!result.publicKey)
            return null;
        result.publicKeyHash = algorithm_1.Signing.derivePublicKeyHash(result.publicKey);
        if (!result.publicKeyHash)
            return null;
        result.address = algorithm_1.Signing.encodeAddress(result.publicKeyHash);
        return result;
    }
    static fromPublicKey(publicKey) {
        const result = new WalletKeychain();
        result.type = WalletType.PublicKey;
        result.publicKey = algorithm_1.Signing.decodePublicKey(publicKey);
        if (!result.publicKey)
            return null;
        result.publicKeyHash = algorithm_1.Signing.derivePublicKeyHash(result.publicKey);
        if (!result.publicKeyHash)
            return null;
        result.address = algorithm_1.Signing.encodeAddress(result.publicKeyHash);
        return result;
    }
    static fromAddress(address) {
        const result = new WalletKeychain();
        result.type = WalletType.Address;
        result.address = address;
        result.publicKeyHash = algorithm_1.Signing.decodeAddress(result.address);
        if (!result.publicKeyHash)
            return null;
        return result;
    }
}
exports.WalletKeychain = WalletKeychain;
class EventResolver {
    static calculateSummaryState(events) {
        const result = {
            account: {
                balances: {},
                fees: {}
            },
            bridge: {
                policies: {},
                balances: {},
                accounts: {},
                transactions: {},
                attesters: new Set(),
                participants: new Set(),
                migrations: {}
            },
            witness: {
                accounts: {},
                transactions: {}
            },
            receipts: {},
            errors: [],
            events: []
        };
        if (!events || !Array.isArray(events))
            return result;
        const isNumber = (v) => typeof v == 'string' && v.startsWith('0x') ? false : bignumber_js_1.default.isBigNumber(v) || new bignumber_js_1.default(v, 10).isFinite();
        for (let i = 0; i < events.length; i++) {
            const event = events[i];
            const size = result.events.length;
            switch (event.event.toNumber()) {
                case 0: {
                    if (event.args.length >= 1 && typeof event.args[0] == 'string') {
                        result.errors.push(event.args[0]);
                        result.events.push({ type: EventType.Error, message: event.args[0] });
                    }
                    break;
                }
                case types_1.Types.AccountBalance: {
                    if (event.args.length >= 4 && (isNumber(event.args[0]) || typeof event.args[0] == 'string') && typeof event.args[1] == 'string' && typeof event.args[2] == 'string' && isNumber(event.args[3])) {
                        const [assetId, from, to, value] = event.args;
                        const fromAddress = algorithm_1.Signing.encodeAddress(new algorithm_1.Pubkeyhash(from)) || from;
                        const toAddress = algorithm_1.Signing.encodeAddress(new algorithm_1.Pubkeyhash(to)) || to;
                        const asset = new algorithm_1.AssetId(assetId);
                        if (!result.account.balances[fromAddress])
                            result.account.balances[fromAddress] = {};
                        if (!result.account.balances[fromAddress][asset.handle])
                            result.account.balances[fromAddress][asset.handle] = { asset: asset, supply: new bignumber_js_1.default(0), reserve: new bignumber_js_1.default(0) };
                        if (!result.account.balances[toAddress])
                            result.account.balances[toAddress] = {};
                        if (!result.account.balances[toAddress][asset.handle])
                            result.account.balances[toAddress][asset.handle] = { asset: asset, supply: new bignumber_js_1.default(0), reserve: new bignumber_js_1.default(0) };
                        const fromState = result.account.balances[fromAddress][asset.handle];
                        fromState.supply = fromState.supply.minus(value);
                        const toState = result.account.balances[toAddress][asset.handle];
                        toState.supply = toState.supply.plus(value);
                        result.events.push({ type: EventType.Transfer, asset: asset, from: fromAddress, to: toAddress, value: new bignumber_js_1.default(value) });
                    }
                    else if (event.args.length >= 4 && (isNumber(event.args[0]) || typeof event.args[0] == 'string') && typeof event.args[1] == 'string' && isNumber(event.args[2]) && isNumber(event.args[3])) {
                        const [assetId, owner, supply, reserve] = event.args;
                        const ownerAddress = algorithm_1.Signing.encodeAddress(new algorithm_1.Pubkeyhash(owner)) || owner;
                        const asset = new algorithm_1.AssetId(assetId);
                        if (!result.account.balances[ownerAddress])
                            result.account.balances[ownerAddress] = {};
                        if (!result.account.balances[ownerAddress][asset.handle])
                            result.account.balances[ownerAddress][asset.handle] = { asset: asset, supply: new bignumber_js_1.default(0), reserve: new bignumber_js_1.default(0) };
                        const ownerState = result.account.balances[ownerAddress][asset.handle];
                        ownerState.supply = ownerState.supply.plus(supply);
                        ownerState.reserve = ownerState.reserve.plus(reserve);
                        result.events.push({ type: EventType.TransferIsolated, asset: asset, owner: ownerAddress, supply: new bignumber_js_1.default(supply), reserve: new bignumber_js_1.default(reserve) });
                    }
                    else if (event.args.length >= 3 && (isNumber(event.args[0]) || typeof event.args[0] == 'string') && typeof event.args[1] == 'string' && isNumber(event.args[2])) {
                        const [assetId, owner, fee] = event.args;
                        const ownerAddress = algorithm_1.Signing.encodeAddress(new algorithm_1.Pubkeyhash(owner)) || owner;
                        const asset = new algorithm_1.AssetId(assetId);
                        if (!result.account.balances[ownerAddress])
                            result.account.balances[ownerAddress] = {};
                        if (!result.account.balances[ownerAddress][asset.handle])
                            result.account.balances[ownerAddress][asset.handle] = { asset: asset, supply: new bignumber_js_1.default(0), reserve: new bignumber_js_1.default(0) };
                        if (!result.account.fees[ownerAddress])
                            result.account.fees[ownerAddress] = {};
                        if (!result.account.fees[ownerAddress][asset.handle])
                            result.account.fees[ownerAddress][asset.handle] = { asset: asset, fee: new bignumber_js_1.default(0) };
                        const balanceState = result.account.balances[ownerAddress][asset.handle];
                        const feeState = result.account.fees[ownerAddress][asset.handle];
                        balanceState.supply = balanceState.supply.plus(fee);
                        feeState.fee = feeState.fee.plus(fee);
                        result.events.push({ type: EventType.TransferFee, asset: asset, owner: ownerAddress, fee: new bignumber_js_1.default(fee) });
                    }
                    break;
                }
                case types_1.Types.BridgeInstance: {
                    if (event.args.length < 2 || !(isNumber(event.args[0]) || typeof event.args[0] == 'string') && typeof event.args[1] == 'string' && isNumber(event.args[2]))
                        break;
                    const [assetId, bridgeHash] = event.args;
                    const asset = new algorithm_1.AssetId(assetId);
                    const hash = new algorithm_1.Uint256(bridgeHash.toString()).toString();
                    if (event.args.length == 2) {
                        if (!result.bridge.policies[hash])
                            result.bridge.policies[hash] = {};
                        result.bridge.policies[hash][asset.handle] = { asset: asset };
                        result.events.push({ type: EventType.BridgePolicy, asset: asset, bridgeHash: hash });
                    }
                    else if (event.args.length == 4 && (isNumber(event.args[2]) || typeof event.args[2] == 'string') && parseInt(event.args[3].toString()) == 0) {
                        const nonce = new bignumber_js_1.default(event.args[2].toString());
                        if (!result.bridge.transactions[hash])
                            result.bridge.transactions[hash] = {};
                        result.bridge.transactions[hash][asset.handle] = { asset: asset, nonce: nonce };
                        result.events.push({ type: EventType.BridgeTransaction, asset: asset, bridgeHash: hash, nonce: nonce });
                    }
                    else if (event.args.length == 4 && (isNumber(event.args[2]) || typeof event.args[2] == 'string') && parseInt(event.args[3].toString()) == 1) {
                        const nonce = new bignumber_js_1.default(event.args[2].toString());
                        if (!result.bridge.accounts[hash])
                            result.bridge.accounts[hash] = {};
                        result.bridge.accounts[hash][asset.handle] = { asset: asset, nonce: nonce };
                        result.events.push({ type: EventType.BridgeAccount, asset: asset, bridgeHash: hash, nonce: nonce });
                    }
                    break;
                }
                case types_1.Types.BridgeBalance: {
                    if (event.args.length >= 3 && (isNumber(event.args[0]) || typeof event.args[0] == 'string') && (isNumber(event.args[1]) || typeof event.args[1] == 'string') && isNumber(event.args[2])) {
                        const [assetId, bridgeHash, value] = event.args;
                        const asset = new algorithm_1.AssetId(assetId);
                        const hash = new algorithm_1.Uint256(bridgeHash.toString()).toString();
                        if (!result.bridge.balances[hash])
                            result.bridge.balances[hash] = {};
                        if (!result.bridge.balances[hash][asset.handle])
                            result.bridge.balances[hash][asset.handle] = { asset: asset, supply: new bignumber_js_1.default(0) };
                        const state = result.bridge.balances[hash][asset.handle];
                        state.supply = state.supply.plus(value);
                        result.events.push({ type: EventType.BridgeTransfer, asset: asset, bridgeHash: hash, value: new bignumber_js_1.default(value) });
                    }
                    break;
                }
                case types_1.Types.WitnessAccount: {
                    if (event.args.length >= 3 && (isNumber(event.args[0]) || typeof event.args[0] == 'string') && isNumber(event.args[1])) {
                        const [assetId, addressPurpose, addressAliases] = [event.args[0], event.args[1], event.args.slice(2)];
                        const asset = new algorithm_1.AssetId(assetId);
                        let purpose;
                        switch (addressPurpose.toNumber()) {
                            case 1:
                                purpose = 'routing';
                                break;
                            case 2:
                                purpose = 'bridge';
                                break;
                            case 0:
                            default:
                                purpose = 'witness';
                                break;
                        }
                        if (!result.witness.accounts[asset.handle])
                            result.witness.accounts[asset.handle] = { asset: asset, purpose: purpose, aliases: [] };
                        const addressState = result.witness.accounts[asset.handle];
                        addressState.purpose = purpose;
                        for (let i = 0; i < addressAliases.length; i++) {
                            if (typeof addressAliases[i] == 'string')
                                addressState.aliases.push(addressAliases[i]);
                        }
                        result.events.push({ type: EventType.WitnessAccount, asset: asset, purpose: purpose, addresses: addressAliases });
                    }
                    break;
                }
                case types_1.Types.WitnessTransaction: {
                    if (event.args.length == 2 && (isNumber(event.args[0]) || typeof event.args[0] == 'string') && (isNumber(event.args[1]) || typeof event.args[1] == 'string')) {
                        const [assetId, stateHash] = event.args;
                        const asset = new algorithm_1.AssetId(assetId);
                        const hash = new algorithm_1.Uint256(stateHash.toString()).toHex();
                        if (result.witness.transactions[asset.handle] != null)
                            result.witness.transactions[asset.handle].stateHashes.push(hash);
                        else
                            result.witness.transactions[asset.handle] = { asset: asset, stateHashes: [hash] };
                        result.events.push({ type: EventType.WitnessTransaction, asset: asset, stateHash: hash });
                    }
                    break;
                }
                case types_1.Types.Rollup: {
                    if (event.args.length == 3 && (isNumber(event.args[0]) || typeof event.args[0] == 'string') && (isNumber(event.args[1]) || typeof event.args[1] == 'string') && (isNumber(event.args[2]) || typeof event.args[2] == 'string')) {
                        const [transactionHash, index, relativeGasUse] = event.args;
                        result.receipts[new algorithm_1.Uint256(transactionHash.toString()).toHex()] = {
                            executionIndex: new bignumber_js_1.default(index).toNumber(),
                            relativeGasUse: new bignumber_js_1.default(relativeGasUse.toString()),
                        };
                        result.events.push({ type: EventType.RollupReceipt, transactionHash: transactionHash, executionIndex: new bignumber_js_1.default(index), relativeGasUse: new bignumber_js_1.default(relativeGasUse.toString()) });
                    }
                    break;
                }
                case types_1.Types.Route:
                case types_1.Types.Withdraw: {
                    if (event.args.length == 1 && typeof event.args[0] == 'string') {
                        const [owner] = event.args;
                        const ownerAddress = algorithm_1.Signing.encodeAddress(new algorithm_1.Pubkeyhash(owner)) || owner;
                        if (i == 0) {
                            result.bridge.attesters.add(ownerAddress);
                            result.events.push({ type: EventType.BridgeAttester, owner: ownerAddress });
                        }
                        else {
                            result.bridge.participants.add(ownerAddress);
                            result.events.push({ type: EventType.BridgeParticipant, owner: ownerAddress });
                        }
                    }
                    break;
                }
                case types_1.Types.Setup: {
                    if (event.args.length == 2 && typeof event.args[0] == 'boolean' && typeof event.args[1] == 'string') {
                        const [selfMigration, owner] = event.args;
                        const ownerAddress = algorithm_1.Signing.encodeAddress(new algorithm_1.Pubkeyhash(owner)) || owner;
                        result.bridge.participants.add(ownerAddress);
                        result.bridge.migrations[ownerAddress] = selfMigration;
                        result.events.push({ type: EventType.BridgeParticipant, owner: ownerAddress });
                    }
                    break;
                }
                default:
                    break;
            }
            if (size == result.events.length)
                result.events.push({ type: EventType.Unknown, event: event.event, args: event.args });
        }
        return result;
    }
    static calculateAssetRecords(data) {
        const result = {};
        for (let i = 0; i < data.length; i++) {
            const item = data[i];
            const assetId = item.asset != null && (bignumber_js_1.default.isBigNumber(item.asset.id) || typeof item.asset.id == 'string') ? item.asset.id : null;
            const assetHandle = assetId != null ? new algorithm_1.AssetId(assetId).handle || '' : '';
            if (!result[assetHandle])
                result[assetHandle] = [item];
            else
                result[assetHandle].push(item);
        }
        return result;
    }
    static isSummaryStateEmpty(state, address) {
        if (address != null) {
            return !state.errors.length &&
                !state.account.balances[address] &&
                !state.bridge.balances[address] &&
                !state.bridge.attesters.size &&
                !state.bridge.participants.size &&
                !Object.keys(state.bridge.transactions).length &&
                !Object.keys(state.bridge.accounts).length &&
                !Object.keys(state.bridge.policies).length &&
                !Object.keys(state.witness.accounts).length &&
                !Object.keys(state.witness.transactions).length &&
                !Object.keys(state.receipts).length;
        }
        else {
            return !state.errors.length &&
                !state.bridge.attesters.size &&
                !state.bridge.participants.size &&
                !Object.keys(state.bridge.balances).length &&
                !Object.keys(state.bridge.transactions).length &&
                !Object.keys(state.bridge.accounts).length &&
                !Object.keys(state.bridge.policies).length &&
                !Object.keys(state.account.balances).length &&
                !Object.keys(state.witness.accounts).length &&
                !Object.keys(state.witness.transactions).length &&
                !Object.keys(state.receipts).length;
        }
    }
}
exports.EventResolver = EventResolver;
class RPC {
    static reportAvailability(location, available) {
        if (available) {
            this.interfaces.servers.add(location);
        }
        else {
            this.interfaces.servers.delete(location);
        }
        if (this.onIpsetStore != null)
            this.onIpsetStore({ servers: [...this.interfaces.servers] });
    }
    static fetchObject(data) {
        if (typeof data == 'string') {
            try {
                if (!data.startsWith('0x')) {
                    const numeric = new bignumber_js_1.default(data, 10).dp(18);
                    if (data.startsWith(algorithm_1.ByteUtil.bigNumberToString(numeric)))
                        return numeric;
                }
            }
            catch { }
        }
        else if (typeof data == 'number') {
            return new bignumber_js_1.default(data);
        }
        else if (typeof data == 'object') {
            for (let key in data) {
                data[key] = this.fetchObject(data[key]);
            }
        }
        else if (Array.isArray(data)) {
            for (let i = 0; i < data.length; i++) {
                data[i] = this.fetchObject(data[i]);
            }
        }
        return data;
    }
    static fetchData(data) {
        if (!data.error)
            return this.fetchObject(data.result);
        const message = data.error.message ? data.error.message : '';
        const code = data.error.code ? data.error.code.toString() : '0';
        const hash = algorithm_1.ByteUtil.uint8ArrayToHexString(algorithm_1.Hashing.hash160(algorithm_1.ByteUtil.byteStringToUint8Array(message + ' / ' + code)));
        return new Error(`${message} — E${hash.substring(0, 8).toUpperCase()}`);
    }
    static fetchResult(hash, data) {
        if (!data || Array.isArray(data) || data.result === undefined) {
            return undefined;
        }
        else if (this.onCacheStore != null && hash != null && data.error == null)
            this.onCacheStore(hash, data.result);
        return this.fetchData(data);
    }
    static fetchNode() {
        try {
            const nodes = Array.from(this.interfaces.servers.keys());
            const node = nodes[Math.floor(Math.random() * nodes.length)];
            if (!node)
                throw false;
            const location = new URL('tcp://' + node);
            const secure = (location.port == '443' || this.requiresSecureTransport(location.hostname));
            return [`ws${secure ? 's' : ''}://${node}/`, node];
        }
        catch {
            return null;
        }
    }
    static fetchResolver() {
        try {
            if (!this.resolver)
                return null;
            return [`${this.resolver}${this.resolver.endsWith('/') ? '' : '/'}?port=rpc&rpc=1&rpc_external_access=1&rpc_public_access=1`, this.resolver];
        }
        catch {
            return null;
        }
    }
    static async fetchIpset(mode, servers) {
        if (this.interfaces.overrider != null) {
            try {
                const scheme = new URL('tcp://' + this.interfaces.overrider);
                const address = scheme.hostname + (scheme.port.length > 0 ? ':' + scheme.port : '');
                this.interfaces.servers.add(address);
                return !servers || !servers.has(address) ? 1 : 0;
            }
            catch {
                return 0;
            }
        }
        switch (mode) {
            case 'preload': {
                if (this.interfaces.preload)
                    return 0;
                const seeds = this.onIpsetLoad ? this.onIpsetLoad() : null;
                this.interfaces.preload = true;
                if (!seeds || !Array.isArray(seeds.servers))
                    return 0;
                let results = 0;
                for (let i = 0; i < seeds.servers.length; i++) {
                    try {
                        const seed = seeds.servers[i];
                        const scheme = new URL('tcp://' + seed);
                        const address = scheme.hostname + (scheme.port.length > 0 ? ':' + scheme.port : '');
                        if (seed.length > 0 && address.length > 0 && (!servers || !servers.has(address))) {
                            this.interfaces.servers.add(address);
                            ++results;
                        }
                    }
                    catch { }
                }
                return results;
            }
            case 'fetch': {
                const location = this.fetchResolver();
                if (location != null) {
                    try {
                        if (this.onNodeRequest)
                            this.onNodeRequest(location[0], 'discover', null, 0);
                        const response = await fetch(location[0]);
                        const dataContent = await response.text();
                        const data = JSON.parse(dataContent);
                        if (this.onNodeResponse)
                            this.onNodeResponse(location[0], 'discover', data, dataContent.length);
                        if (!Array.isArray(data))
                            throw false;
                        let results = 0;
                        for (let i = 0; i < data.length; i++) {
                            try {
                                const seed = data[i];
                                let scheme = new URL(seed);
                                if (scheme.hostname == 'selfhost') {
                                    const port = scheme.port;
                                    scheme = new URL(location[1]);
                                    scheme.port = port;
                                }
                                let address = scheme.hostname + (scheme.port.length > 0 ? ':' + scheme.port : '');
                                if (seed.length > 0 && address.length > 0 && (!servers || !servers.has(address))) {
                                    this.interfaces.servers.add(address);
                                    ++results;
                                }
                            }
                            catch { }
                        }
                        if (results > 0)
                            return results;
                    }
                    catch (exception) {
                        if (this.onNodeResponse)
                            this.onNodeResponse(location[0], 'discover', exception, exception.message.length);
                    }
                }
                if (this.onIpsetStore != null)
                    this.onIpsetStore({ servers: [...this.interfaces.servers] });
                return 0;
            }
            default:
                return 0;
        }
    }
    static async fetch(policy, method, args) {
        if (this.forcePolicy != null) {
            policy = this.forcePolicy;
            this.forcePolicy = null;
        }
        const id = (++this.requests.count).toString();
        const hash = algorithm_1.ByteUtil.uint8ArrayToHexString(algorithm_1.Hashing.hash512(algorithm_1.ByteUtil.utf8StringToUint8Array(JSON.stringify([method, args || []]))));
        const body = {
            jsonrpc: '2.0',
            id: id,
            method: method,
            params: Array.isArray(args) ? args : []
        };
        const content = JSON.stringify(body);
        if (this.onCacheLoad != null && policy == 'cache') {
            const cache = this.onCacheLoad(hash);
            if (cache != null)
                return this.fetchObject(cache);
        }
        let result = undefined;
        try {
            await this.connectSocket();
            if (!this.socket)
                throw new Error('connection not acquired');
            if (this.onNodeRequest)
                this.onNodeRequest(this.socket?.url || '[unknown]', method, body, content.length);
            const data = await new Promise((resolve, reject) => {
                const context = { method: method, resolve: (_) => { } };
                const timeout = setTimeout(() => context.resolve(new Error('connection timed out')), WEBSOCKET_TIMEOUT);
                context.resolve = (data) => {
                    this.requests.pending.delete(id);
                    clearTimeout(timeout);
                    if (data instanceof Error)
                        reject(data);
                    else
                        resolve(data);
                };
                this.requests.pending.set(id, context);
                if (this.socket != null)
                    this.socket.send(content);
                else
                    context.resolve(new Error('connection reset'));
            });
            if (this.onNodeResponse)
                this.onNodeResponse(this.socket?.url || '[unknown]', method, data[0], data[1]);
            result = this.fetchResult(hash, data[0]);
        }
        catch (exception) {
            if (this.onNodeError)
                this.onNodeError(this.socket?.url || '[unknown]', method, exception);
        }
        if (result !== undefined) {
            if (result instanceof Error)
                throw result;
            return result;
        }
        else if (this.onCacheLoad != null) {
            const cache = this.onCacheLoad(hash);
            if (cache != null)
                return this.fetchObject(cache);
        }
        return null;
    }
    static async fetchAll(callback) {
        const count = 48;
        let result = [];
        let offset = 0;
        while (true) {
            try {
                const data = await callback(offset, count);
                if (data == null)
                    return null;
                else if (!Array.isArray(data) || !data.length)
                    break;
                offset += data.length;
                result = result.concat(data);
                if (data.length < count)
                    break;
            }
            catch (exception) {
                if (result.length > 0)
                    break;
                throw exception;
            }
        }
        return result;
    }
    static async connectSocket() {
        if (this.socket != null)
            return 0;
        const method = 'connect';
        if (!this.interfaces.preload) {
            let preloadSize = await this.fetchIpset('preload');
            let fetchSize = preloadSize > 0 ? 0 : await this.fetchIpset('fetch');
            if (!preloadSize && !fetchSize)
                return null;
        }
        const topics = [this.topics.addresses.join(',')];
        if (typeof this.topics.blocks == 'boolean')
            topics.push(this.topics.blocks);
        if (typeof this.topics.transactions == 'boolean')
            topics.push(this.topics.transactions);
        let servers = new Set();
        while (true) {
            const location = this.fetchNode();
            if (location && !servers.has(location[1])) {
                try {
                    if (this.onNodeRequest)
                        this.onNodeRequest(location[0], method, null, 0);
                    let connection;
                    try {
                        connection = await new Promise((resolve, reject) => {
                            const socket = new WebSocket(location[0]);
                            socket.onopen = () => resolve(socket);
                            socket.onerror = () => reject(new Error('websocket connection error'));
                        });
                    }
                    catch (exception) {
                        this.reportAvailability(location[1], false);
                        throw exception;
                    }
                    if (this.onNodeResponse)
                        this.onNodeResponse(location[0], method, null, 0);
                    this.socket = connection;
                    this.socket.onopen = null;
                    this.socket.onerror = null;
                    this.socket.onmessage = (event) => {
                        const message = event.data;
                        if (!this.socket || typeof message != 'string')
                            return;
                        try {
                            const data = JSON.parse(message);
                            if (data != null && typeof data.id != 'undefined') {
                                if (typeof data.notification == 'object') {
                                    const notification = data.notification;
                                    if (notification != null && typeof notification.type == 'string' && typeof notification.result != 'undefined') {
                                        if (this.onNodeMessage)
                                            this.onNodeMessage(notification);
                                        if (this.onNodeResponse)
                                            this.onNodeResponse(this.socket.url, 'notification', data, message.length);
                                    }
                                }
                                else if (typeof data.result != 'undefined' && data.id != null) {
                                    const response = this.requests.pending.get(data.id.toString());
                                    if (response != null)
                                        response.resolve([data, message.length]);
                                }
                            }
                        }
                        catch { }
                    };
                    this.socket.onclose = () => {
                        this.disconnectSocket();
                        this.connectSocket();
                    };
                    const events = await this.fetch('no-cache', 'subscribe', topics);
                    this.reportAvailability(location[1], true);
                    return events;
                }
                catch (exception) {
                    if (this.onNodeError)
                        this.onNodeError(location[0], method, exception);
                }
                servers.add(location[1]);
            }
            else if (!(await this.fetchIpset('fetch', servers))) {
                break;
            }
        }
        return null;
    }
    static async disconnectSocket() {
        for (let id in this.requests.pending) {
            const response = this.requests.pending.get(id);
            if (response != null)
                response.resolve(new Error('connection reset'));
        }
        this.requests.pending.clear();
        if (!this.socket)
            return true;
        else if (this.onNodeResponse)
            this.onNodeResponse(this.socket.url, 'disconnect', null, 0);
        this.socket.onopen = null;
        this.socket.onerror = null;
        this.socket.onmessage = null;
        this.socket.onclose = null;
        this.socket.close();
        this.socket = null;
        return true;
    }
    static applyTopics(addresses, blocks, transactions) {
        this.topics.blocks = blocks;
        this.topics.transactions = transactions;
        this.topics.addresses = addresses;
        this.interfaces.servers.clear();
        this.interfaces.preload = false;
    }
    static applyResolver(resolver) {
        this.resolver = resolver;
    }
    static applyServer(server) {
        this.interfaces.overrider = server;
        if (server != null) {
            this.interfaces.servers.clear();
            this.interfaces.servers.add(server);
            if (this.onIpsetStore != null) {
                this.onIpsetStore({ servers: [...this.interfaces.servers] });
            }
        }
    }
    static applyImplementation(implementation) {
        this.onNodeMessage = implementation.onNodeMessage || null;
        this.onNodeRequest = implementation.onNodeRequest || null;
        this.onNodeResponse = implementation.onNodeResponse || null;
        this.onNodeError = implementation.onNodeError || null;
        this.onCacheStore = implementation.onCacheStore || null;
        this.onCacheLoad = implementation.onCacheLoad || null;
        this.onCacheKeys = implementation.onCacheKeys || null;
        this.onIpsetLoad = implementation.onIpsetLoad || null;
        this.onIpsetStore = implementation.onIpsetStore || null;
    }
    static requiresSecureTransport(address) {
        if (address == 'localhost')
            return false;
        else if (typeof window != 'undefined' && window?.location?.protocol == 'https:')
            return true;
        const ipv4Pattern = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        const ipv6Pattern = /^(?:[A-Fa-f0-9]{1,4}:){7}[A-Fa-f0-9]{1,4}$/;
        return !ipv4Pattern.test(address) && !ipv6Pattern.test(address);
    }
    static clearCache() {
        if (this.onCacheKeys != null && this.onCacheStore != null) {
            const keys = this.onCacheKeys();
            for (let key in keys) {
                this.onCacheStore(keys[key]);
            }
        }
    }
    static forcedPolicy(policy, callback) {
        this.forcePolicy = policy;
        return callback();
    }
    static decodeTransaction(hexMessage) {
        return this.fetch('cache', 'decodetransaction', [hexMessage]);
    }
    static simulateTransaction(hexMessage) {
        return this.fetch('no-cache', 'simulatetransaction', [hexMessage]);
    }
    static submitTransaction(hexMessage) {
        return this.fetch('no-cache', 'submittransaction', [hexMessage]);
    }
    static callTransaction(asset, fromAddress, toAddress, method, args) {
        return this.fetch('no-cache', 'calltransaction', [asset.handle, fromAddress, toAddress, method, ...args]);
    }
    static getWallet() {
        return this.fetch('no-cache', 'getwallet');
    }
    static getBlockchains() {
        return this.fetch('cache', 'getblockchains', []);
    }
    static getBestBridgeInstancesBySecurity(asset, offset, count) {
        return this.fetch('no-cache', 'getbestbridgeinstancesbysecurity', [asset.handle, offset, count]);
    }
    static getBestBridgeInstancesByBalance(asset, offset, count) {
        return this.fetch('no-cache', 'getbestbridgeinstancesbybalance', [asset.handle, offset, count]);
    }
    static getNextAccountNonce(address) {
        return this.fetch('no-cache', 'getnextaccountnonce', [address]);
    }
    static getAccountBalance(address, asset) {
        return this.fetch('no-cache', 'getaccountbalance', [address, asset.handle]);
    }
    static getAccountBalances(address, offset, count) {
        return this.fetch('no-cache', 'getaccountbalances', [address, offset, count]);
    }
    static getAccountDelegation(address) {
        return this.fetch('no-cache', 'getaccountdelegation', [address]);
    }
    static getValidatorProduction(address) {
        return this.fetch('no-cache', 'getvalidatorproduction', [address]);
    }
    static getValidatorProductionWithRewards(address) {
        return this.fetch('no-cache', 'getvalidatorproductionwithrewards', [address]);
    }
    static getValidatorParticipation(address) {
        return this.fetch('no-cache', 'getvalidatorparticipation', [address]);
    }
    static getValidatorParticipationWithRewards(address) {
        return this.fetch('no-cache', 'getvalidatorparticipationwithrewards', [address]);
    }
    static getValidatorAttestations(address, offset, count) {
        return this.fetch('no-cache', 'getvalidatorattestations', [address, offset, count]);
    }
    static getValidatorAttestationsWithRewards(address) {
        return this.fetch('no-cache', 'getvalidatorattestationswithrewards', [address]);
    }
    static getBridgeBalances(address, offset, count) {
        return this.fetch('no-cache', 'getbridgebalances', [address, offset, count]);
    }
    static getWitnessAccount(address, asset, walletAddress) {
        return this.fetch('no-cache', 'getwitnessaccount', [address, asset.handle, walletAddress]);
    }
    static getWitnessAccounts(address, offset, count) {
        return this.fetch('no-cache', 'getwitnessaccounts', [address, offset, count]);
    }
    static getWitnessAccountsByPurpose(address, purpose, offset, count) {
        return this.fetch('no-cache', 'getwitnessaccountsbypurpose', [address, purpose, offset, count]);
    }
    static getMempoolTransactionsByOwner(address, offset, count, direction, unrolling) {
        const args = [address, offset, count];
        if (direction != null)
            args.push(direction);
        if (unrolling != null)
            args.push(unrolling);
        return this.fetch('no-cache', 'getmempooltransactionsbyowner', args);
    }
    static getBlockTransactionsByHash(hash, unrolling) {
        return this.fetch('cache', 'getblocktransactionsbyhash', unrolling != null ? [hash, unrolling] : [hash]);
    }
    static getBlockTransactionsByNumber(number, unrolling) {
        return this.fetch('cache', 'getblocktransactionsbynumber', unrolling != null ? [number, unrolling] : [number]);
    }
    static getTransactionsByOwner(address, offset, count, direction, unrolling) {
        const args = [address, offset, count];
        if (direction != null)
            args.push(direction);
        if (unrolling != null)
            args.push(unrolling);
        return this.fetch('no-cache', 'gettransactionsbyowner', args);
    }
    static getTransactionByHash(hash, unrolling) {
        return this.fetch('cache', 'gettransactionbyhash', unrolling != null ? [hash, unrolling] : [hash]);
    }
    static getMempoolTransactionByHash(hash) {
        return this.fetch('cache', 'getmempooltransactionbyhash', [hash]);
    }
    static getAssetHolders(asset, filter) {
        return this.fetch('no-cache', 'getassetholders', [asset.handle, filter]);
    }
    static getBlockByNumber(number, unrolling) {
        return this.fetch('cache', 'getblockbynumber', unrolling != null ? [number, unrolling] : [number]);
    }
    static getBlockByHash(hash, unrolling) {
        return this.fetch('cache', 'getblockbyhash', unrolling != null ? [hash, unrolling] : [hash]);
    }
    static getBlockTipNumber() {
        return this.fetch('no-cache', 'getblocktipnumber', []);
    }
    static getGasPrice(asset, percentile) {
        return this.fetch('no-cache', 'getgasprice', percentile != null ? [asset.handle, percentile] : [asset.handle]);
    }
}
exports.RPC = RPC;
RPC.resolver = null;
RPC.interfaces = {
    servers: new Set(),
    overrider: null,
    preload: false
};
RPC.requests = {
    pending: new Map(),
    count: 0
};
RPC.topics = {
    blocks: undefined,
    transactions: undefined,
    addresses: []
};
RPC.socket = null;
RPC.forcePolicy = null;
RPC.onNodeMessage = null;
RPC.onNodeRequest = null;
RPC.onNodeResponse = null;
RPC.onNodeError = null;
RPC.onCacheStore = null;
RPC.onCacheLoad = null;
RPC.onCacheKeys = null;
RPC.onIpsetLoad = null;
RPC.onIpsetStore = null;

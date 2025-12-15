"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RPC = exports.EventResolver = exports.WalletKeychain = exports.InterfaceProps = exports.NetworkType = exports.WalletType = exports.EventType = void 0;
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const algorithm_1 = require("./algorithm");
const types_1 = require("./types");
const WEBSOCKET_TIMEOUT = 24000;
var EventType;
(function (EventType) {
    EventType[EventType["Error"] = 0] = "Error";
    EventType[EventType["Transfer"] = 1] = "Transfer";
    EventType[EventType["TransferIsolated"] = 2] = "TransferIsolated";
    EventType[EventType["TransferFee"] = 3] = "TransferFee";
    EventType[EventType["BridgeTransfer"] = 4] = "BridgeTransfer";
    EventType[EventType["BridgeAccount"] = 5] = "BridgeAccount";
    EventType[EventType["BridgeQueue"] = 6] = "BridgeQueue";
    EventType[EventType["BridgePolicy"] = 7] = "BridgePolicy";
    EventType[EventType["BridgeParticipant"] = 8] = "BridgeParticipant";
    EventType[EventType["WitnessAccount"] = 9] = "WitnessAccount";
    EventType[EventType["WitnessTransaction"] = 10] = "WitnessTransaction";
    EventType[EventType["RollupReceipt"] = 11] = "RollupReceipt";
    EventType[EventType["Unknown"] = 12] = "Unknown";
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
class InterfaceProps {
    constructor() {
        this.streaming = true;
    }
}
exports.InterfaceProps = InterfaceProps;
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
                balances: {},
                accounts: {},
                queues: {},
                policies: {},
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
                case types_1.Types.ValidatorAttestation: {
                    if (event.args.length >= 3 && (isNumber(event.args[0]) || typeof event.args[0] == 'string') && typeof event.args[1] == 'string' && isNumber(event.args[2])) {
                        const [assetId, owner, type] = event.args;
                        const asset = new algorithm_1.AssetId(assetId);
                        const ownerAddress = algorithm_1.Signing.encodeAddress(new algorithm_1.Pubkeyhash(owner)) || owner;
                        switch (type.toNumber()) {
                            case 0: {
                                if (event.args.length >= 4 && isNumber(event.args[3])) {
                                    const newAccounts = event.args[3];
                                    if (!result.bridge.accounts[ownerAddress])
                                        result.bridge.accounts[ownerAddress] = {};
                                    if (!result.bridge.accounts[ownerAddress][asset.handle])
                                        result.bridge.accounts[ownerAddress][asset.handle] = { asset: asset, newAccounts: 0 };
                                    result.bridge.accounts[ownerAddress][asset.handle].newAccounts += newAccounts.toNumber();
                                    result.events.push({ type: EventType.BridgeAccount, asset: asset, owner: ownerAddress, accounts: newAccounts });
                                }
                                break;
                            }
                            case 1: {
                                if (event.args.length >= 4 && (isNumber(event.args[3]) || typeof event.args[3] == 'string')) {
                                    const transactionHash = event.args[3];
                                    if (!result.bridge.queues[ownerAddress])
                                        result.bridge.queues[ownerAddress] = {};
                                    result.bridge.queues[ownerAddress][asset.handle] = { asset: asset, transactionHash: isNumber(transactionHash) ? null : transactionHash };
                                    result.events.push({ type: EventType.BridgeQueue, asset: asset, owner: ownerAddress, transactionHash: isNumber(transactionHash) ? null : transactionHash });
                                }
                                break;
                            }
                            case 2: {
                                if (!result.bridge.policies[ownerAddress])
                                    result.bridge.policies[ownerAddress] = {};
                                result.bridge.policies[ownerAddress][asset.handle] = { asset: asset };
                                result.events.push({ type: EventType.BridgePolicy, asset: asset, owner: ownerAddress });
                                break;
                            }
                            default:
                                break;
                        }
                    }
                    break;
                }
                case types_1.Types.BridgeBalance: {
                    if (event.args.length >= 3 && (isNumber(event.args[0]) || typeof event.args[0] == 'string') && typeof event.args[1] == 'string' && isNumber(event.args[2])) {
                        const [assetId, owner, value] = event.args;
                        const asset = new algorithm_1.AssetId(assetId);
                        const ownerAddress = algorithm_1.Signing.encodeAddress(new algorithm_1.Pubkeyhash(owner)) || owner;
                        if (!result.bridge.balances[ownerAddress])
                            result.bridge.balances[ownerAddress] = {};
                        if (!result.bridge.balances[ownerAddress][asset.handle])
                            result.bridge.balances[ownerAddress][asset.handle] = { asset: asset, supply: new bignumber_js_1.default(0) };
                        const state = result.bridge.balances[ownerAddress][asset.handle];
                        state.supply = state.supply.plus(value);
                        result.events.push({ type: EventType.BridgeTransfer, asset: asset, owner: ownerAddress, value: new bignumber_js_1.default(value) });
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
                        result.bridge.participants.add(ownerAddress);
                        result.events.push({ type: EventType.BridgeParticipant, owner: ownerAddress });
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
            return !state.account.balances[address] &&
                !state.bridge.balances[address] &&
                !Object.keys(state.bridge.queues).length &&
                !Object.keys(state.bridge.accounts).length &&
                !Object.keys(state.bridge.policies).length &&
                !state.bridge.participants.size &&
                !Object.keys(state.witness.accounts).length &&
                !Object.keys(state.witness.transactions).length &&
                !Object.keys(state.receipts).length &&
                !state.errors.length;
        }
        else {
            return !Object.keys(state.account.balances).length &&
                !Object.keys(state.bridge.balances).length &&
                !Object.keys(state.bridge.queues).length &&
                !Object.keys(state.bridge.accounts).length &&
                !Object.keys(state.bridge.policies).length &&
                !state.bridge.participants.size &&
                !Object.keys(state.witness.accounts).length &&
                !Object.keys(state.witness.transactions).length &&
                !Object.keys(state.receipts).length &&
                !state.errors.length;
        }
    }
}
exports.EventResolver = EventResolver;
class RPC {
    static reportAvailability(type, location, available) {
        const interfaces = type == 'ws' ? this.wsInterfaces : this.httpInterfaces;
        if (available) {
            interfaces.online.add(location);
            interfaces.offline.delete(location);
        }
        else {
            interfaces.online.delete(location);
            interfaces.offline.add(location);
        }
        if (this.onIpsetStore != null)
            this.onIpsetStore(type, { online: [...interfaces.online], offline: [...interfaces.offline] });
    }
    static fetchObject(data) {
        if (typeof data == 'string') {
            try {
                if (!data.startsWith('0x')) {
                    const numeric = new bignumber_js_1.default(data, 10).dp(18);
                    if (data.startsWith(numeric.toString()))
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
        if (Array.isArray(data) || data.result === undefined) {
            return undefined;
        }
        else if (this.onCacheStore != null && hash != null && data.error == null)
            this.onCacheStore(hash, data.result);
        return this.fetchData(data);
    }
    static fetchNode(type) {
        try {
            const nodes = Array.from(type == 'ws' ? this.wsInterfaces.online.keys() : this.httpInterfaces.online.keys());
            const node = nodes[Math.floor(Math.random() * nodes.length)];
            const location = new URL('tcp://' + node);
            const secure = (location.port == '443' || this.requiresSecureTransport(location.hostname));
            return [`${type}${secure ? 's' : ''}://${node}/`, node];
        }
        catch {
            return null;
        }
    }
    static fetchResolver(type) {
        try {
            if (!this.resolver)
                return null;
            return [`${this.resolver}${this.resolver.endsWith('/') ? '' : '/'}?port=rpc&rpc=1&rpc_external_access=1&rpc_public_access=1${type == 'ws' ? '&rpc_web_sockets=1' : ''}`, this.resolver];
        }
        catch {
            return null;
        }
    }
    static async fetchIpset(type, mode) {
        const interfaces = type == 'ws' ? this.wsInterfaces : this.httpInterfaces;
        if (interfaces.overrider != null) {
            try {
                const scheme = new URL('tcp://' + interfaces.overrider);
                const address = scheme.hostname + (scheme.port.length > 0 ? ':' + scheme.port : '');
                const retry = interfaces.offline.has(address);
                interfaces.offline.delete(address);
                interfaces.online.add(address);
                return retry ? 0 : 1;
            }
            catch {
                return 0;
            }
        }
        switch (mode) {
            case 'preload': {
                if (interfaces.preload)
                    return 0;
                const seeds = this.onIpsetLoad ? this.onIpsetLoad(type) : null;
                interfaces.preload = true;
                if (!seeds || !Array.isArray(seeds.online) || !Array.isArray(seeds.offline))
                    return 0;
                let results = 0;
                for (let i = 0; i < seeds.offline.length; i++) {
                    try {
                        const seed = seeds.offline[i];
                        const scheme = new URL('tcp://' + seed);
                        const address = scheme.hostname + (scheme.port.length > 0 ? ':' + scheme.port : '');
                        if (seed.length > 0 && address.length > 0 && !interfaces.online.has(address) && !interfaces.offline.has(address)) {
                            interfaces.offline.add(address);
                            interfaces.online.delete(address);
                            ++results;
                        }
                    }
                    catch { }
                }
                for (let i = 0; i < seeds.online.length; i++) {
                    try {
                        const seed = seeds.online[i];
                        const scheme = new URL('tcp://' + seed);
                        const address = scheme.hostname + (scheme.port.length > 0 ? ':' + scheme.port : '');
                        if (seed.length > 0 && address.length > 0 && !interfaces.online.has(address) && !interfaces.offline.has(address)) {
                            interfaces.offline.delete(address);
                            interfaces.online.add(address);
                            ++results;
                        }
                    }
                    catch { }
                }
                return results;
            }
            case 'fetch': {
                const location = this.fetchResolver(type);
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
                                if (seed.length > 0 && address.length > 0 && !interfaces.online.has(address) && !interfaces.offline.has(address)) {
                                    interfaces.online.add(address);
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
                    this.onIpsetStore(type, { online: [...interfaces.online], offline: [...interfaces.offline] });
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
        if (this.socket != null) {
            let result = undefined;
            try {
                if (this.onNodeRequest)
                    this.onNodeRequest(this.socket.url, method, body, content.length);
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
        }
        if (!this.httpInterfaces.preload) {
            let preloadSize = await this.fetchIpset('http', 'preload');
            let fetchSize = preloadSize > 0 ? 0 : await this.fetchIpset('http', 'fetch');
            if (!preloadSize && !fetchSize)
                return null;
        }
        while (this.httpInterfaces.offline.size < this.httpInterfaces.online.size) {
            const location = this.fetchNode('http');
            if (location != null) {
                let result = undefined;
                try {
                    if (this.onNodeRequest)
                        this.onNodeRequest(location[0], method, body, content.length);
                    let dataContent, data;
                    try {
                        const response = await fetch(location[0], {
                            headers: { 'Content-Type': 'application/json' },
                            method: 'POST',
                            body: content,
                        });
                        dataContent = await response.text();
                        data = JSON.parse(dataContent);
                        this.reportAvailability('http', location[1], true);
                    }
                    catch (exception) {
                        this.reportAvailability('http', location[1], false);
                        throw exception;
                    }
                    if (this.onNodeResponse)
                        this.onNodeResponse(location[0], method, data, dataContent.length);
                    result = this.fetchResult(hash, data);
                }
                catch (exception) {
                    if (this.onNodeError)
                        this.onNodeError(location[0], method, exception);
                }
                if (result !== undefined) {
                    if (result instanceof Error)
                        throw result;
                    return result;
                }
            }
            else {
                const found = await this.fetchIpset('http', 'fetch');
                if (!found) {
                    break;
                }
            }
        }
        if (this.httpInterfaces.offline.size >= this.httpInterfaces.online.size) {
            const found = await this.fetchIpset('http', 'fetch');
            if (!found) {
                this.httpInterfaces.online = new Set([...this.httpInterfaces.online, ...this.httpInterfaces.offline]);
                this.httpInterfaces.offline.clear();
            }
        }
        if (this.onCacheLoad != null) {
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
    static async connectSocket(addresses) {
        if (this.socket != null)
            return 0;
        else if (!this.getProps().streaming)
            return null;
        const method = 'connect';
        if (!this.wsInterfaces.preload) {
            let preloadSize = await this.fetchIpset('ws', 'preload');
            let fetchSize = preloadSize > 0 ? 0 : await this.fetchIpset('ws', 'fetch');
            if (!preloadSize && !fetchSize)
                return null;
        }
        while (this.wsInterfaces.offline.size < this.wsInterfaces.online.size) {
            const location = this.fetchNode('ws');
            if (location != null) {
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
                        this.reportAvailability('ws', location[1], false);
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
                        this.connectSocket(addresses);
                    };
                    const events = await this.fetch('no-cache', 'subscribe', [addresses.join(',')]);
                    this.reportAvailability('ws', location[1], true);
                    return events;
                }
                catch (exception) {
                    if (this.onNodeError)
                        this.onNodeError(location[0], method, exception);
                }
            }
            else {
                const found = await this.fetchIpset('ws', 'fetch');
                if (!found) {
                    break;
                }
            }
        }
        if (this.wsInterfaces.offline.size >= this.wsInterfaces.online.size) {
            const found = await this.fetchIpset('ws', 'fetch');
            if (!found) {
                this.wsInterfaces.online = new Set([...this.wsInterfaces.online, ...this.wsInterfaces.offline]);
                this.wsInterfaces.offline.clear();
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
    static applyResolver(resolver) {
        this.resolver = resolver;
    }
    static applyServer(server) {
        this.httpInterfaces.overrider = server;
        this.wsInterfaces.overrider = server;
        if (server != null) {
            this.httpInterfaces.online.add(server);
            this.httpInterfaces.offline.delete(server);
            this.wsInterfaces.online.add(server);
            this.wsInterfaces.offline.delete(server);
            if (this.onIpsetStore != null) {
                this.onIpsetStore('http', { online: [...this.httpInterfaces.online], offline: [...this.httpInterfaces.offline] });
                this.onIpsetStore('ws', { online: [...this.wsInterfaces.online], offline: [...this.wsInterfaces.offline] });
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
        this.onPropsLoad = implementation.onPropsLoad || null;
        this.onPropsStore = implementation.onPropsStore || null;
    }
    static saveProps(props) {
        if (this.onPropsStore != null)
            this.onPropsStore(props);
        this.props.data = props;
        this.props.preload = true;
    }
    static getProps() {
        if (this.props.preload)
            return this.props.data;
        if (this.onPropsLoad != null) {
            const props = this.onPropsLoad();
            if (props != null)
                this.props.data = props;
        }
        this.props.preload = true;
        return this.props.data;
    }
    static requiresSecureTransport(address) {
        if (typeof window != 'undefined' && window?.location?.protocol == 'https:')
            return true;
        else if (address == 'localhost')
            return false;
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
    static callTransaction(asset, fromAddress, toAddress, value, method, args) {
        return this.fetch('no-cache', 'calltransaction', [asset.handle, fromAddress, toAddress, value, method, ...args]);
    }
    static getWallet() {
        return this.fetch('no-cache', 'getwallet');
    }
    static getBlockchains() {
        return this.fetch('cache', 'getblockchains', []);
    }
    static getBestValidatorAttestationsForSelection(asset, offset, count) {
        return this.fetch('no-cache', 'getbestvalidatorattestationsforselection', [asset.handle, offset, count]);
    }
    static getBestBridgeBalancesForSelection(asset, offset, count) {
        return this.fetch('no-cache', 'getbestbridgebalancesforselection', [asset.handle, offset, count]);
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
RPC.httpInterfaces = {
    online: new Set(),
    offline: new Set(),
    overrider: null,
    preload: false
};
RPC.wsInterfaces = {
    online: new Set(),
    offline: new Set(),
    overrider: null,
    preload: false
};
RPC.requests = {
    pending: new Map(),
    count: 0
};
RPC.props = {
    data: new InterfaceProps(),
    preload: false
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
RPC.onPropsLoad = null;
RPC.onPropsStore = null;

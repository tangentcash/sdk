import BigNumber from "bignumber.js";
import { AssetId, ByteUtil, Hashing, Pubkeyhash, Signing, Uint256 } from "./algorithm";
import { Types } from "./types";
const WEBSOCKET_TIMEOUT = 24000;
export var WalletType;
(function (WalletType) {
    WalletType["Mnemonic"] = "mnemonic";
    WalletType["SecretKey"] = "secretkey";
    WalletType["PublicKey"] = "publickey";
    WalletType["Address"] = "address";
})(WalletType || (WalletType = {}));
export var NetworkType;
(function (NetworkType) {
    NetworkType["Mainnet"] = "mainnet";
    NetworkType["Testnet"] = "testnet";
    NetworkType["Regtest"] = "regtest";
})(NetworkType || (NetworkType = {}));
export class InterfaceProps {
    constructor() {
        this.streaming = true;
    }
}
export class WalletKeychain {
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
        const secretKey = Signing.deriveSecretKeyFromMnemonic(mnemonic.join(' '));
        if (!secretKey)
            return null;
        const serialized = Signing.encodeSecretKey(secretKey);
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
        result.secretKey = Signing.decodeSecretKey(secretKey);
        if (!result.secretKey)
            return null;
        result.publicKey = Signing.derivePublicKey(result.secretKey);
        if (!result.publicKey)
            return null;
        result.publicKeyHash = Signing.derivePublicKeyHash(result.publicKey);
        if (!result.publicKeyHash)
            return null;
        result.address = Signing.encodeAddress(result.publicKeyHash);
        return result;
    }
    static fromPublicKey(publicKey) {
        const result = new WalletKeychain();
        result.type = WalletType.PublicKey;
        result.publicKey = Signing.decodePublicKey(publicKey);
        if (!result.publicKey)
            return null;
        result.publicKeyHash = Signing.derivePublicKeyHash(result.publicKey);
        if (!result.publicKeyHash)
            return null;
        result.address = Signing.encodeAddress(result.publicKeyHash);
        return result;
    }
    static fromAddress(address) {
        const result = new WalletKeychain();
        result.type = WalletType.Address;
        result.address = address;
        result.publicKeyHash = Signing.decodeAddress(result.address);
        if (!result.publicKeyHash)
            return null;
        return result;
    }
}
export class EventResolver {
    static calculateSummaryState(events) {
        const result = {
            account: {
                balances: {},
                refuels: {},
                fees: {}
            },
            depository: {
                balances: {},
                accounts: {},
                queues: {},
                policies: {},
                participants: new Set()
            },
            witness: {
                accounts: {},
                transactions: {}
            },
            receipts: {},
            errors: []
        };
        if (!events || !Array.isArray(events))
            return result;
        for (let i = 0; i < events.length; i++) {
            const event = events[i];
            switch (event.event.toNumber()) {
                case 0: {
                    if (event.args.length >= 1 && typeof event.args[0] == 'string') {
                        result.errors.push(event.args[0]);
                    }
                    break;
                }
                case Types.AccountBalance: {
                    if (event.args.length >= 4 && (event.args[0] instanceof BigNumber || typeof event.args[0] == 'string') && typeof event.args[1] == 'string' && typeof event.args[2] == 'string' && event.args[3] instanceof BigNumber) {
                        const [assetId, from, to, value] = event.args;
                        const fromAddress = Signing.encodeAddress(new Pubkeyhash(from)) || from;
                        const toAddress = Signing.encodeAddress(new Pubkeyhash(to)) || to;
                        const asset = new AssetId(assetId);
                        if (!asset.handle)
                            break;
                        if (!result.account.balances[fromAddress])
                            result.account.balances[fromAddress] = {};
                        if (!result.account.balances[fromAddress][asset.handle])
                            result.account.balances[fromAddress][asset.handle] = { asset: asset, supply: new BigNumber(0), reserve: new BigNumber(0) };
                        if (!result.account.balances[toAddress])
                            result.account.balances[toAddress] = {};
                        if (!result.account.balances[toAddress][asset.handle])
                            result.account.balances[toAddress][asset.handle] = { asset: asset, supply: new BigNumber(0), reserve: new BigNumber(0) };
                        const fromState = result.account.balances[fromAddress][asset.handle];
                        fromState.supply = fromState.supply.minus(value);
                        const toState = result.account.balances[toAddress][asset.handle];
                        toState.supply = toState.supply.plus(value);
                    }
                    else if (event.args.length >= 4 && (event.args[0] instanceof BigNumber || typeof event.args[0] == 'string') && typeof event.args[1] == 'string' && event.args[2] instanceof BigNumber && event.args[3] instanceof BigNumber) {
                        const [assetId, owner, supply, reserve] = event.args;
                        const ownerAddress = Signing.encodeAddress(new Pubkeyhash(owner)) || owner;
                        const asset = new AssetId(assetId);
                        if (!asset.handle)
                            break;
                        if (!result.account.balances[ownerAddress])
                            result.account.balances[ownerAddress] = {};
                        if (!result.account.balances[ownerAddress][asset.handle])
                            result.account.balances[ownerAddress][asset.handle] = { asset: asset, supply: new BigNumber(0), reserve: new BigNumber(0) };
                        const ownerState = result.account.balances[ownerAddress][asset.handle];
                        ownerState.supply = ownerState.supply.plus(supply);
                        ownerState.reserve = ownerState.reserve.plus(reserve);
                    }
                    else if (event.args.length >= 3 && (event.args[0] instanceof BigNumber || typeof event.args[0] == 'string') && typeof event.args[1] == 'string' && event.args[2] instanceof BigNumber) {
                        const [assetId, owner, fee] = event.args;
                        const ownerAddress = Signing.encodeAddress(new Pubkeyhash(owner)) || owner;
                        const asset = new AssetId(assetId);
                        if (!asset.handle)
                            break;
                        if (!result.account.balances[ownerAddress])
                            result.account.balances[ownerAddress] = {};
                        if (!result.account.balances[ownerAddress][asset.handle])
                            result.account.balances[ownerAddress][asset.handle] = { asset: asset, supply: new BigNumber(0), reserve: new BigNumber(0) };
                        if (!result.account.fees[ownerAddress])
                            result.account.fees[ownerAddress] = {};
                        if (!result.account.fees[ownerAddress][asset.handle])
                            result.account.fees[ownerAddress][asset.handle] = { asset: asset, fee: new BigNumber(0) };
                        const balanceState = result.account.balances[ownerAddress][asset.handle];
                        const feeState = result.account.fees[ownerAddress][asset.handle];
                        balanceState.supply = balanceState.supply.plus(fee);
                        feeState.fee = feeState.fee.plus(fee);
                    }
                    break;
                }
                case Types.ValidatorProduction: {
                    if (event.args.length >= 3 && typeof event.args[0] == 'string' && typeof event.args[1] == 'boolean' && event.args[2] instanceof BigNumber) {
                        const [from, mint_or_burn, value] = event.args;
                        const fromAddress = Signing.encodeAddress(new Pubkeyhash(from)) || from;
                        if (!result.account.refuels[fromAddress])
                            result.account.refuels[fromAddress] = new BigNumber(0);
                        if (mint_or_burn)
                            result.account.refuels[fromAddress] = result.account.refuels[fromAddress].plus(value);
                        else
                            result.account.refuels[fromAddress] = result.account.refuels[fromAddress].minus(value);
                    }
                    break;
                }
                case Types.DepositoryBalance: {
                    if (event.args.length >= 3 && (event.args[0] instanceof BigNumber || typeof event.args[0] == 'string') && typeof event.args[1] == 'string' && event.args[2] instanceof BigNumber) {
                        const [assetId, owner, value] = event.args;
                        const asset = new AssetId(assetId);
                        const ownerAddress = Signing.encodeAddress(new Pubkeyhash(owner)) || owner;
                        if (!asset.handle)
                            break;
                        if (!result.depository.balances[ownerAddress])
                            result.depository.balances[ownerAddress] = {};
                        if (!result.depository.balances[ownerAddress][asset.handle])
                            result.depository.balances[ownerAddress][asset.handle] = { asset: asset, supply: new BigNumber(0) };
                        const state = result.depository.balances[ownerAddress][asset.handle];
                        state.supply = state.supply.plus(value);
                    }
                    break;
                }
                case Types.DepositoryPolicy: {
                    if (event.args.length >= 3 && (event.args[0] instanceof BigNumber || typeof event.args[0] == 'string') && typeof event.args[1] == 'string' && event.args[2] instanceof BigNumber) {
                        const [assetId, owner, type] = event.args;
                        const asset = new AssetId(assetId);
                        const ownerAddress = Signing.encodeAddress(new Pubkeyhash(owner)) || owner;
                        if (!asset.handle)
                            break;
                        switch (type.toNumber()) {
                            case 0: {
                                if (event.args.length >= 4 && event.args[3] instanceof BigNumber) {
                                    const newAccounts = event.args[3];
                                    if (!result.depository.accounts[ownerAddress])
                                        result.depository.accounts[ownerAddress] = {};
                                    if (!result.depository.accounts[ownerAddress][asset.handle])
                                        result.depository.accounts[ownerAddress][asset.handle] = { asset: asset, newAccounts: 0 };
                                    result.depository.accounts[ownerAddress][asset.handle].newAccounts += newAccounts.toNumber();
                                }
                                break;
                            }
                            case 1: {
                                if (event.args.length >= 4 && (event.args[3] instanceof BigNumber || typeof event.args[3] == 'string')) {
                                    const transactionHash = event.args[3];
                                    if (!result.depository.queues[ownerAddress])
                                        result.depository.queues[ownerAddress] = {};
                                    result.depository.queues[ownerAddress][asset.handle] = { asset: asset, transactionHash: transactionHash instanceof BigNumber ? null : transactionHash };
                                }
                                break;
                            }
                            case 2: {
                                if (event.args.length >= 6 && event.args[3] instanceof BigNumber && typeof event.args[4] == 'boolean' && typeof event.args[5] == 'boolean') {
                                    const [securityLevel, acceptsAccountRequests, acceptsWithdrawalRequests] = event.args.slice(3, 6);
                                    if (!result.depository.policies[ownerAddress])
                                        result.depository.policies[ownerAddress] = {};
                                    result.depository.policies[ownerAddress][asset.handle] = { asset: asset, securityLevel: securityLevel, acceptsAccountRequests: acceptsAccountRequests, acceptsWithdrawalRequests: acceptsWithdrawalRequests };
                                }
                                break;
                            }
                            default:
                                break;
                        }
                    }
                    break;
                }
                case Types.WitnessAccount: {
                    if (event.args.length >= 3 && (event.args[0] instanceof BigNumber || typeof event.args[0] == 'string') && event.args[1] instanceof BigNumber) {
                        const [assetId, addressPurpose, addressAliases] = [event.args[0], event.args[1], event.args.slice(2)];
                        const asset = new AssetId(assetId);
                        if (!asset.handle)
                            break;
                        let purpose;
                        switch (addressPurpose.toNumber()) {
                            case 1:
                                purpose = 'routing';
                                break;
                            case 2:
                                purpose = 'depository';
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
                    }
                    break;
                }
                case Types.WitnessTransaction: {
                    if (event.args.length == 2 && (event.args[0] instanceof BigNumber || typeof event.args[0] == 'string') && typeof event.args[1] == 'string') {
                        const [assetId, transactionId] = event.args;
                        const asset = new AssetId(assetId);
                        if (!asset.handle)
                            break;
                        if (result.witness.transactions[asset.handle] != null)
                            result.witness.transactions[asset.handle].transactionIds.push(transactionId);
                        else
                            result.witness.transactions[asset.handle] = { asset: asset, transactionIds: [transactionId] };
                    }
                    break;
                }
                case Types.Rollup: {
                    if (event.args.length == 3 && (event.args[0] instanceof BigNumber || typeof event.args[0] == 'string') && (event.args[1] instanceof BigNumber || typeof event.args[1] == 'string') && (event.args[2] instanceof BigNumber || typeof event.args[2] == 'string')) {
                        const [transactionHash, relativeGasUse, relativeGasPaid] = event.args;
                        result.receipts[new Uint256(transactionHash.toString()).toHex()] = {
                            relativeGasUse: new BigNumber(relativeGasUse.toString()),
                            relativeGasPaid: new BigNumber(relativeGasPaid.toString())
                        };
                    }
                    break;
                }
                case Types.DepositoryAccount:
                case Types.DepositoryRegrouping: {
                    if (event.args.length == 1 && typeof event.args[0] == 'string') {
                        const [owner] = event.args;
                        const ownerAddress = Signing.encodeAddress(new Pubkeyhash(owner)) || owner;
                        result.depository.participants.add(ownerAddress);
                    }
                    break;
                }
                default:
                    break;
            }
        }
        return result;
    }
    static calculateAssetRecords(data) {
        const result = {};
        for (let i = 0; i < data.length; i++) {
            const item = data[i];
            const assetId = item.asset != null && (item.asset.id instanceof BigNumber || typeof item.asset.id == 'string') ? item.asset.id : null;
            const assetHandle = assetId != null ? new AssetId(assetId).handle || '' : '';
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
                !state.account.refuels[address] &&
                !state.depository.balances[address] &&
                !Object.keys(state.depository.queues).length &&
                !Object.keys(state.depository.accounts).length &&
                !Object.keys(state.depository.policies).length &&
                !state.depository.participants.size &&
                !Object.keys(state.witness.accounts).length &&
                !Object.keys(state.witness.transactions).length &&
                !Object.keys(state.receipts).length &&
                !state.errors.length;
        }
        else {
            return !Object.keys(state.account.balances).length &&
                !Object.keys(state.account.refuels).length &&
                !Object.keys(state.depository.balances).length &&
                !Object.keys(state.depository.queues).length &&
                !Object.keys(state.depository.accounts).length &&
                !Object.keys(state.depository.policies).length &&
                !state.depository.participants.size &&
                !Object.keys(state.witness.accounts).length &&
                !Object.keys(state.witness.transactions).length &&
                !Object.keys(state.receipts).length &&
                !state.errors.length;
        }
    }
}
export class RPC {
    static fetchObject(data) {
        if (typeof data == 'string') {
            try {
                if (!data.startsWith('0x')) {
                    const numeric = new BigNumber(data, 10);
                    if (numeric.toString() == data)
                        return numeric;
                }
            }
            catch { }
        }
        else if (typeof data == 'number') {
            return new BigNumber(data);
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
        const hash = ByteUtil.uint8ArrayToHexString(Hashing.hash160(ByteUtil.byteStringToUint8Array(message + ' / ' + code)));
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
            const secure = (location.port == '443');
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
            const location = new URL('tcp://' + this.resolver);
            const secure = (location.port == '443');
            return [`${secure ? 'https' : 'http'}://${this.resolver}/?interface=1&public=1${type == 'ws' ? '&streaming=1' : ''}`, this.resolver];
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
                if (!seeds || !Array.isArray(seeds) || !seeds.length)
                    return 0;
                let results = 0;
                for (let i = 0; i < seeds.length; i++) {
                    try {
                        const seed = seeds[i];
                        const scheme = new URL('tcp://' + seed);
                        const address = scheme.hostname + (scheme.port.length > 0 ? ':' + scheme.port : '');
                        if (seed.length > 0 && address.length > 0 && !interfaces.online.has(address) && !interfaces.offline.has(address)) {
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
                                const scheme = new URL(seed);
                                const address = scheme.hostname + (scheme.port.length > 0 ? ':' + scheme.port : '');
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
                    this.onIpsetStore(type, [...interfaces.online, ...interfaces.offline]);
                return 0;
            }
            default:
                return 0;
        }
    }
    static async fetch(policy, method, args) {
        const id = (++this.requests.count).toString();
        const hash = ByteUtil.uint8ArrayToHexString(Hashing.hash512(ByteUtil.utf8StringToUint8Array(JSON.stringify([method, args || []]))));
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
        await this.fetchIpset('http', 'preload');
        while (this.httpInterfaces.offline.size < this.httpInterfaces.online.size) {
            const location = this.fetchNode('http');
            if (location != null) {
                let result = undefined;
                try {
                    if (this.onNodeRequest)
                        this.onNodeRequest(location[0], method, body, content.length);
                    const response = await fetch(location[0], {
                        headers: { 'Content-Type': 'application/json' },
                        method: 'POST',
                        body: content,
                    });
                    const dataContent = await response.text();
                    const data = JSON.parse(dataContent);
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
                this.httpInterfaces.online.delete(location[1]);
                this.httpInterfaces.offline.add(location[1]);
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
    static async connectSocket(address) {
        if (this.socket != null)
            return 0;
        else if (!this.getProps().streaming)
            return null;
        const method = 'connect';
        await this.fetchIpset('ws', 'preload');
        while (this.wsInterfaces.offline.size < this.wsInterfaces.online.size) {
            const location = this.fetchNode('ws');
            if (location != null) {
                try {
                    if (this.onNodeRequest)
                        this.onNodeRequest(location[0], method, null, 0);
                    const connection = await new Promise((resolve, reject) => {
                        const socket = new WebSocket(location[0]);
                        socket.onopen = () => resolve(socket);
                        socket.onerror = () => reject(new Error('websocket connection error'));
                    });
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
                        this.connectSocket(address);
                    };
                    const events = await this.fetch('no-cache', 'subscribe', [address]);
                    return events;
                }
                catch (exception) {
                    if (this.onNodeError)
                        this.onNodeError(location[0], method, exception);
                }
                this.wsInterfaces.online.delete(location[1]);
                this.wsInterfaces.offline.add(location[1]);
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
    static clearCache() {
        if (this.onCacheKeys != null && this.onCacheStore != null) {
            for (let key in this.onCacheKeys()) {
                this.onCacheStore(key);
            }
        }
    }
    static submitTransaction(hexMessage, validate) {
        return this.fetch('no-cache', 'submittransaction', [hexMessage, validate]);
    }
    static getWallet() {
        return this.fetch('no-cache', 'getwallet');
    }
    static getParticipations() {
        return this.fetch('no-cache', 'getparticipations');
    }
    static getBlockchains() {
        return this.fetch('cache', 'getblockchains', []);
    }
    static getBestDepositoryRewardsForSelection(asset, offset, count) {
        return this.fetch('no-cache', 'getbestdepositoryrewardsforselection', [asset.handle, offset, count]);
    }
    static getBestDepositoryBalancesForSelection(asset, offset, count) {
        return this.fetch('no-cache', 'getbestdepositorybalancesforselection', [asset.handle, offset, count]);
    }
    static getBestDepositoryPoliciesForSelection(asset, offset, count) {
        return this.fetch('no-cache', 'getbestdepositorypoliciesforselection', [asset.handle, offset, count]);
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
    static getValidatorParticipations(address, offset, count) {
        return this.fetch('no-cache', 'getvalidatorparticipations', [address, offset, count]);
    }
    static getValidatorAttestations(address, offset, count) {
        return this.fetch('no-cache', 'getvalidatorattestations', [address, offset, count]);
    }
    static getDepositoryBalances(address, offset, count) {
        return this.fetch('no-cache', 'getdepositorybalances', [address, offset, count]);
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
    static getMempoolCumulativeConsensus(hash) {
        return this.fetch('no-cache', 'getmempoolattestation', [hash]);
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
    static getOptimalTransactionGas(hexMessage) {
        return this.fetch('no-cache', 'getoptimaltransactiongas', [hexMessage]);
    }
    static getEstimateTransactionGas(hexMessage) {
        return this.fetch('no-cache', 'getestimatetransactiongas', [hexMessage]);
    }
}
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

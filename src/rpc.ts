import BigNumber from "bignumber.js";
import { AssetId, ByteUtil, Hashing, Pubkey, Pubkeyhash, Seckey, Hashsig, Signing, Uint256 } from "./algorithm";
import { Ledger } from "./schema";
import { Types } from "./types";

const WEBSOCKET_TIMEOUT = 24000;

export type FetchAllCallback<T> = (offset: number, count: number) => Promise<T[] | null>;
export type NodeError = (address: string, method: string, error: unknown) => void;
export type NodeRequest = (address: string, method: string, message: any, size: number) => void;
export type NodeResponse = (address: string, method: string, message: any, size: number) => void;
export type NodeMessage = (event: { type: string, result: any }) => void;
export type CacheStore = (path: string, value?: any) => boolean;
export type CacheLoad = (path: string) => any | null;
export type CacheKeys = () => string[];
export type IpsetLoad = (type: 'http' | 'ws') => string[] | null;
export type IpsetStore = (type: 'http' | 'ws', ipset: string[]) => boolean;
export type PropsLoad = () => InterfaceProps | null;
export type PropsStore = (props: InterfaceProps) => boolean;
export type PromiseCallback = (data: any) => void;
export type ClearCallback = () => any;

export enum EventType {
  Error,
  Transfer,
  TransferIsolated,
  TransferFee,
  DepositoryTransfer,
  DepositoryAccount,
  DepositoryQueue,
  DepositoryPolicy,
  DepositoryParticipant,
  WitnessAccount,
  WitnessTransaction,
  RollupReceipt,
  Unknown
}

export type EventData = {
  type: EventType.Error,
  message: string
} | {
  type: EventType.Transfer,
  asset: AssetId,
  from: string,
  to: string,
  value: BigNumber
} | {
  type: EventType.TransferIsolated,
  asset: AssetId,
  owner: string,
  supply: BigNumber,
  reserve: BigNumber
} | {
  type: EventType.TransferFee,
  asset: AssetId,
  owner: string,
  fee: BigNumber
} | {
  type: EventType.DepositoryTransfer,
  asset: AssetId,
  owner: string,
  value: BigNumber
} | {
  type: EventType.DepositoryAccount,
  asset: AssetId,
  owner: string,
  accounts: BigNumber
} | {
  type: EventType.DepositoryQueue,
  asset: AssetId,
  owner: string,
  transactionHash: string
} | {
  type: EventType.DepositoryPolicy,
  asset: AssetId,
  owner: string,
  securityLevel: BigNumber,
  acceptsAccountRequests: boolean,
  acceptsWithdrawalRequests: boolean
} | {
  type: EventType.DepositoryParticipant,
  owner: string
} | {
  type: EventType.WitnessAccount,
  purpose: 'routing' | 'depository' | 'witness',
  addresses: string[]
} | {
  type: EventType.WitnessTransaction,
  transactionId: string
} | {
  type: EventType.RollupReceipt,
  executionIndex: BigNumber,
  relativeGasUse: BigNumber
} | {
  type: EventType.Unknown,
  event: BigNumber,
  args: any[]
}

export type SummaryState = {
  account: {
    balances: Record<string, Record<string, { asset: AssetId, supply: BigNumber, reserve: BigNumber }>>,
    fees: Record<string, Record<string, { asset: AssetId, fee: BigNumber }>>
  },
  depository: {
    balances: Record<string, Record<string, { asset: AssetId, supply: BigNumber }>>,
    accounts: Record<string, Record<string, { asset: AssetId, newAccounts: number}>>,
    queues: Record<string, Record<string, { asset: AssetId, transactionHash: string | null}>>,
    policies: Record<string, Record<string, { asset: AssetId, securityLevel: number, acceptsAccountRequests: boolean, acceptsWithdrawalRequests: boolean }>>,
    participants: Set<string>
  },
  witness: {
    accounts: Record<string, { asset: AssetId, purpose: 'routing' | 'depository' | 'witness', aliases: string[] }>
    transactions: Record<string, { asset: AssetId, transactionIds: string[] }>
  },
  receipts: Record<string, { executionIndex: number, relativeGasUse: BigNumber }>,
  errors: string[],
  events: EventData[]
};

export type TransactionInput = {
  asset: AssetId;
  nonce?: string | number | BigNumber;
  gasPrice?: string | number | BigNumber;
  gasLimit?: string | number | BigNumber;
  method: {
    type: Ledger.Transaction | Ledger.Commitment | Ledger.Unknown,
    args: { [key: string]: any }
  }
}

export type TransactionOutput = {
  hash: string,
  data: string,
  receipt: any;
  body: {
    signature: Hashsig,
    asset: AssetId,
    nonce: Uint256,
    gasPrice: BigNumber,
    gasLimit: Uint256
  } & { [key: string]: any }
}

export type ServerInfo = {
  online: Set<string>;
  offline: Set<string>;
  overrider: string | null;
  preload: boolean;
}

export enum WalletType {
  Mnemonic = 'mnemonic',
  SecretKey = 'secretkey',
  PublicKey = 'publickey',
  Address = 'address'
}

export enum NetworkType {
  Mainnet = 'mainnet',
  Testnet = 'testnet',
  Regtest = 'regtest'
}

export class InterfaceProps {
  streaming: boolean = true;
}

export class WalletKeychain {
  type: WalletType | null = null;
  secretKey: Seckey | null = null;
  publicKey: Pubkey | null = null;
  publicKeyHash: Pubkeyhash | null = null;
  address: string | null = null;

  isValid(): boolean {
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
  static fromMnemonic(mnemonic: string[]): WalletKeychain | null {
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
  static fromSecretKey(secretKey: string): WalletKeychain | null {
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
  static fromPublicKey(publicKey: string): WalletKeychain | null {
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
  static fromAddress(address: string): WalletKeychain | null {
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
  static calculateSummaryState(events?: { event: BigNumber, args: any[] }[]): SummaryState {
    const result: SummaryState = {
      account: {
        balances: { },
        fees: { }
      },
      depository: {
        balances: { },
        accounts: { },
        queues: { },
        policies: { },
        participants: new Set<string>()
      },
      witness: {
        accounts: { },
        transactions: { }
      },
      receipts: { },
      errors: [],
      events: []
    };
    if (!events || !Array.isArray(events))
      return result;

    const isNumber = (v: any) => BigNumber.isBigNumber(v) || new BigNumber(v).isFinite();
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
        case Types.AccountBalance: {
          if (event.args.length >= 4 && (isNumber(event.args[0]) || typeof event.args[0] == 'string') && typeof event.args[1] == 'string' && typeof event.args[2] == 'string' && isNumber(event.args[3])) {
            const [assetId, from, to, value] = event.args;
            const fromAddress = Signing.encodeAddress(new Pubkeyhash(from)) || from;
            const toAddress = Signing.encodeAddress(new Pubkeyhash(to)) || to;
            const asset = new AssetId(assetId);
            if (!asset.handle)
              break;

            if (!result.account.balances[fromAddress])
              result.account.balances[fromAddress] = { };
            if (!result.account.balances[fromAddress][asset.handle])
              result.account.balances[fromAddress][asset.handle] = { asset: asset, supply: new BigNumber(0), reserve: new BigNumber(0) };
            if (!result.account.balances[toAddress])
              result.account.balances[toAddress] = { };
            if (!result.account.balances[toAddress][asset.handle])
              result.account.balances[toAddress][asset.handle] = { asset: asset, supply: new BigNumber(0), reserve: new BigNumber(0) };

            const fromState = result.account.balances[fromAddress][asset.handle];
            fromState.supply = fromState.supply.minus(value);
            
            const toState = result.account.balances[toAddress][asset.handle];
            toState.supply = toState.supply.plus(value);
            result.events.push({ type: EventType.Transfer, asset: asset, from: fromAddress, to: toAddress, value: new BigNumber(value) });
          } else if (event.args.length >= 4 && (isNumber(event.args[0]) || typeof event.args[0] == 'string') && typeof event.args[1] == 'string' && isNumber(event.args[2]) && isNumber(event.args[3])) {
            const [assetId, owner, supply, reserve] = event.args;
            const ownerAddress = Signing.encodeAddress(new Pubkeyhash(owner)) || owner;
            const asset = new AssetId(assetId);
            if (!asset.handle)
              break;
            
            if (!result.account.balances[ownerAddress])
              result.account.balances[ownerAddress] = { };
            if (!result.account.balances[ownerAddress][asset.handle])
              result.account.balances[ownerAddress][asset.handle] = { asset: asset, supply: new BigNumber(0), reserve: new BigNumber(0) };

            const ownerState = result.account.balances[ownerAddress][asset.handle];
            ownerState.supply = ownerState.supply.plus(supply)
            ownerState.reserve = ownerState.reserve.plus(reserve);
            result.events.push({ type: EventType.TransferIsolated, asset: asset, owner: owner, supply: new BigNumber(supply), reserve: new BigNumber(reserve) });
          } else if (event.args.length >= 3 && (isNumber(event.args[0]) || typeof event.args[0] == 'string') && typeof event.args[1] == 'string' && isNumber(event.args[2])) {
            const [assetId, owner, fee] = event.args;
            const ownerAddress = Signing.encodeAddress(new Pubkeyhash(owner)) || owner;
            const asset = new AssetId(assetId);
            if (!asset.handle)
              break;
            
            if (!result.account.balances[ownerAddress])
              result.account.balances[ownerAddress] = { };
            if (!result.account.balances[ownerAddress][asset.handle])
              result.account.balances[ownerAddress][asset.handle] = { asset: asset, supply: new BigNumber(0), reserve: new BigNumber(0) };

            if (!result.account.fees[ownerAddress])
              result.account.fees[ownerAddress] = { };
            if (!result.account.fees[ownerAddress][asset.handle])
              result.account.fees[ownerAddress][asset.handle] = { asset: asset, fee: new BigNumber(0) };

            const balanceState = result.account.balances[ownerAddress][asset.handle];
            const feeState = result.account.fees[ownerAddress][asset.handle];
            balanceState.supply = balanceState.supply.plus(fee);
            feeState.fee = feeState.fee.plus(fee);
            result.events.push({ type: EventType.TransferFee, asset: asset, owner: owner, fee: new BigNumber(fee) });
          }
          break;
        }
        case Types.DepositoryBalance: {
          if (event.args.length >= 3 && (isNumber(event.args[0]) || typeof event.args[0] == 'string') && typeof event.args[1] == 'string' && isNumber(event.args[2])) {
            const [assetId, owner, value] = event.args;
            const asset = new AssetId(assetId);
            const ownerAddress = Signing.encodeAddress(new Pubkeyhash(owner)) || owner;
            if (!asset.handle)
              break;
            
            if (!result.depository.balances[ownerAddress])
              result.depository.balances[ownerAddress] = { };
            if (!result.depository.balances[ownerAddress][asset.handle])
              result.depository.balances[ownerAddress][asset.handle] = { asset: asset, supply: new BigNumber(0) };
            
            const state = result.depository.balances[ownerAddress][asset.handle];
            state.supply = state.supply.plus(value);
            result.events.push({ type: EventType.DepositoryTransfer, asset: asset, owner: owner, value: new BigNumber(value) });
          }
          break;
        }
        case Types.DepositoryPolicy: {
          if (event.args.length >= 3 && (isNumber(event.args[0]) || typeof event.args[0] == 'string') && typeof event.args[1] == 'string' && isNumber(event.args[2])) {
            const [assetId, owner, type] = event.args;
            const asset = new AssetId(assetId);
            const ownerAddress = Signing.encodeAddress(new Pubkeyhash(owner)) || owner;
            if (!asset.handle)
              break;
            
            switch (type.toNumber()) {
              case 0: {
                if (event.args.length >= 4 && isNumber(event.args[3])) {
                  const newAccounts = event.args[3];
                  if (!result.depository.accounts[ownerAddress])
                    result.depository.accounts[ownerAddress] = { };
                  if (!result.depository.accounts[ownerAddress][asset.handle])
                    result.depository.accounts[ownerAddress][asset.handle] = { asset: asset, newAccounts: 0 };
                  result.depository.accounts[ownerAddress][asset.handle].newAccounts += newAccounts.toNumber();
                  result.events.push({ type: EventType.DepositoryAccount, asset: asset, owner: ownerAddress, accounts: newAccounts });
                }
                break;
              }
              case 1: {
                if (event.args.length >= 4 && (isNumber(event.args[3]) || typeof event.args[3] == 'string')) {
                  const transactionHash = event.args[3];
                  if (!result.depository.queues[ownerAddress])
                    result.depository.queues[ownerAddress] = { };
                  result.depository.queues[ownerAddress][asset.handle] = { asset: asset, transactionHash: isNumber(transactionHash) ? null : transactionHash };
                  result.events.push({ type: EventType.DepositoryQueue, asset: asset, owner: ownerAddress, transactionHash: transactionHash });
                }
                break;
              }
              case 2: {
                if (event.args.length >= 6 && isNumber(event.args[3]) && typeof event.args[4] == 'boolean' && typeof event.args[5] == 'boolean') {
                  const [securityLevel, acceptsAccountRequests, acceptsWithdrawalRequests] = event.args.slice(3, 6);
                  if (!result.depository.policies[ownerAddress])
                    result.depository.policies[ownerAddress] = { };
                  result.depository.policies[ownerAddress][asset.handle] = { asset: asset, securityLevel: securityLevel, acceptsAccountRequests: acceptsAccountRequests, acceptsWithdrawalRequests: acceptsWithdrawalRequests };
                  result.events.push({ type: EventType.DepositoryPolicy, asset: asset, owner: ownerAddress, securityLevel: securityLevel, acceptsAccountRequests: acceptsAccountRequests, acceptsWithdrawalRequests: acceptsWithdrawalRequests });
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
          if (event.args.length >= 3 && (isNumber(event.args[0]) || typeof event.args[0] == 'string') && isNumber(event.args[1])) {
            const [assetId, addressPurpose, addressAliases] = [event.args[0], event.args[1], event.args.slice(2)];
            const asset = new AssetId(assetId);
            if (!asset.handle)
              break;
            
            let purpose: any;
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
            result.events.push({ type: EventType.WitnessAccount, purpose: purpose, addresses: addressState.aliases });
          }
          break;
        }
        case Types.WitnessTransaction: {
          if (event.args.length == 2 && (isNumber(event.args[0]) || typeof event.args[0] == 'string') && typeof event.args[1] == 'string') {
            const [assetId, transactionId] = event.args;
            const asset = new AssetId(assetId);
            if (!asset.handle)
              break;
            
            if (result.witness.transactions[asset.handle] != null)
              result.witness.transactions[asset.handle].transactionIds.push(transactionId);
            else
              result.witness.transactions[asset.handle] = { asset: asset, transactionIds: [transactionId] };
            result.events.push({ type: EventType.WitnessTransaction, transactionId: transactionId });
          }
          break;
        }
        case Types.Rollup: {
          if (event.args.length == 3 && (isNumber(event.args[0]) || typeof event.args[0] == 'string') && (isNumber(event.args[1]) || typeof event.args[1] == 'string') && (isNumber(event.args[2]) || typeof event.args[2] == 'string')) {
            const [transactionHash, index, relativeGasUse] = event.args;
            result.receipts[new Uint256(transactionHash.toString()).toHex()] = {
              executionIndex: new BigNumber(index).toNumber(),
              relativeGasUse: new BigNumber(relativeGasUse.toString()),
            };
            result.events.push({ type: EventType.RollupReceipt, executionIndex: new BigNumber(index), relativeGasUse: new BigNumber(relativeGasUse.toString()) });
          }
          break;
        }
        case Types.DepositoryAccount: 
        case Types.DepositoryMigration: {
          if (event.args.length == 1 && typeof event.args[0] == 'string') {
            const [owner] = event.args;
            const ownerAddress = Signing.encodeAddress(new Pubkeyhash(owner)) || owner;
            result.depository.participants.add(ownerAddress);
            result.events.push({ type: EventType.DepositoryParticipant, owner: ownerAddress });
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
  static calculateAssetRecords(data: any[]): Record<string, any[]> {
    const result: Record<string, any[]> = { };
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const assetId = item.asset != null && (BigNumber.isBigNumber(item.asset.id) || typeof item.asset.id == 'string') ? item.asset.id : null;
      const assetHandle = assetId != null ? new AssetId(assetId).handle || '' : '';
      if (!result[assetHandle])
        result[assetHandle] = [item];
      else
        result[assetHandle].push(item);
    }
    return result;
  }
  static isSummaryStateEmpty(state: SummaryState, address?: string): boolean {
    if (address != null) {
      return !state.account.balances[address] &&
        !state.depository.balances[address] &&
        !Object.keys(state.depository.queues).length &&
        !Object.keys(state.depository.accounts).length &&
        !Object.keys(state.depository.policies).length &&
        !state.depository.participants.size &&
        !Object.keys(state.witness.accounts).length &&
        !Object.keys(state.witness.transactions).length &&
        !Object.keys(state.receipts).length &&
        !state.errors.length;
    } else {
      return !Object.keys(state.account.balances).length &&
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
  static resolver: string | null = null;
  static httpInterfaces: ServerInfo = {
    online: new Set<string>(),
    offline: new Set<string>(),
    overrider: null,
    preload: false
  };
  static wsInterfaces: ServerInfo = {
    online: new Set<string>(),
    offline: new Set<string>(),
    overrider: null,
    preload: false
  };
  static requests = {
    pending: new Map<string, { method: string, resolve: PromiseCallback } >(),
    count: 0
  };
  static props = {
    data: new InterfaceProps(),
    preload: false
  };
  static socket: WebSocket | null = null;
  static forcePolicy: null | 'cache' | 'no-cache' = null;
  static onNodeMessage: NodeMessage | null = null;
  static onNodeRequest: NodeRequest | null = null;
  static onNodeResponse: NodeResponse | null = null;
  static onNodeError: NodeError | null = null;
  static onCacheStore: CacheStore | null = null;
  static onCacheLoad: CacheLoad | null = null;
  static onCacheKeys: CacheKeys | null = null;
  static onIpsetLoad: IpsetLoad | null = null;
  static onIpsetStore: IpsetStore | null = null;
  static onPropsLoad: PropsLoad | null = null;
  static onPropsStore: PropsStore | null = null;

  private static fetchObject(data: any): any {
    if (typeof data == 'string') {
      try {
        if (!data.startsWith('0x')) {
          const numeric = new BigNumber(data, 10).dp(18);
          if (data.startsWith(numeric.toString()))
            return numeric;
        }
      } catch { }
    }
    else if (typeof data == 'number') {
      return new BigNumber(data);
    }
    else if (typeof data == 'object') {
      for (let key in data) {
        data[key] = this.fetchObject(data[key]);
      }
    } else if (Array.isArray(data)) {
      for (let i = 0; i < data.length; i++) {
        data[i] = this.fetchObject(data[i]);
      }
    }
    return data;
  }
  private static fetchData(data: any): any {
    if (!data.error)
      return this.fetchObject(data.result)

    const message = data.error.message ? data.error.message : '';
    const code = data.error.code ? data.error.code.toString() : '0';
    const hash = ByteUtil.uint8ArrayToHexString(Hashing.hash160(ByteUtil.byteStringToUint8Array(message + ' / ' + code)));
    return new Error(`${message} — E${hash.substring(0, 8).toUpperCase()}`);
  }
  private static fetchResult(hash: string, data: any): any[] | undefined {    
    if (Array.isArray(data) || data.result === undefined) {
      return undefined;
    } else if (this.onCacheStore != null && hash != null && data.error == null)
      this.onCacheStore(hash, data.result);
    return this.fetchData(data);   
  }
  private static fetchNode(type: 'ws' | 'http'): [string, string] | null {
    try {
      const nodes = Array.from(type == 'ws' ? this.wsInterfaces.online.keys() : this.httpInterfaces.online.keys());
      const node = nodes[Math.floor(Math.random() * nodes.length)];
      const location = new URL('tcp://' + node);
      const secure = (location.port == '443');
      return [`${type}${secure ? 's' : ''}://${node}/`, node];
    } catch {
      return null;
    }
  }
  private static fetchResolver(type: 'ws' | 'http'): [string, string] | null {
    try {
      if (!this.resolver)
        return null;
      
      const location = new URL('tcp://' + this.resolver);
      const secure = (location.port == '443');
      return [`${secure ? 'https' : 'http'}://${this.resolver}/?rpc=1&rpc_public_access=1${type == 'ws' ? '&rpc_web_sockets=1' : ''}`, this.resolver];
    } catch {
      return null;
    }
  }
  private static async fetchIpset(type: 'ws' | 'http', mode: 'preload' | 'fetch'): Promise<number> {
    const interfaces = type == 'ws' ? this.wsInterfaces : this.httpInterfaces;
    if (interfaces.overrider != null) {
      try {
        const scheme = new URL('tcp://' + interfaces.overrider);
        const address = scheme.hostname + (scheme.port.length > 0 ? ':' + scheme.port : '');
        const retry = interfaces.offline.has(address);
        interfaces.offline.delete(address);
        interfaces.online.add(address);
        return retry ? 0 : 1;
      } catch {
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
          } catch { }
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
              } catch { }
            }
    
            if (results > 0)
              return results;
          } catch (exception) {
            if (this.onNodeResponse)
              this.onNodeResponse(location[0], 'discover', exception, (exception as Error).message.length);
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
  static async fetch<T>(policy: 'cache' | 'no-cache', method: string, args?: any[]): Promise<T | null> {
    if (this.forcePolicy != null) {
      policy = this.forcePolicy;
      this.forcePolicy = null;
    }

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

        const data: [any, number] = await new Promise((resolve, reject) => {
          const context = { method: method, resolve: (_: any) => { } };
          const timeout = setTimeout(() => context.resolve(new Error('connection timed out')), WEBSOCKET_TIMEOUT);
          context.resolve = (data: [any, number] | Error) => {
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
      } catch (exception) {
        if (this.onNodeError)
          this.onNodeError(this.socket?.url || '[unknown]', method, exception);
      }
        
      if (result !== undefined) {
        if (result instanceof Error)
          throw result;
        return result as T;
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
        } catch (exception) {
          if (this.onNodeError)
            this.onNodeError(location[0], method, exception);
        }
        
        if (result !== undefined) {
          if (result instanceof Error)
            throw result;
          return result as T;
        }

        this.httpInterfaces.online.delete(location[1]);
        this.httpInterfaces.offline.add(location[1]);
      } else {
        const found = await this.fetchIpset('http', 'fetch');
        if (!found) {
          break;
        }
      }
    }

    if (this.httpInterfaces.offline.size >= this.httpInterfaces.online.size) {
      const found = await this.fetchIpset('http', 'fetch');
      if (!found) {
        this.httpInterfaces.online = new Set<string>([...this.httpInterfaces.online, ...this.httpInterfaces.offline]);
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
  static async fetchAll<T>(callback: FetchAllCallback<T>): Promise<T[] | null> {
    const count = 48;
    let result: T[] = [];
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
      } catch (exception) {
        if (result.length > 0)
          break;
        
        throw exception;
      }
    }
    return result;
  }
  static async connectSocket(addresses: string[]): Promise<number | null> {
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
  
          const connection = await new Promise<WebSocket>((resolve, reject) => {
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
              const data: any = JSON.parse(message);
              if (data != null && typeof data.id != 'undefined') {
                if (typeof data.notification == 'object') {
                  const notification = data.notification;
                  if (notification != null && typeof notification.type == 'string' && typeof notification.result != 'undefined') {
                    if (this.onNodeMessage)
                      this.onNodeMessage(notification);
                    if (this.onNodeResponse)
                      this.onNodeResponse(this.socket.url, 'notification', data, message.length);
                  }
                } else if (typeof data.result != 'undefined' && data.id != null) {
                  const response = this.requests.pending.get(data.id.toString());
                  if (response != null)
                    response.resolve([data, message.length]);
                }
              }
            } catch { }
          };
          this.socket.onclose = () => {
            this.disconnectSocket();
            this.connectSocket(addresses);
          };
          const events = await this.fetch<number>('no-cache', 'subscribe', [addresses.join(',')]);
          return events;
        } catch (exception) {
          if (this.onNodeError)
            this.onNodeError(location[0], method, exception);
        }

        this.wsInterfaces.online.delete(location[1]);
        this.wsInterfaces.offline.add(location[1]);
      } else {
        const found = await this.fetchIpset('ws', 'fetch');
        if (!found) {
          break;
        }
      }
    }

    if (this.wsInterfaces.offline.size >= this.wsInterfaces.online.size) {
      const found = await this.fetchIpset('ws', 'fetch');
      if (!found) {
        this.wsInterfaces.online = new Set<string>([...this.wsInterfaces.online, ...this.wsInterfaces.offline]);
        this.wsInterfaces.offline.clear();
      }
    }

    return null;
  }
  static async disconnectSocket(): Promise<boolean> {
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
  static applyResolver(resolver: string | null): void {
    this.resolver = resolver;
  }
  static applyServer(server: string | null): void {
    this.httpInterfaces.overrider = server;
    this.wsInterfaces.overrider = server;
  }
  static applyImplementation(implementation: {
    onNodeMessage?: NodeMessage,
    onNodeRequest?: NodeRequest,
    onNodeResponse?: NodeResponse,
    onNodeError?: NodeError,
    onCacheStore?: CacheStore,
    onCacheLoad?: CacheLoad,
    onCacheKeys?: CacheKeys,
    onIpsetLoad?: IpsetLoad,
    onIpsetStore?: IpsetStore,
    onPropsLoad?: PropsLoad,
    onPropsStore?: PropsStore
  }): void {
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
  static saveProps(props: InterfaceProps): void {
    if (this.onPropsStore != null)
      this.onPropsStore(props);
    this.props.data = props;
    this.props.preload = true;
  }
  static getProps(): InterfaceProps {
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
  static clearCache(): void {
    if (this.onCacheKeys != null && this.onCacheStore != null) {
      const keys = this.onCacheKeys();
      for (let key in keys) {
        this.onCacheStore(keys[key]);
      }
    }
  }
  static forcedPolicy<T>(policy: 'cache' | 'no-cache', callback: () => Promise<T>): Promise<T> {
    this.forcePolicy = policy;
    return callback();
  }
  static decodeTransaction(hexMessage: string): Promise<any> {
    return this.fetch('cache', 'decodetransaction', [hexMessage]);
  }
  static simulateTransaction(hexMessage: string): Promise<any | null> {
    return this.fetch('no-cache', 'simulatetransaction', [hexMessage]);
  }
  static submitTransaction(hexMessage: string, validate: boolean): Promise<string | null> {
    return this.fetch('no-cache', 'submittransaction', [hexMessage, validate]);
  }
  static callTransaction(asset: AssetId, fromAddress: string, toAddress: string, value: BigNumber, method: string, args: any[]): Promise<any | null> {
    return this.fetch('no-cache', 'call', [asset.handle, fromAddress, toAddress, value, method, ...args]);
  }
  static getWallet(): Promise<{ secretKey: string, publicKey: string, publicKeyHash: string, address: string } | null> {
    return this.fetch('no-cache', 'getwallet');
  }
  static getParticipations(): Promise<any[] | null> {
    return this.fetch('no-cache', 'getparticipations');
  }
  static getBlockchains(): Promise<any[] | null> {
    return this.fetch('cache', 'getblockchains', []);
  }
  static getBestDepositoryRewardsForSelection(asset: AssetId, offset: number, count: number): Promise<any[] | null> {
    return this.fetch('no-cache', 'getbestdepositoryrewardsforselection', [asset.handle, offset, count]);
  }
  static getBestDepositoryBalancesForSelection(asset: AssetId, offset: number, count: number): Promise<any[] | null> {
    return this.fetch('no-cache', 'getbestdepositorybalancesforselection', [asset.handle, offset, count]);
  }
  static getBestDepositoryPoliciesForSelection(asset: AssetId, offset: number, count: number): Promise<any[] | null> {
    return this.fetch('no-cache', 'getbestdepositorypoliciesforselection', [asset.handle, offset, count]);
  }
  static getNextAccountNonce(address: string): Promise<{ min: BigNumber | string, max: BigNumber | string } | null> {
    return this.fetch('no-cache', 'getnextaccountnonce', [address]);
  }
  static getAccountBalance(address: string, asset: AssetId): Promise<{ supply: BigNumber, reserve: BigNumber, balance: BigNumber } | null> {
    return this.fetch('no-cache', 'getaccountbalance', [address, asset.handle]);
  }
  static getAccountBalances(address: string, offset: number, count: number): Promise<any[] | null> {
    return this.fetch('no-cache', 'getaccountbalances', [address, offset, count]);
  }
  static getAccountDelegation(address: string): Promise<any | null> {
    return this.fetch('no-cache', 'getaccountdelegation', [address]);
  }
  static getValidatorProduction(address: string): Promise<any | null> {
    return this.fetch('no-cache', 'getvalidatorproduction', [address]);
  }
  static getValidatorParticipations(address: string, offset: number, count: number): Promise<any[] | null> {
    return this.fetch('no-cache', 'getvalidatorparticipations', [address, offset, count]);
  }
  static getValidatorAttestations(address: string, offset: number, count: number): Promise<any[] | null> {
    return this.fetch('no-cache', 'getvalidatorattestations', [address, offset, count]);
  }
  static getDepositoryBalances(address: string, offset: number, count: number): Promise<any[] | null> {
    return this.fetch('no-cache', 'getdepositorybalances', [address, offset, count]);
  }
  static getWitnessAccount(address: string, asset: AssetId, walletAddress: string): Promise<any | null> {
    return this.fetch('no-cache', 'getwitnessaccount', [address, asset.handle, walletAddress]);
  }
  static getWitnessAccounts(address: string, offset: number, count: number): Promise<any[] | null> {
    return this.fetch('no-cache', 'getwitnessaccounts', [address, offset, count]);
  }
  static getWitnessAccountsByPurpose(address: string, purpose: 'witness' | 'routing' | 'depository', offset: number, count: number): Promise<any[] | null> {
    return this.fetch('no-cache', 'getwitnessaccountsbypurpose', [address, purpose, offset, count]);
  }
  static getMempoolTransactionsByOwner(address: string, offset: number, count: number, direction?: number, unrolling?: number): Promise<any[] | null> {
    const args = [address, offset, count];
    if (direction != null)
      args.push(direction);
    if (unrolling != null)
      args.push(unrolling);
    return this.fetch('no-cache', 'getmempooltransactionsbyowner', args);
  }
  static getBlockTransactionsByHash(hash: string, unrolling?: number): Promise<any[] | null> {
    return this.fetch('cache', 'getblocktransactionsbyhash', unrolling != null ? [hash, unrolling] : [hash]);
  }
  static getBlockTransactionsByNumber(number: number, unrolling?: number): Promise<any[] | null> {
    return this.fetch('cache', 'getblocktransactionsbynumber', unrolling != null ? [number, unrolling] : [number]);
  }
  static getTransactionsByOwner(address: string, offset: number, count: number, direction?: number, unrolling?: number): Promise<any[] | null> {
    const args = [address, offset, count];
    if (direction != null)
      args.push(direction);
    if (unrolling != null)
      args.push(unrolling);
    return this.fetch('no-cache', 'gettransactionsbyowner', args);
  }
  static getTransactionByHash(hash: string, unrolling?: number): Promise<any | null> {
    return this.fetch('cache', 'gettransactionbyhash', unrolling != null ? [hash, unrolling] : [hash]);
  }
  static getMempoolTransactionByHash(hash: string): Promise<any | null> {
    return this.fetch('cache', 'getmempooltransactionbyhash', [hash]);
  }
  static getBlockByNumber(number: number, unrolling?: number): Promise<any | null> {
    return this.fetch('cache', 'getblockbynumber', unrolling != null ? [number, unrolling] : [number]);
  }
  static getBlockByHash(hash: string, unrolling?: number): Promise<any | null> {
    return this.fetch('cache', 'getblockbyhash', unrolling != null ? [hash, unrolling] : [hash]);
  }
  static getBlockTipNumber(): Promise<BigNumber | string | null> {
    return this.fetch('no-cache', 'getblocktipnumber', []);
  }
  static getGasPrice(asset: AssetId, percentile?: number): Promise<any | null> {
    return this.fetch('no-cache', 'getgasprice', percentile != null ? [asset.handle, percentile] : [asset.handle]);
  }
}

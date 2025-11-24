import BigNumber from "bignumber.js";
import { AssetId, Pubkey, Pubkeyhash, Seckey, Hashsig, Uint256 } from "./algorithm";
import { Ledger } from "./schema";
export type FetchAllCallback<T> = (offset: number, count: number) => Promise<T[] | null>;
export type NodeError = (address: string, method: string, error: unknown) => void;
export type NodeRequest = (address: string, method: string, message: any, size: number) => void;
export type NodeResponse = (address: string, method: string, message: any, size: number) => void;
export type NodeMessage = (event: {
    type: string;
    result: any;
}) => void;
export type CacheStore = (path: string, value?: any) => boolean;
export type CacheLoad = (path: string) => any | null;
export type CacheKeys = () => string[];
export type IpsetLoad = (type: 'http' | 'ws') => {
    online: string[];
    offline: string[];
} | null;
export type IpsetStore = (type: 'http' | 'ws', ipset: {
    online: string[];
    offline: string[];
}) => boolean;
export type PropsLoad = () => InterfaceProps | null;
export type PropsStore = (props: InterfaceProps) => boolean;
export type PromiseCallback = (data: any) => void;
export type ClearCallback = () => any;
export declare enum EventType {
    Error = 0,
    Transfer = 1,
    TransferIsolated = 2,
    TransferFee = 3,
    BridgeTransfer = 4,
    BridgeAccount = 5,
    BridgeQueue = 6,
    BridgePolicy = 7,
    BridgeParticipant = 8,
    WitnessAccount = 9,
    WitnessTransaction = 10,
    RollupReceipt = 11,
    Unknown = 12
}
export type EventData = {
    type: EventType.Error;
    message: string;
} | {
    type: EventType.Transfer;
    asset: AssetId;
    from: string;
    to: string;
    value: BigNumber;
} | {
    type: EventType.TransferIsolated;
    asset: AssetId;
    owner: string;
    supply: BigNumber;
    reserve: BigNumber;
} | {
    type: EventType.TransferFee;
    asset: AssetId;
    owner: string;
    fee: BigNumber;
} | {
    type: EventType.BridgeTransfer;
    asset: AssetId;
    owner: string;
    value: BigNumber;
} | {
    type: EventType.BridgeAccount;
    asset: AssetId;
    owner: string;
    accounts: BigNumber;
} | {
    type: EventType.BridgeQueue;
    asset: AssetId;
    owner: string;
    transactionHash: string;
} | {
    type: EventType.BridgePolicy;
    asset: AssetId;
    owner: string;
} | {
    type: EventType.BridgeParticipant;
    owner: string;
} | {
    type: EventType.WitnessAccount;
    asset: AssetId;
    purpose: 'routing' | 'bridge' | 'witness';
    addresses: string[];
} | {
    type: EventType.WitnessTransaction;
    asset: AssetId;
    stateHash: string;
} | {
    type: EventType.RollupReceipt;
    transactionHash: string;
    executionIndex: BigNumber;
    relativeGasUse: BigNumber;
} | {
    type: EventType.Unknown;
    event: BigNumber;
    args: any[];
};
export type SummaryState = {
    account: {
        balances: Record<string, Record<string, {
            asset: AssetId;
            supply: BigNumber;
            reserve: BigNumber;
        }>>;
        fees: Record<string, Record<string, {
            asset: AssetId;
            fee: BigNumber;
        }>>;
    };
    bridge: {
        balances: Record<string, Record<string, {
            asset: AssetId;
            supply: BigNumber;
        }>>;
        accounts: Record<string, Record<string, {
            asset: AssetId;
            newAccounts: number;
        }>>;
        queues: Record<string, Record<string, {
            asset: AssetId;
            transactionHash: string | null;
        }>>;
        policies: Record<string, Record<string, {
            asset: AssetId;
        }>>;
        participants: Set<string>;
    };
    witness: {
        accounts: Record<string, {
            asset: AssetId;
            purpose: 'routing' | 'bridge' | 'witness';
            aliases: string[];
        }>;
        transactions: Record<string, {
            asset: AssetId;
            stateHashes: string[];
        }>;
    };
    receipts: Record<string, {
        executionIndex: number;
        relativeGasUse: BigNumber;
    }>;
    errors: string[];
    events: EventData[];
};
export type TransactionInput = {
    asset: AssetId;
    nonce?: string | number | BigNumber;
    gasPrice?: string | number | BigNumber;
    gasLimit?: string | number | BigNumber;
    method: {
        type: Ledger.Transaction | Ledger.Commitment | Ledger.Unknown;
        args: {
            [key: string]: any;
        };
    };
};
export type TransactionOutput = {
    hash: string;
    data: string;
    receipt: any;
    body: {
        signature: Hashsig;
        asset: AssetId;
        nonce: Uint256;
        gasPrice: BigNumber;
        gasLimit: Uint256;
    } & {
        [key: string]: any;
    };
};
export type ServerInfo = {
    online: Set<string>;
    offline: Set<string>;
    overrider: string | null;
    preload: boolean;
};
export declare enum WalletType {
    Mnemonic = "mnemonic",
    SecretKey = "secretkey",
    PublicKey = "publickey",
    Address = "address"
}
export declare enum NetworkType {
    Mainnet = "mainnet",
    Testnet = "testnet",
    Regtest = "regtest"
}
export declare class InterfaceProps {
    streaming: boolean;
}
export declare class WalletKeychain {
    type: WalletType | null;
    secretKey: Seckey | null;
    publicKey: Pubkey | null;
    publicKeyHash: Pubkeyhash | null;
    address: string | null;
    isValid(): boolean;
    static fromMnemonic(mnemonic: string[]): WalletKeychain | null;
    static fromSecretKey(secretKey: string): WalletKeychain | null;
    static fromPublicKey(publicKey: string): WalletKeychain | null;
    static fromAddress(address: string): WalletKeychain | null;
}
export declare class EventResolver {
    static calculateSummaryState(events?: {
        event: BigNumber;
        args: any[];
    }[]): SummaryState;
    static calculateAssetRecords(data: any[]): Record<string, any[]>;
    static isSummaryStateEmpty(state: SummaryState, address?: string): boolean;
}
export declare class RPC {
    static resolver: string | null;
    static httpInterfaces: ServerInfo;
    static wsInterfaces: ServerInfo;
    static requests: {
        pending: Map<string, {
            method: string;
            resolve: PromiseCallback;
        }>;
        count: number;
    };
    static props: {
        data: InterfaceProps;
        preload: boolean;
    };
    static socket: WebSocket | null;
    static forcePolicy: null | 'cache' | 'no-cache';
    static onNodeMessage: NodeMessage | null;
    static onNodeRequest: NodeRequest | null;
    static onNodeResponse: NodeResponse | null;
    static onNodeError: NodeError | null;
    static onCacheStore: CacheStore | null;
    static onCacheLoad: CacheLoad | null;
    static onCacheKeys: CacheKeys | null;
    static onIpsetLoad: IpsetLoad | null;
    static onIpsetStore: IpsetStore | null;
    static onPropsLoad: PropsLoad | null;
    static onPropsStore: PropsStore | null;
    private static reportAvailability;
    private static fetchObject;
    private static fetchData;
    private static fetchResult;
    private static fetchNode;
    private static fetchResolver;
    private static fetchIpset;
    static fetch<T>(policy: 'cache' | 'no-cache', method: string, args?: any[]): Promise<T | null>;
    static fetchAll<T>(callback: FetchAllCallback<T>): Promise<T[] | null>;
    static connectSocket(addresses: string[]): Promise<number | null>;
    static disconnectSocket(): Promise<boolean>;
    static applyResolver(resolver: string | null): void;
    static applyServer(server: string | null): void;
    static applyImplementation(implementation: {
        onNodeMessage?: NodeMessage;
        onNodeRequest?: NodeRequest;
        onNodeResponse?: NodeResponse;
        onNodeError?: NodeError;
        onCacheStore?: CacheStore;
        onCacheLoad?: CacheLoad;
        onCacheKeys?: CacheKeys;
        onIpsetLoad?: IpsetLoad;
        onIpsetStore?: IpsetStore;
        onPropsLoad?: PropsLoad;
        onPropsStore?: PropsStore;
    }): void;
    static saveProps(props: InterfaceProps): void;
    static getProps(): InterfaceProps;
    static requiresSecureTransport(address: string): boolean;
    static clearCache(): void;
    static forcedPolicy<T>(policy: 'cache' | 'no-cache', callback: () => Promise<T>): Promise<T>;
    static decodeTransaction(hexMessage: string): Promise<any>;
    static simulateTransaction(hexMessage: string): Promise<any | null>;
    static submitTransaction(hexMessage: string, validate: boolean): Promise<string | null>;
    static callTransaction(asset: AssetId, fromAddress: string, toAddress: string, value: BigNumber, method: string, args: any[]): Promise<any | null>;
    static getWallet(): Promise<{
        secretKey: string;
        publicKey: string;
        publicKeyHash: string;
        address: string;
    } | null>;
    static getParticipations(): Promise<any[] | null>;
    static getBlockchains(): Promise<any[] | null>;
    static getBestValidatorAttestationsForSelection(asset: AssetId, offset: number, count: number): Promise<any[] | null>;
    static getBestBridgeBalancesForSelection(asset: AssetId, offset: number, count: number): Promise<any[] | null>;
    static getNextAccountNonce(address: string): Promise<{
        min: BigNumber | string;
        max: BigNumber | string;
    } | null>;
    static getAccountBalance(address: string, asset: AssetId): Promise<{
        supply: BigNumber;
        reserve: BigNumber;
        balance: BigNumber;
    } | null>;
    static getAccountBalances(address: string, offset: number, count: number): Promise<any[] | null>;
    static getAccountDelegation(address: string): Promise<any | null>;
    static getValidatorProduction(address: string): Promise<any | null>;
    static getValidatorParticipation(address: string): Promise<any | null>;
    static getValidatorAttestations(address: string, offset: number, count: number): Promise<any[] | null>;
    static getBridgeBalances(address: string, offset: number, count: number): Promise<any[] | null>;
    static getWitnessAccount(address: string, asset: AssetId, walletAddress: string): Promise<any | null>;
    static getWitnessAccounts(address: string, offset: number, count: number): Promise<any[] | null>;
    static getWitnessAccountsByPurpose(address: string, purpose: 'witness' | 'routing' | 'bridge', offset: number, count: number): Promise<any[] | null>;
    static getMempoolTransactionsByOwner(address: string, offset: number, count: number, direction?: number, unrolling?: number): Promise<any[] | null>;
    static getBlockTransactionsByHash(hash: string, unrolling?: number): Promise<any[] | null>;
    static getBlockTransactionsByNumber(number: number, unrolling?: number): Promise<any[] | null>;
    static getTransactionsByOwner(address: string, offset: number, count: number, direction?: number, unrolling?: number): Promise<any[] | null>;
    static getTransactionByHash(hash: string, unrolling?: number): Promise<any | null>;
    static getMempoolTransactionByHash(hash: string): Promise<any | null>;
    static getAssetHolders(asset: AssetId, filter: BigNumber | string | number): Promise<number | null>;
    static getBlockByNumber(number: number, unrolling?: number): Promise<any | null>;
    static getBlockByHash(hash: string, unrolling?: number): Promise<any | null>;
    static getBlockTipNumber(): Promise<BigNumber | string | null>;
    static getGasPrice(asset: AssetId, percentile?: number): Promise<any | null>;
}

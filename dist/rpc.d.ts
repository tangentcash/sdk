import BigNumber from "bignumber.js";
import { AssetId, Pubkey, Pubkeyhash, Seckey, Recsighash, Uint256 } from "./algorithm";
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
export type IpsetLoad = (type: 'http' | 'ws') => string[] | null;
export type IpsetStore = (type: 'http' | 'ws', ipset: string[]) => boolean;
export type PropsLoad = () => InterfaceProps | null;
export type PropsStore = (props: InterfaceProps) => boolean;
export type PromiseCallback = (data: any) => void;
export type ClearCallback = () => any;
export type SummaryState = {
    account: {
        programs: Set<string>;
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
    depository: {
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
            securityLevel: number;
            acceptsAccountRequests: boolean;
            acceptsWithdrawalRequests: boolean;
        }>>;
        participants: Set<string>;
    };
    witness: {
        accounts: Record<string, {
            asset: AssetId;
            purpose: string;
            aliases: string[];
        }>;
        transactions: Record<string, {
            asset: AssetId;
            transactionIds: string[];
        }>;
    };
    receipts: Record<string, {
        relativeGasUse: BigNumber;
        relativeGasPaid: BigNumber;
    }>;
    errors: string[];
};
export type TransactionInput = {
    asset: AssetId;
    conservative?: boolean;
    nonce?: string | number | BigNumber;
    gasPrice?: string | number | BigNumber;
    gasLimit?: string | number | BigNumber;
    method: {
        type: Ledger.Transaction | Ledger.DelegationTransaction | Ledger.DelegationTransaction | Ledger.UnknownTransaction;
        args: {
            [key: string]: any;
        };
    };
};
export type TransactionOutput = {
    hash: string;
    data: string;
    body: {
        signature: Recsighash;
        asset: AssetId;
        nonce: Uint256;
        conservative: boolean;
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
    static clearCache(): void;
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
    static getBestDepositoryRewardsForSelection(asset: AssetId, offset: number, count: number): Promise<any[] | null>;
    static getBestDepositoryBalancesForSelection(asset: AssetId, offset: number, count: number): Promise<any[] | null>;
    static getBestDepositoryPoliciesForSelection(asset: AssetId, offset: number, count: number): Promise<any[] | null>;
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
    static getValidatorParticipations(address: string, offset: number, count: number): Promise<any[] | null>;
    static getValidatorAttestations(address: string, offset: number, count: number): Promise<any[] | null>;
    static getDepositoryBalances(address: string, offset: number, count: number): Promise<any[] | null>;
    static getWitnessAccount(address: string, asset: AssetId, walletAddress: string): Promise<any | null>;
    static getWitnessAccounts(address: string, offset: number, count: number): Promise<any[] | null>;
    static getWitnessAccountsByPurpose(address: string, purpose: 'witness' | 'routing' | 'depository', offset: number, count: number): Promise<any[] | null>;
    static getMempoolTransactionsByOwner(address: string, offset: number, count: number, direction?: number, unrolling?: number): Promise<any[] | null>;
    static getBlockTransactionsByHash(hash: string, unrolling?: number): Promise<any[] | null>;
    static getBlockTransactionsByNumber(number: number, unrolling?: number): Promise<any[] | null>;
    static getTransactionsByOwner(address: string, offset: number, count: number, direction?: number, unrolling?: number): Promise<any[] | null>;
    static getTransactionByHash(hash: string, unrolling?: number): Promise<any | null>;
    static getMempoolTransactionByHash(hash: string): Promise<any | null>;
    static getMempoolCumulativeConsensus(hash: string): Promise<{
        branch: string;
        threshold: BigNumber;
        progress: BigNumber;
        committee: BigNumber;
        reached: boolean;
    } | null>;
    static getBlockByNumber(number: number, unrolling?: number): Promise<any | null>;
    static getBlockByHash(hash: string, unrolling?: number): Promise<any | null>;
    static getBlockTipNumber(): Promise<BigNumber | string | null>;
    static getGasPrice(asset: AssetId, percentile?: number): Promise<any | null>;
    static getOptimalTransactionGas(hexMessage: string): Promise<BigNumber | string | null>;
    static getEstimateTransactionGas(hexMessage: string): Promise<BigNumber | string | null>;
}

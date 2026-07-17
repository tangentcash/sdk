export declare class Types {
    static AccountBalance: number;
    static BridgeInstance: number;
    static BridgeQueue: number;
    static BridgeBalance: number;
    static WitnessAccount: number;
    static WitnessTransaction: number;
    static Rollup: number;
    static Setup: number;
    static Route: number;
    static Withdraw: number;
}
export declare namespace Spot {
    namespace DEX {
        namespace Events {
            const Config: number;
            const Order: number;
            const Pool: number;
            const Swap: number;
            const AssetTier: number;
        }
        const construct = "void construct(pmut@)";
        const reconstruct = "void reconstruct(pmut@, const config&in)";
        const unifyAsset = "void unify_asset(pmut@, const uint256&in, const string&in)";
        const repayAsset = "void repay_asset(pmut@, const uint256&in)";
        const marketOrder = "uint256 market_order(pmut@, const uint256&in, const uint256&in, order_side, order_policy, const real320&in)";
        const limitOrder = "uint256 limit_order(pmut@, const uint256&in, const uint256&in, order_side, order_policy, const real320&in)";
        const stopOrder = "uint256 stop_order(pmut@, const uint256&in, const uint256&in, order_side, order_policy, const real320&in, const real320&in)";
        const stopLimitOrder = "uint256 stop_limit_order(pmut@, const uint256&in, const uint256&in, order_side, order_policy, const real320&in, const real320&in)";
        const trailingStopOrder = "uint256 trailing_stop_order(pmut@, const uint256&in, const uint256&in, order_side, order_policy, const real320&in, const real320&in, const real320&in, const real320&in)";
        const trailingStopLimitOrder = "uint256 trailing_stop_limit_order(pmut@, const uint256&in, const uint256&in, order_side, order_policy, const real320&in, const real320&in, const real320&in, const real320&in)";
        const withdrawOrder = "void withdraw_order(pmut@, const uint256&in)";
        const depositPool = "uint256 deposit_pool(pmut@, const uint256&in, const uint256&in, const real320&in, const real320&in, const real320&in, const real320&in)";
        const withdrawPool = "void withdraw_pool(pmut@, const uint256&in)";
        const bestPriceOf = "real320 best_price_of(pconst@, const uint256&in, const uint256&in, order_side)";
        const orderOf = "order order_of(pconst@, const uint256&in)";
        const orderAlive = "bool order_alive(pconst@, const uint256&in)";
        const poolOf = "pool pool_of(pconst@, const uint256&in)";
        const poolAlive = "bool pool_alive(pconst@, const uint256&in)";
        const pairOf = "asset_pair pair_of(pconst@, const uint256&in)";
        const assetOf = "asset_tier asset_of(pconst@, const uint256&in)";
        const accountOf = "account_tier account_of(pconst@, const address&in, const uint256&in)";
        const accountAssetOf = "account_asset_tier account_asset_of(pconst@, const address&in, const uint256&in)";
        const paramsOf = "config params_of(pconst@)";
    }
    namespace DLP {
        namespace Events {
            const Config: number;
            const PoolRefOwner: number;
        }
        const construct = "void construct(pmut@, const address&in)";
        const reconstruct = "void reconstruct(pmut@, const config&in)";
        const reconstructDeployer = "void reconstruct_deployer(pmut@, const address&in)";
        const reconstructReward = "void reconstruct_reward(pmut@, const real320&in)";
        const reconstructPermit = "void reconstruct_permit(pmut@, const uint256&in, const uint256&in, bool)";
        const transferLiquidity = "uint256 transfer_liquidity(pmut@, const uint256&in, const uint256&in, const real320&in, const real320&in, const real320&in, const real320&in, const real320&in, const real320&in)";
        const pullLiquidity = "void pull_liquidity(pmut@, const uint256&in, const uint256&in)";
        const depositLiquidity = "void deposit_liquidity(pmut@, const uint256&in, const uint256&in)";
        const withdrawLiquidity = "void withdraw_liquidity(pmut@, const uint256&in, const uint256&in, const real320&in, const real320&in)";
        const poolOf = "pool_state pool_of(pconst@, const uint256&in, const uint256&in)";
        const shareOf = "pool_size share_of(pconst@, const uint256&in, const uint256&in, const address&in)";
        const liquidityOf = "pool_size liquidity_of(pconst@, const uint256&in, const uint256&in)";
        const paramsOf = "config params_of(pconst@)";
    }
}

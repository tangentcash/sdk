"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Spot = exports.Types = void 0;
const algorithm_1 = require("./algorithm");
const schema_1 = require("./schema");
class Types {
}
exports.Types = Types;
Types.AccountBalance = algorithm_1.Hashing.hash32(algorithm_1.ByteUtil.byteStringToUint8Array(schema_1.States.AccountBalance.typename));
Types.BridgeInstance = algorithm_1.Hashing.hash32(algorithm_1.ByteUtil.byteStringToUint8Array(schema_1.States.BridgeInstance.typename));
Types.BridgeQueue = algorithm_1.Hashing.hash32(algorithm_1.ByteUtil.byteStringToUint8Array(schema_1.States.BridgeQueue.typename));
Types.BridgeBalance = algorithm_1.Hashing.hash32(algorithm_1.ByteUtil.byteStringToUint8Array(schema_1.States.BridgeBalance.typename));
Types.WitnessAccount = algorithm_1.Hashing.hash32(algorithm_1.ByteUtil.byteStringToUint8Array(schema_1.States.WitnessAccount.typename));
Types.WitnessTransaction = algorithm_1.Hashing.hash32(algorithm_1.ByteUtil.byteStringToUint8Array(schema_1.States.WitnessTransaction.typename));
Types.Rollup = algorithm_1.Hashing.hash32(algorithm_1.ByteUtil.byteStringToUint8Array(schema_1.Transactions.Rollup.typename));
Types.Setup = algorithm_1.Hashing.hash32(algorithm_1.ByteUtil.byteStringToUint8Array(schema_1.Transactions.Setup.typename));
Types.Route = algorithm_1.Hashing.hash32(algorithm_1.ByteUtil.byteStringToUint8Array(schema_1.Transactions.Route.typename));
Types.Withdraw = algorithm_1.Hashing.hash32(algorithm_1.ByteUtil.byteStringToUint8Array(schema_1.Transactions.Withdraw.typename));
var Spot;
(function (Spot) {
    let DEX;
    (function (DEX) {
        let Events;
        (function (Events) {
            Events.Config = algorithm_1.Hashing.hash32(algorithm_1.ByteUtil.byteStringToUint8Array('config'));
            Events.Order = algorithm_1.Hashing.hash32(algorithm_1.ByteUtil.byteStringToUint8Array('order'));
            Events.Pool = algorithm_1.Hashing.hash32(algorithm_1.ByteUtil.byteStringToUint8Array('pool'));
            Events.Swap = algorithm_1.Hashing.hash32(algorithm_1.ByteUtil.byteStringToUint8Array('swap'));
            Events.AssetTier = algorithm_1.Hashing.hash32(algorithm_1.ByteUtil.byteStringToUint8Array('asset_tier'));
        })(Events = DEX.Events || (DEX.Events = {}));
        DEX.construct = 'void construct(pmut@)';
        DEX.reconstruct = 'void reconstruct(pmut@, const config&in)';
        DEX.unifyAsset = 'void unify_asset(pmut@, const uint256&in, const string&in)';
        DEX.repayAsset = 'void repay_asset(pmut@, const uint256&in)';
        DEX.marketOrder = 'uint256 market_order(pmut@, const uint256&in, const uint256&in, order_side, order_policy, const real320&in)';
        DEX.limitOrder = 'uint256 limit_order(pmut@, const uint256&in, const uint256&in, order_side, order_policy, const real320&in)';
        DEX.stopOrder = 'uint256 stop_order(pmut@, const uint256&in, const uint256&in, order_side, order_policy, const real320&in, const real320&in)';
        DEX.stopLimitOrder = 'uint256 stop_limit_order(pmut@, const uint256&in, const uint256&in, order_side, order_policy, const real320&in, const real320&in)';
        DEX.trailingStopOrder = 'uint256 trailing_stop_order(pmut@, const uint256&in, const uint256&in, order_side, order_policy, const real320&in, const real320&in, const real320&in, const real320&in)';
        DEX.trailingStopLimitOrder = 'uint256 trailing_stop_limit_order(pmut@, const uint256&in, const uint256&in, order_side, order_policy, const real320&in, const real320&in, const real320&in, const real320&in)';
        DEX.withdrawOrder = 'void withdraw_order(pmut@, const uint256&in)';
        DEX.depositPool = 'uint256 deposit_pool(pmut@, const uint256&in, const uint256&in, const real320&in, const real320&in, const real320&in, const real320&in)';
        DEX.withdrawPool = 'void withdraw_pool(pmut@, const uint256&in)';
        DEX.bestPriceOf = 'real320 best_price_of(pconst@, const uint256&in, const uint256&in, order_side)';
        DEX.orderOf = 'order order_of(pconst@, const uint256&in)';
        DEX.orderAlive = 'bool order_alive(pconst@, const uint256&in)';
        DEX.poolOf = 'pool pool_of(pconst@, const uint256&in)';
        DEX.poolAlive = 'bool pool_alive(pconst@, const uint256&in)';
        DEX.pairOf = 'asset_pair pair_of(pconst@, const uint256&in)';
        DEX.assetOf = 'asset_tier asset_of(pconst@, const uint256&in)';
        DEX.accountOf = 'account_tier account_of(pconst@, const address&in, const uint256&in)';
        DEX.accountAssetOf = 'account_asset_tier account_asset_of(pconst@, const address&in, const uint256&in)';
        DEX.paramsOf = 'config params_of(pconst@)';
    })(DEX = Spot.DEX || (Spot.DEX = {}));
    let DLP;
    (function (DLP) {
        let Events;
        (function (Events) {
            Events.Config = algorithm_1.Hashing.hash32(algorithm_1.ByteUtil.byteStringToUint8Array('config'));
            Events.PoolRefEvent = algorithm_1.Hashing.hash32(algorithm_1.ByteUtil.byteStringToUint8Array('pool_ref_event'));
        })(Events = DLP.Events || (DLP.Events = {}));
        DLP.construct = 'void construct(pmut@, const address&in)';
        DLP.reconstruct = 'void reconstruct(pmut@, const config&in)';
        DLP.reconstructDeployer = 'void reconstruct_deployer(pmut@, const address&in)';
        DLP.reconstructReward = 'void reconstruct_reward(pmut@, const real320&in)';
        DLP.reconstructPermit = 'void reconstruct_permit(pmut@, const uint256&in, const uint256&in, bool)';
        DLP.transferLiquidity = 'uint256 transfer_liquidity(pmut@, const uint256&in, const uint256&in, const real320&in, const real320&in, const real320&in, const real320&in, const real320&in, const real320&in)';
        DLP.pullLiquidity = 'void pull_liquidity(pmut@, const uint256&in, const uint256&in)';
        DLP.depositLiquidity = 'void deposit_liquidity(pmut@, const uint256&in, const uint256&in)';
        DLP.withdrawLiquidity = 'void withdraw_liquidity(pmut@, const uint256&in, const uint256&in, const real320&in, const real320&in)';
        DLP.poolOf = 'pool_state pool_of(pconst@, const uint256&in, const uint256&in)';
        DLP.shareOf = 'pool_size share_of(pconst@, const uint256&in, const uint256&in, const address&in)';
        DLP.liquidityOf = 'pool_size liquidity_of(pconst@, const uint256&in, const uint256&in)';
        DLP.paramsOf = 'config params_of(pconst@)';
    })(DLP = Spot.DLP || (Spot.DLP = {}));
})(Spot || (exports.Spot = Spot = {}));

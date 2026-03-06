"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEX = exports.Types = void 0;
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
var DEX;
(function (DEX) {
    let Spot;
    (function (Spot) {
        let Events;
        (function (Events) {
            Events.Config = algorithm_1.Hashing.hash32(algorithm_1.ByteUtil.byteStringToUint8Array('config'));
            Events.Order = algorithm_1.Hashing.hash32(algorithm_1.ByteUtil.byteStringToUint8Array('order'));
            Events.Pool = algorithm_1.Hashing.hash32(algorithm_1.ByteUtil.byteStringToUint8Array('pool'));
            Events.Swap = algorithm_1.Hashing.hash32(algorithm_1.ByteUtil.byteStringToUint8Array('swap'));
            Events.AssetTier = algorithm_1.Hashing.hash32(algorithm_1.ByteUtil.byteStringToUint8Array('asset_tier'));
        })(Events = Spot.Events || (Spot.Events = {}));
        Spot.construct = 'void construct(pmut@)';
        Spot.reconstruct = 'void reconstruct(pmut@, const config&in)';
        Spot.unifyAsset = 'void unify_asset(pmut@, const uint256&in, const string&in)';
        Spot.repayAsset = 'void repay_asset(pmut@, const uint256&in)';
        Spot.marketOrder = 'uint256 market_order(pmut@, const uint256&in, const uint256&in, order_side, order_policy, const real320&in)';
        Spot.limitOrder = 'uint256 limit_order(pmut@, const uint256&in, const uint256&in, order_side, order_policy, const real320&in)';
        Spot.stopOrder = 'uint256 stop_order(pmut@, const uint256&in, const uint256&in, order_side, order_policy, const real320&in, const real320&in)';
        Spot.stopLimitOrder = 'uint256 stop_limit_order(pmut@, const uint256&in, const uint256&in, order_side, order_policy, const real320&in, const real320&in)';
        Spot.trailingStopOrder = 'uint256 trailing_stop_order(pmut@, const uint256&in, const uint256&in, order_side, order_policy, const real320&in, const real320&in, const real320&in, const real320&in)';
        Spot.trailingStopLimitOrder = 'uint256 trailing_stop_limit_order(pmut@, const uint256&in, const uint256&in, order_side, order_policy, const real320&in, const real320&in, const real320&in, const real320&in)';
        Spot.withdrawOrder = 'void withdraw_order(pmut@, const uint256&in)';
        Spot.depositPool = 'uint256 deposit_pool(pmut@, const uint256&in, const uint256&in, const real320&in, const real320&in, const real320&in, const real320&in)';
        Spot.withdrawPool = 'void withdraw_pool(pmut@, const uint256&in)';
        Spot.bestPriceOf = 'real320 best_price_of(pconst@, const uint256&in, const uint256&in, order_side)';
        Spot.orderOf = 'order order_of(pconst@, const uint256&in)';
        Spot.orderAlive = 'bool order_alive(pconst@, const uint256&in)';
        Spot.poolOf = 'pool pool_of(pconst@, const uint256&in)';
        Spot.poolAlive = 'bool pool_alive(pconst@, const uint256&in)';
        Spot.pairOf = 'asset_pair pair_of(pconst@, const uint256&in)';
        Spot.assetOf = 'asset_tier asset_of(pconst@, const uint256&in)';
        Spot.accountOf = 'account_tier account_of(pconst@, const address&in, const uint256&in)';
        Spot.accountAssetOf = 'account_asset_tier account_asset_of(pconst@, const address&in, const uint256&in)';
        Spot.paramsOf = 'config params_of(pconst@)';
    })(Spot = DEX.Spot || (DEX.Spot = {}));
})(DEX || (exports.DEX = DEX = {}));

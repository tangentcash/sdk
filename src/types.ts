import { ByteUtil, Hashing } from "./algorithm";
import { States, Transactions } from "./schema";

export class Types {
  static AccountBalance = Hashing.hash32(ByteUtil.byteStringToUint8Array(States.AccountBalance.typename));
  static BridgeInstance = Hashing.hash32(ByteUtil.byteStringToUint8Array(States.BridgeInstance.typename));
  static BridgeQueue = Hashing.hash32(ByteUtil.byteStringToUint8Array(States.BridgeQueue.typename));
  static BridgeBalance = Hashing.hash32(ByteUtil.byteStringToUint8Array(States.BridgeBalance.typename));
  static WitnessAccount = Hashing.hash32(ByteUtil.byteStringToUint8Array(States.WitnessAccount.typename));
  static WitnessTransaction = Hashing.hash32(ByteUtil.byteStringToUint8Array(States.WitnessTransaction.typename));
  static Rollup = Hashing.hash32(ByteUtil.byteStringToUint8Array(Transactions.Rollup.typename));
  static Setup = Hashing.hash32(ByteUtil.byteStringToUint8Array(Transactions.Setup.typename));
  static Route = Hashing.hash32(ByteUtil.byteStringToUint8Array(Transactions.Route.typename));
  static Withdraw = Hashing.hash32(ByteUtil.byteStringToUint8Array(Transactions.Withdraw.typename));
}

export namespace DEX {
  export namespace Spot {
    export namespace Events {
      export const Config = Hashing.hash32(ByteUtil.byteStringToUint8Array('config'));
      export const Order = Hashing.hash32(ByteUtil.byteStringToUint8Array('order'));
      export const Pool = Hashing.hash32(ByteUtil.byteStringToUint8Array('pool'));
      export const Swap = Hashing.hash32(ByteUtil.byteStringToUint8Array('swap'));
      export const AssetTier = Hashing.hash32(ByteUtil.byteStringToUint8Array('asset_tier'));
    }

    export const construct = 'void construct(pmut@)';
    export const reconstruct = 'void reconstruct(pmut@, const config&in)';
    export const unifyAsset = 'void unify_asset(pmut@, const uint256&in, const string&in)';
    export const repayAsset = 'void repay_asset(pmut@, const uint256&in)';
    export const marketOrder = 'uint256 market_order(pmut@, const uint256&in, const uint256&in, order_side, order_policy, const real320&in)';
    export const limitOrder = 'uint256 limit_order(pmut@, const uint256&in, const uint256&in, order_side, order_policy, const real320&in)';
    export const stopOrder = 'uint256 stop_order(pmut@, const uint256&in, const uint256&in, order_side, order_policy, const real320&in, const real320&in)';
    export const stopLimitOrder = 'uint256 stop_limit_order(pmut@, const uint256&in, const uint256&in, order_side, order_policy, const real320&in, const real320&in)';
    export const trailingStopOrder = 'uint256 trailing_stop_order(pmut@, const uint256&in, const uint256&in, order_side, order_policy, const real320&in, const real320&in, const real320&in, const real320&in)';
    export const trailingStopLimitOrder = 'uint256 trailing_stop_limit_order(pmut@, const uint256&in, const uint256&in, order_side, order_policy, const real320&in, const real320&in, const real320&in, const real320&in)';
    export const withdrawOrder = 'void withdraw_order(pmut@, const uint256&in)';
    export const depositPool = 'uint256 deposit_pool(pmut@, const uint256&in, const uint256&in, const real320&in, const real320&in, const real320&in, const real320&in)';
    export const withdrawPool = 'void withdraw_pool(pmut@, const uint256&in)';
    export const bestPriceOf = 'real320 best_price_of(pconst@, const uint256&in, const uint256&in, order_side)';
    export const orderOf = 'order order_of(pconst@, const uint256&in)';
    export const orderAlive = 'bool order_alive(pconst@, const uint256&in)';
    export const poolOf = 'pool pool_of(pconst@, const uint256&in)';
    export const poolAlive = 'bool pool_alive(pconst@, const uint256&in)';
    export const pairOf = 'asset_pair pair_of(pconst@, const uint256&in)';
    export const assetOf = 'asset_tier asset_of(pconst@, const uint256&in)';
    export const accountOf = 'account_tier account_of(pconst@, const address&in, const uint256&in)';
    export const accountAssetOf = 'account_asset_tier account_asset_of(pconst@, const address&in, const uint256&in)';
    export const paramsOf = 'config params_of(pconst@)';
  }
}
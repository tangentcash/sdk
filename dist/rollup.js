"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RollupUtil = void 0;
const algorithm_1 = require("./algorithm");
const schema_1 = require("./schema");
const serialization_1 = require("./serialization");
class RollupUtil {
    static store(stream, transaction, subtransactions) {
        let assets = [], groups = {};
        for (let i = 0; i < subtransactions.length; i++) {
            const subtransaction = subtransactions[i];
            if (!(subtransaction.args?.asset instanceof algorithm_1.AssetId))
                throw new Error('Field \'asset\' is required');
            const asset = subtransaction.args.asset.toUint256();
            const assetId = asset.toHex();
            let group = groups[assetId];
            if (!group) {
                assets.push(subtransaction.args.asset.toUint256());
                group[assetId] = [subtransaction];
            }
            else {
                group.push(subtransaction);
            }
        }
        const emptyTransaction = new schema_1.Ledger.Transaction();
        const emptySignature = new algorithm_1.Hashsig();
        assets = assets.sort((a, b) => a.compareTo(b));
        serialization_1.SchemaUtil.store(stream, transaction, new schema_1.Transactions.Rollup());
        stream.writeInteger(assets.length);
        for (let i = 0; i < assets.length; i++) {
            const asset = assets[i];
            const transactions = groups[asset.toHex()];
            stream.writeInteger(asset);
            stream.writeInteger(transactions.length);
            for (let j = 0; j < transactions.length; j++) {
                const subtransaction = transactions[j];
                if (typeof subtransaction.schema.getType != 'function') {
                    throw new Error('Function \'getType\' is required');
                }
                else if (!(subtransaction.args.signature instanceof algorithm_1.Hashing)) {
                    throw new Error('Field \'signature\' is required');
                }
                const type = subtransaction.schema.type();
                const internalTransaction = subtransaction.args.signature.equals(emptySignature);
                stream.writeBoolean(internalTransaction);
                stream.writeInteger(typeof type == 'string' ? algorithm_1.Hashing.hash32(algorithm_1.ByteUtil.byteStringToUint8Array(type)) : type);
                if (!internalTransaction) {
                    stream.writeInteger(subtransaction.args.nonce);
                    stream.writeBinaryStringOptimized(subtransaction.args.signature.data);
                }
                for (let item in emptyTransaction) {
                    delete subtransaction.schema[item];
                }
                serialization_1.SchemaUtil.store(stream, subtransaction.args, subtransaction.schema);
            }
        }
    }
}
exports.RollupUtil = RollupUtil;

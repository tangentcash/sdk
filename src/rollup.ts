import { AssetId, ByteUtil, Hashing, Hashsig, Uint256 } from "./algorithm";
import { Ledger, Transactions } from "./schema";
import { SchemaUtil, Stream } from "./serialization";

export type Subtransaction = {
    args: any;
    schema: any;
}

export class RollupUtil {
    static store(stream: Stream, transaction: any, subtransactions: Subtransaction[]) {
        let assets: Uint256[] = [], groups: Record<string, Subtransaction[]> = { };
        for (let i = 0; i < subtransactions.length; i++) {
            const subtransaction = subtransactions[i];
            if (!(subtransaction.args?.asset instanceof AssetId))
                throw new Error('Field \'asset\' is required');
            
            const asset: Uint256 = subtransaction.args.asset.toUint256();
            const assetId: string = asset.toHex();
            let group = groups[assetId];
            if (!group) {
                assets.push(subtransaction.args.asset.toUint256());
                (group as any)[assetId] = [subtransaction];
            } else {
                group.push(subtransaction);
            }
        }

        const emptyTransaction = new Ledger.Transaction();
        const emptySignature = new Hashsig();
        assets = assets.sort((a, b) => a.compareTo(b));
        SchemaUtil.store(stream, transaction, new Transactions.Rollup());
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
                } else if (!(subtransaction.args.signature instanceof Hashing)) {
                    throw new Error('Field \'signature\' is required');
                }

                const type = subtransaction.schema.type();
                const internalTransaction = subtransaction.args.signature.equals(emptySignature);
                stream.writeBoolean(internalTransaction);
                stream.writeInteger(typeof type == 'string' ? Hashing.hash32(ByteUtil.byteStringToUint8Array(type)) : type);
                if (!internalTransaction) {
                    stream.writeInteger(subtransaction.args.nonce);
                    stream.writeBinaryStringOptimized(subtransaction.args.signature.data);
                }
                for (let item in emptyTransaction) {
                    delete subtransaction.schema[item];
                }
                SchemaUtil.store(stream, subtransaction.args, subtransaction.schema);
            }
        }
    }
}
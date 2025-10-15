import { Stream } from "./serialization";
export type Subtransaction = {
    args: any;
    schema: any;
};
export declare class RollupUtil {
    static store(stream: Stream, transaction: any, subtransactions: Subtransaction[]): void;
}

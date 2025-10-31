export declare namespace Messages {
    class Uniform {
        type: string;
    }
    class Authentic extends Uniform {
        signature: string;
    }
    function asSigningSchema(schema: any): any;
}
export declare namespace Ledger {
    class Transaction extends Messages.Authentic {
        asset: string;
        gasPrice: string;
        gasLimit: string;
        nonce: string;
    }
    class Commitment extends Messages.Authentic {
        asset: string;
        gasLimit: string;
        nonce: string;
    }
    class Unknown extends Messages.Authentic {
        asset: string;
        gasPrice: string;
        gasLimit: string;
        nonce: string;
        typeless: string;
        getType: (() => number) | null;
    }
}
export declare namespace States {
    class AccountBalance {
        static typename: string;
    }
    class DepositoryBalance {
        static typename: string;
    }
    class DepositoryPolicy {
        static typename: string;
    }
    class WitnessAccount {
        static typename: string;
    }
    class WitnessTransaction {
        static typename: string;
    }
}
export declare namespace Transactions {
    namespace Transfer {
        class One extends Ledger.Transaction {
            static typename: string;
            to: string;
            value: string;
            getType(): string;
        }
        class Many extends Ledger.Transaction {
            static typename: string;
            to: string[];
            getType(): string;
        }
    }
    class Call extends Ledger.Transaction {
        static typename: string;
        callable: string;
        function: string;
        value: string;
        args: string;
        getType(): string;
    }
    class Rollup extends Ledger.Transaction {
        static typename: string;
        getType(): string;
    }
    class ValidatorAdjustment extends Ledger.Transaction {
        static typename: string;
        blockProduction: string;
        participationStakes: string[];
        attestationStakes: string[];
        getType(): string;
    }
    class DepositoryAccount extends Ledger.Commitment {
        static typename: string;
        manager: string;
        routingAddress: string;
        getType(): string;
    }
    class DepositoryWithdrawal extends Ledger.Transaction {
        static typename: string;
        onlyIfNotInQueue: string;
        fromManager: string;
        toManager: string;
        to: string[];
        getType(): string;
    }
    class DepositoryAdjustment extends Ledger.Transaction {
        static typename: string;
        incomingFee: string;
        outgoingFee: string;
        participationThreshold: string;
        securityLevel: string;
        acceptsAccountRequests: string;
        acceptsWithdrawalRequests: string;
        getType(): string;
    }
    class DepositoryMigration extends Ledger.Transaction {
        static typename: string;
        participants: string[];
        getType(): string;
    }
    const typenames: Record<string, string>;
}

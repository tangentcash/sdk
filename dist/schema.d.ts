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
        conservative: string;
    }
    class DelegationTransaction extends Messages.Authentic {
        asset: string;
        gasPrice: string;
        gasLimit: string;
        nonce: string;
        manager: string;
    }
    class ConsensusTransaction extends Messages.Authentic {
        asset: string;
        gasPrice: string;
        gasLimit: string;
        nonce: string;
    }
    class UnknownTransaction extends Messages.Authentic {
        asset: string;
        gasPrice: string;
        gasLimit: string;
        nonce: string;
        body: string;
    }
}
export declare namespace States {
    class AccountBalance {
        static typename: string;
    }
    class ValidatorProduction {
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
    namespace Refuel {
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
    class Rollup extends Ledger.Transaction {
        static typename: string;
        getType(): string;
    }
    class Certification extends Ledger.Transaction {
        static typename: string;
        blockProduction: string;
        participationStakes: string[];
        attestationStakes: string[];
        getType(): string;
    }
    class DepositoryAccount extends Ledger.DelegationTransaction {
        static typename: string;
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
        securityLevel: string;
        acceptsAccountRequests: string;
        acceptsWithdrawalRequests: string;
        getType(): string;
    }
    class DepositoryRegrouping extends Ledger.Transaction {
        static typename: string;
        participants: string[];
        getType(): string;
    }
}

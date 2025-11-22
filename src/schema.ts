export namespace Messages {
  export class Uniform {
    type: string = 'uint32';
  }

  export class Authentic extends Uniform {
    signature: string = 'hashsig';
  }
  
  export function asSigningSchema(schema: any): any {
    const signingSchema = {
      ...schema,
      getType: schema.getType
    };
    for (let key in new Messages.Authentic()) {
      delete signingSchema[key];
    }
    return { type: 'uint32', ...signingSchema };
  }
}

export namespace Ledger {
  export class Transaction extends Messages.Authentic {
    asset: string = 'assetid';
    gasPrice: string = 'decimal';
    gasLimit: string = 'uint256';
    nonce: string = 'uint64';
  }

  export class Commitment extends Messages.Authentic {
    asset: string = 'assetid';
    gasLimit: string = 'uint256';
    nonce: string = 'uint64';
  }

  export class Unknown extends Messages.Authentic {
    asset: string = 'assetid';
    gasPrice: string = 'decimal?';
    gasLimit: string = 'uint256';
    nonce: string = 'uint64';
    typeless: string = 'typeless';
    getType: (() => number) | null = null;
  }
}

export namespace States {
  export class AccountBalance {
    static typename: string = 'account_balance';
  }

  export class ValidatorAttestation {
    static typename: string = 'validator_attestation';
  }

  export class BridgeBalance {
    static typename: string = 'bridge_balance';
  }

  export class WitnessAccount {
    static typename: string = 'witness_account';
  }

  export class WitnessTransaction {
    static typename: string = 'witness_transaction';
  }
}

export namespace Transactions {
  export namespace Transfer {
    export class One extends Ledger.Transaction {
      static typename: string = 'transfer';
      to: string = 'pubkeyhash';
      value: string = 'decimal';
  
      getType() { return One.typename; }
    }
  
    export class Many extends Ledger.Transaction {
      static typename: string = 'transfer';
      to: string[] = [
        'to', 'pubkeyhash',
        'value', 'decimal'
      ];
  
      getType() { return Many.typename; }
    }
  }

  export class Call extends Ledger.Transaction {
    static typename: string = 'call';
    callable: string = 'pubkeyhash';
    function: string = 'string';
    value: string = 'decimal';
    args: string = 'args';

    getType() { return Call.typename; }
  }

  export class Rollup extends Ledger.Transaction {
    static typename: string = 'rollup';

    getType() { return Rollup.typename; }
  }

  export class ValidatorAdjustment extends Ledger.Transaction {
    static typename: string = 'validator_adjustment';
    attestationStakes: string[] = [
      'has', 'assetid',
      'stake', 'decimal',
      'hasAcceptsAccountRequests', 'boolean',
      'hasAcceptsWithdrawalRequests', 'boolean',
      'hasSecurityLevel', 'boolean',
      'hasIncomingFee', 'boolean',
      'hasOutgoingFee', 'boolean',
      'hasParticipationThreshold', 'boolean',
      'acceptsAccountRequests', 'boolean?',
      'acceptsWithdrawalRequests', 'boolean?',
      'securityLevel', 'uint8?',
      'incomingFee', 'decimal?',
      'outgoingFee', 'decimal?',
      'participationThreshold', 'decimal?',
    ];
    hasParticipation: string = 'boolean';
    participationStake: string = 'decimal?';
    hasProduction: string = 'boolean';
    productionStake: string = 'decimal?';

    getType() { return ValidatorAdjustment.typename; }
  }

  export class BridgeAccount extends Ledger.Commitment {
    static typename: string = 'bridge_account';
    manager: string = 'pubkeyhash';
    routingAddress: string = 'string';

    getType() { return BridgeAccount.typename; }
  }

  export class BridgeWithdrawal extends Ledger.Transaction {
    static typename: string = 'bridge_withdrawal';
    onlyIfNotInQueue: string = 'boolean';
    manager: string = 'pubkeyhash';
    to: string[] = [
      'to', 'string',
      'value', 'decimal'
    ];

    getType() { return BridgeWithdrawal.typename; }
  }

  export class BridgeMigration extends Ledger.Transaction {
    static typename: string = 'bridge_migration';
    participants: string[] = [
      'asset', 'assetid',
      'manager', 'pubkeyhash',
      'owner', 'pubkeyhash'
    ];

    getType() { return BridgeMigration.typename; }
  }

  export const typenames: Record<string, string> = {
    'transfer': 'Transfer',   
    'upgrade': 'Create program',
    'call': 'Call program',
    'rollup': 'Rollup',
    'validator_adjustment': 'Adjust validator',
    'bridge_attestation': 'Process bridge transaction',
    'bridge_account': 'Order bridge address',
    'bridge_account_finalization': 'Issue bridge address',
    'bridge_withdrawal': 'Order bridge withdrawal',
    'bridge_withdrawal_finalization': 'Issue bridge transaction',
    'bridge_migration': 'Order bridge signer migration',
    'bridge_migration_finalization': 'Migrate bridge signer'
  };
}
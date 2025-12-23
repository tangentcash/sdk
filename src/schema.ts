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

  export class Setup extends Ledger.Transaction {
    static typename: string = 'setup';
    migrations: string[] = [
      'broadcastHash', 'uint256',
      'participant', 'pubkeyhash'
    ];
    attestations: string[] = [
      'asset', 'assetid',
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

    getType() { return Setup.typename; }
  }

  export class Route extends Ledger.Commitment {
    static typename: string = 'route';
    manager: string = 'pubkeyhash';
    routingAddress: string = 'string';

    getType() { return Route.typename; }
  }

  export class Withdraw extends Ledger.Transaction {
    static typename: string = 'withdraw';
    onlyIfNotInQueue: string = 'boolean';
    manager: string = 'pubkeyhash';
    toAddress: string = 'string';
    toValue: string = 'decimal';

    getType() { return Withdraw.typename; }
  }

  export const typenames: Record<string, string> = {
    'transfer': 'Transfer',   
    'deploy': 'Deploy',
    'call': 'Call',
    'rollup': 'Rollup',
    'setup': 'Setup validator',
    'migrate': 'Migrate validator',
    'attestate': 'Process bridge transaction',
    'route': 'Order bridge address',
    'bind': 'Bind bridge address',
    'withdraw': 'Order bridge withdrawal',
    'broadcast': 'Broadcast bridge transaction'
  };
}
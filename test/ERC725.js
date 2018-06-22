const async = require('async');

const Identity = artifacts.require('Identity');
const PSP_Identity = artifacts.require('PSP_Identity');

const MANAGEMENT_PURPOSE = 1;
const ACTION_PURPOSE = 2;
const CLAIM_PURPOSE = 3;
const ENCRYPTION_PURPOSE = 4;

const ALLOW_PAYMENT_PURPOSE = 101;

const ECDSA_TYPE = 1;
const RSA_TYPE = 2;

const addrToKey = addr => '0x' + web3.padLeft(addr.substring(2), 64);

contract('Identity', (accounts) => {

  const owner = accounts[0];

  it('identity owner\'s key should be added as management key', (done) => {
    async.auto({
      ctr: (cb) => Identity.new({from: owner}).then(ctr => cb(null, ctr)),
      getOwnerKey: ['ctr', (res, cb) => {
        res.ctr.getKey(addrToKey(owner), MANAGEMENT_PURPOSE).then(key => cb(null, key));
      }],
      getOwnerKeyPurposes: ['ctr', (res, cb) => {
        res.ctr.getKeyPurpose(addrToKey(owner)).then(purposes => cb(null, purposes));
      }],
      getManagementKeys: ['ctr', (res, cb) => {
        res.ctr.getKeysByPurpose(MANAGEMENT_PURPOSE).then(keys => cb(null, keys));
      }],
      getActionKeys: ['ctr', (res, cb) => {
        res.ctr.getKeysByPurpose(ACTION_PURPOSE).then(keys => cb(null, keys));
      }],
      getClaimKeys: ['ctr', (res, cb) => {
        res.ctr.getKeysByPurpose(CLAIM_PURPOSE).then(keys => cb(null, keys));
      }],
      getEncryptionKeys: ['ctr', (res, cb) => {
        res.ctr.getKeysByPurpose(ENCRYPTION_PURPOSE).then(keys => cb(null, keys));
      }],
    }, (err, res) => {
      // getOwnerKey
      assert.isTrue(res.getOwnerKey[0].equals(MANAGEMENT_PURPOSE), 'Invalid owner key purpose');
      assert.isTrue(res.getOwnerKey[1].equals(ECDSA_TYPE), 'Invalid owner key type');
      assert.equal(res.getOwnerKey[2], addrToKey(owner), 'Invalid owner key');

      // getOwnerKeyPurposes
      assert.equal(res.getOwnerKeyPurposes.length, 1, 'More than 1 purpose for owner key');
      assert.isTrue(res.getOwnerKeyPurposes[0].equals(MANAGEMENT_PURPOSE), 'Owner key purpose is not MANAGEMENT');

      // getManagementKeys
      assert.equal(res.getManagementKeys.length, 1, 'More than 1 MANAGEMENT key');
      assert.equal(res.getManagementKeys[0], addrToKey(owner), 'Invalid MANAGEMENT key');

      // getActionKeys
      assert.equal(res.getActionKeys.length, 0, 'Unexpected action key');

      // getClaimKeys
      assert.equal(res.getClaimKeys.length, 0, 'Unexpected claim key');

      // getEncryptionKeys
      assert.equal(res.getEncryptionKeys.length, 0, 'Unexpected encryption key');
      return done();
    });
  });

  it('management key can add keys', (done) => {
    const managementKey = addrToKey(accounts[1]);
    const actionKey = addrToKey(accounts[2]);
    const claimKey = addrToKey(accounts[3]);
    const encryptionKey = addrToKey(accounts[4]);
    async.auto({
      ctr: (cb) => Identity.new({from: owner}).then(ctr => cb(null, ctr)),
      addManagementKey: ['ctr', (res, cb) => {
        res.ctr.addKey(managementKey, MANAGEMENT_PURPOSE, ECDSA_TYPE).then(() => cb());
      }],
      addActionKey: ['ctr', (res, cb) => {
        res.ctr.addKey(actionKey, ACTION_PURPOSE, ECDSA_TYPE).then(() => cb());
      }],
      addEncryptionKey: ['ctr', (res, cb) => {
        res.ctr.addKey(encryptionKey, ENCRYPTION_PURPOSE, ECDSA_TYPE).then(() => cb());
      }],
      addClaimKey: ['ctr', (res, cb) => {
        res.ctr.addKey(claimKey, CLAIM_PURPOSE, ECDSA_TYPE).then(() => cb());
      }],
      getManagementKeys: ['ctr', 'addManagementKey', (res, cb) => {
        res.ctr.getKeysByPurpose(MANAGEMENT_PURPOSE).then(keys => cb(null, keys));
      }],
      getActionKeys: ['ctr', 'addActionKey', (res, cb) => {
        res.ctr.getKeysByPurpose(ACTION_PURPOSE).then(keys => cb(null, keys));
      }],
      getClaimKeys: ['ctr', 'addClaimKey', (res, cb) => {
        res.ctr.getKeysByPurpose(CLAIM_PURPOSE).then(keys => cb(null, keys));
      }],
      getEncryptionKeys: ['ctr', 'addEncryptionKey', (res, cb) => {
        res.ctr.getKeysByPurpose(ENCRYPTION_PURPOSE).then(keys => cb(null, keys));
      }],
    }, (err, res) => {
      // getManagementKeys
      assert.equal(res.getManagementKeys.length, 2, 'Invalid number of MANAGEMENT keys');
      assert.isOk(res.getManagementKeys.find(key => key === managementKey), 'Cannot find MANAGEMENT key');

      // getActionKeys
      assert.equal(res.getActionKeys.length, 1, 'Invalid number of ACTION keys');
      assert.equal(res.getActionKeys[0], actionKey, 'Cannot find ACTION key');

      // getClaimKeys
      assert.equal(res.getClaimKeys.length, 1, 'Invalid number of CLAIM keys');
      assert.equal(res.getClaimKeys[0], claimKey, 'Cannot find CLAIM key');

      // getEncryptionKeys
      assert.equal(res.getEncryptionKeys.length, 1, 'Invalid number of ENCRYPTION keys');
      assert.equal(res.getEncryptionKeys[0], encryptionKey, 'Cannot find ENCRYPTION key');

      return done();
    });
  });

  it('non management key cannot add key', (done) => {
    const actionKey = addrToKey(accounts[1]);
    const claimKey = addrToKey(accounts[2]);
    const managementKey = addrToKey(accounts[3]);
    async.series([
      cb2 => {
        async.auto({
          ctr: (cb) => Identity.new({from: owner}).then(ctr => cb(null, ctr)),
          addActionKey: ['ctr', (res, cb) => {
            res.ctr.addKey(actionKey, ACTION_PURPOSE, ECDSA_TYPE).then(() => cb());
          }],
          addClaimKey: ['ctr', 'addActionKey', (res, cb) => {
            res.ctr.addKey(claimKey, CLAIM_PURPOSE, ECDSA_TYPE, {from: accounts[1]})
              .then(() => {
                assert.fail('Non management key can add claim key');
                cb();
              })
              .catch(() => cb());
          }],
          getClaimKeys: ['ctr', 'addClaimKey', (res, cb) => {
            res.ctr.getKeysByPurpose(CLAIM_PURPOSE).then(keys => cb(null, keys));
          }],
        }, (err, res) => {
          assert.equal(res.getClaimKeys.length, 0, 'Non management key can add claim key');
          return cb2();
        });
      },
      cb2 => {
        async.auto({
          ctr: (cb) => Identity.new({from: owner}).then(ctr => cb(null, ctr)),
          addManagementKey: ['ctr', (res, cb) => {
            res.ctr.addKey(managementKey, MANAGEMENT_PURPOSE, ECDSA_TYPE).then(() => cb());
          }],
          addClaimKey: ['ctr', 'addManagementKey', (res, cb) => {
            res.ctr.addKey(claimKey, CLAIM_PURPOSE, ECDSA_TYPE, {from: accounts[3]})
              .then(() => cb())
              .catch(() => {
                assert.fail('Management key cannot add claim key');
                cb()
              });
          }],
          getClaimKeys: ['ctr', 'addClaimKey', (res, cb) => {
            res.ctr.getKeysByPurpose(CLAIM_PURPOSE).then(keys => cb(null, keys));
          }],
        }, (err, res) => {
          assert.equal(res.getClaimKeys.length, 1, 'Management key cannot add claim key');
          return cb2();
        });
      },
    ], done);
  });

  it('management key can remove key', (done) => {
    const claimKey = addrToKey(accounts[1]);
    const otherClaimKey = addrToKey(accounts[2]);
    async.auto({
      ctr: (cb) => Identity.new({from: owner}).then(ctr => cb(null, ctr)),
      addFirstClaimKey: ['ctr', (res, cb) => {
        res.ctr.addKey(claimKey, CLAIM_PURPOSE, ECDSA_TYPE).then(() => cb());
      }],
      addSecondClaimKey: ['ctr', (res, cb) => {
        res.ctr.addKey(otherClaimKey, CLAIM_PURPOSE, ECDSA_TYPE).then(() => cb());
      }],
      addActionKey: ['ctr', (res, cb) => {
        res.ctr.addKey(claimKey, ACTION_PURPOSE, ECDSA_TYPE).then(() => cb());
      }],
      getKeyPurpose: ['ctr', 'addFirstClaimKey', 'addSecondClaimKey', 'addActionKey', (res, cb) => {
        res.ctr.getKeyPurpose(claimKey).then(purposes => {
          assert.equal(purposes.length, 2, 'Invalid number of purposes for the added key');
          assert.isOk(purposes.find(p => p.equals(CLAIM_PURPOSE)), 'Key purposes does not contains CLAIM');
          assert.isOk(purposes.find(p => p.equals(ACTION_PURPOSE)), 'Key purposes does not contains ACTION');
          cb();
        });
      }],
      getClaimKeys: ['ctr', 'getKeyPurpose', 'addFirstClaimKey', 'addSecondClaimKey', (res, cb) => {
        res.ctr.getKeysByPurpose(CLAIM_PURPOSE).then(keys => {
          assert.equal(keys.length, 2, 'Management key cannot add claim key');
          cb();
        });
      }],
      getActionsKeys: ['ctr', 'addActionKey', (res, cb) => {
        res.ctr.getKeysByPurpose(ACTION_PURPOSE).then(keys => {
          assert.equal(keys.length, 1, 'Management key cannot add action key');
          cb();
        });
      }],
      removeClaimKey: ['ctr', 'getClaimKeys', 'getActionsKeys', (res, cb) => {
        res.ctr.removeKey(claimKey, CLAIM_PURPOSE).then(() => cb());
      }],
      getClaimKeysAfterRemove: ['ctr', 'removeClaimKey', (res, cb) => {
        res.ctr.getKeysByPurpose(CLAIM_PURPOSE).then(keys => {
          assert.equal(keys.length, 1, 'Claim key not removed');
          assert.equal(keys[0], otherClaimKey, 'Remaning claim key is not valid');
          cb();
        });
      }],
      getActionKeysAfterRemove: ['ctr', 'removeClaimKey', (res, cb) => {
        res.ctr.getKeysByPurpose(ACTION_PURPOSE).then(keys => {
          assert.equal(keys.length, 1, 'Action key removed');
          cb();
        });
      }],
      getKeyPurposeAfterRemove: ['ctr', 'removeClaimKey', (res, cb) => {
        res.ctr.getKeyPurpose(claimKey).then(purposes => {
          assert.equal(purposes.length, 1, 'Invalid number of purposes after remove');
          assert.isTrue(purposes[0].equals(ACTION_PURPOSE), 'Key purposes does not contains ACTION');
          cb();
        });
      }],
      getKeyAfterRemove: ['ctr', 'removeClaimKey', (res, cb) => {
        res.ctr.getKey(claimKey, CLAIM_PURPOSE).then(key => {
          assert.equal(key[2], '0x0000000000000000000000000000000000000000000000000000000000000000', 'Get key return value for removed key');
          cb();
        });
      }],
    }, done);
  });

  it('non management key cannot remove key', (done) => {
    const actionKey = addrToKey(accounts[1]);
    const claimKey = addrToKey(accounts[2]);
    async.auto({
      ctr: (cb) => Identity.new({from: owner}).then(ctr => cb(null, ctr)),
      addActionKey: ['ctr', (res, cb) => {
        res.ctr.addKey(actionKey, ACTION_PURPOSE, ECDSA_TYPE).then(() => cb());
      }],
      addClaimKey: ['ctr', 'addActionKey', (res, cb) => {
        res.ctr.addKey(claimKey, CLAIM_PURPOSE, ECDSA_TYPE).then(() => cb());
      }],
      getClaimKeys: ['ctr', 'addClaimKey', (res, cb) => {
        res.ctr.getKeysByPurpose(CLAIM_PURPOSE).then(keys => {
          assert.equal(keys.length, 1, 'Invalid number of CLAIM keys');
          cb()
        });
      }],
      removeClaimKey: ['ctr', 'getClaimKeys', (res, cb) => {
        res.ctr.removeKey(claimKey, CLAIM_PURPOSE, {from: actionKey})
          .then(() => assert.fail('Non management key can remove key'))
          .catch(() => cb());
      }],
      getClaimKeysAfterRemove: ['ctr', 'removeClaimKey', (res, cb) => {
        res.ctr.getKeysByPurpose(CLAIM_PURPOSE).then(keys => {
          assert.equal(keys.length, 1, 'Invalid number of CLAIM keys');
          cb()
        });
      }]
    }, done);
  });

  it('management key can execute transaction without approval', (done) => {
    const managementKey = addrToKey(accounts[1]);
    const targetAccount = accounts[2];
    const initialBalance = web3.eth.getBalance(targetAccount);

    async.auto({
      ctr: (cb) => Identity.new({from: owner}).then(ctr => cb(null, ctr)),
      addManagementKey: ['ctr', (res, cb) => {
        res.ctr.addKey(managementKey, MANAGEMENT_PURPOSE, ECDSA_TYPE).then(() => cb());
      }],
      deposit: ['ctr', (res, cb) => {
        res.ctr.deposit({from: owner, value: web3.toWei(1, 'ether')}).then(() => cb());
      }],
      executeTx: ['ctr', 'deposit', 'addManagementKey', (res, cb) => {
        res.ctr.execute(targetAccount, web3.toWei(1, 'ether'), '0x0', {from: accounts[1]}).then(() => {
          const diff = web3.eth.getBalance(targetAccount).minus(initialBalance);
          assert.isTrue(diff.equals(web3.toWei(1, 'ether')), 'Transaction not executed');
          cb();
        })
      }]
    }, done);
  });

  it('action key can execute transaction with approval', (done) => {
    const actionKey = addrToKey(accounts[1]);
    const targetAccount = accounts[2];
    const initialBalance = web3.eth.getBalance(targetAccount);

    async.auto({
      ctr: (cb) => Identity.new({from: owner}).then(ctr => cb(null, ctr)),
      addActionKey: ['ctr', (res, cb) => {
        res.ctr.addKey(actionKey, ACTION_PURPOSE, ECDSA_TYPE).then(() => cb());
      }],
      deposit: ['ctr', (res, cb) => {
        res.ctr.deposit({from: owner, value: web3.toWei(1, 'ether')}).then(() => cb());
      }],
      executeTx: ['ctr', 'deposit', 'addActionKey', (res, cb) => {
        const watcher = res.ctr.ExecutionRequested();
        watcher.watch((err, evt) => {
          watcher.stopWatching();
          cb(null, evt.args.executionId);
        });
        res.ctr.execute(targetAccount, web3.toWei(1, 'ether'), '0x0', {from: accounts[1]}).then(() => {
          const diff = web3.eth.getBalance(targetAccount).minus(initialBalance);
          assert.isFalse(diff.equals(web3.toWei(1, 'ether')), 'Transaction executed');
        })
      }],
      approveWithActionKey: ['ctr', 'executeTx', (res, cb) => {
        res.ctr.approve(res.executeTx, true, {from: accounts[1]})
          .then(() => {
            assert.fail('Action key can approve tx');
          })
          .catch(() => cb());
      }],
      approveWithOwnerKey: ['ctr', 'approveWithActionKey', (res, cb) => {
        res.ctr.approve(res.executeTx, true, {from: owner})
          .then(() => {
            const diff = web3.eth.getBalance(targetAccount).minus(initialBalance);
            assert.isTrue(diff.equals(web3.toWei(1, 'ether')), 'Owner cannot approve tx');
            cb();
          });
      }]
    }, done);
  });

  it('non management or action key cannot execute transaction', (done) => {
    const claimKey = addrToKey(accounts[1]);

    async.auto({
      ctr: (cb) => Identity.new({from: owner}).then(ctr => cb(null, ctr)),
      addClaimKey: ['ctr', (res, cb) => {
        res.ctr.addKey(claimKey, CLAIM_PURPOSE, ECDSA_TYPE).then(() => cb());
      }],
      executeTx: ['ctr', 'addClaimKey', (res, cb) => {
        res.ctr.execute(owner, web3.toWei(1, 'ether'), '0x0', {from: accounts[1]})
          .then(() => {
            assert.fail('Claim key can execute transaction');
          })
          .catch(() => cb());
      }]
    }, done);
  });

  it('key\'s type should be conserved after key removal', (done) => {
    const key = addrToKey(accounts[1]);
    async.auto({
      ctr: (cb) => Identity.new({from: owner}).then(ctr => cb(null, ctr)),
      addManagementKey: ['ctr', (res, cb) => {
        res.ctr.addKey(key, MANAGEMENT_PURPOSE, ECDSA_TYPE).then(() => cb());
      }],
      addActionKey: ['ctr', (res, cb) => {
        res.ctr.addKey(key, ACTION_PURPOSE, ECDSA_TYPE).then(() => cb());
      }],
      getManagementKeyTypeBeforeRemoval: ['ctr', 'addManagementKey', 'addActionKey', (res, cb) => {
        res.ctr.getKey(key, MANAGEMENT_PURPOSE).then(key => cb(null, key));
      }],
      removeActionKey: ['ctr', 'getManagementKeyTypeBeforeRemoval', (res, cb) => {
        res.ctr.removeKey(key, ACTION_PURPOSE, {from: owner}).then(() => cb());
      }],
      getManagementKeyTypeAfterRemoval: ['ctr', 'removeActionKey', (res, cb) => {
        res.ctr.getKey(key, MANAGEMENT_PURPOSE).then(key => cb(null, key));
      }]
    }, (err, res) => {
      assert.isTrue(res.getManagementKeyTypeBeforeRemoval[1].equals(res.getManagementKeyTypeAfterRemoval[1]), 'Key type has changed');
      return done();
    });
  });

  it.only('allow payment key to make payment', (done) => {
    const managementKey = addrToKey(accounts[3]);
    const pspKey = addrToKey(accounts[4]);

    const targetAccount = accounts[2];
    const initialBalance = web3.eth.getBalance(targetAccount);

    async.auto({
      ctr: (cb) => Identity.new({from: owner}).then(ctr => cb(null, ctr)),
      deposit: ['ctr', (res, cb) => {
        res.ctr.deposit({from: owner, value: web3.toWei(1, 'ether')}).then(() => cb());
      }],
      addPaymentKey: ['ctr', (res, cb) => {
        res.ctr.addKey(pspKey, ALLOW_PAYMENT_PURPOSE, ECDSA_TYPE).then(() => cb());
      }],
      getPaymentKeys: ['ctr','addPaymentKey', (res, cb) => {
        res.ctr.getKeysByPurpose(ALLOW_PAYMENT_PURPOSE).then(keys => cb(null, keys));
      }],
      executePaymentTx: ['ctr', 'deposit', 'addPaymentKey', (res, cb) => {
        res.ctr.executePayment(targetAccount, web3.toWei(1, 'ether'), {from: accounts[4]}).then(() => {
          const diff = web3.eth.getBalance(targetAccount).minus(initialBalance);
          assert.isTrue(diff.equals(web3.toWei(1, 'ether')), 'Transaction not executed');
          cb();
        })
      }],
      executePaymentNotAllowTx: ['ctr', 'deposit', 'addPaymentKey', 'executePaymentTx',(res, cb) => {
        res.ctr.executePayment(targetAccount, web3.toWei(1, 'ether'), {from: accounts[4]}).then(
          () => {
            assert.fail('not allowed key can execute transaction');
        })
        .catch(() => cb());
      }]
    }, (err, res) => {
      assert.isOk(res.getPaymentKeys.find(key => key === pspKey), 'Cannot find PAYMENT key');
      return done();
    });
  })

  it('allow payment key to make payment from a PSP_Identity contract', (done) => {
    const managementKey = addrToKey(accounts[0]);
    // const pspKey = addrToKey(accounts[4]);

    const targetAccount = accounts[3];
    const initialBalance = web3.eth.getBalance(targetAccount);

    async.auto({
      ctr: (cb) => Identity.new({from: owner}).then(ctr => cb(null, ctr)),
      pspCtr: (cb) => PSP_Identity.new({from: accounts[2]}).then(pspCtr => cb(null, pspCtr)),
      deposit: ['ctr', (res, cb) => {
        res.ctr.deposit({from: owner, value: web3.toWei(10, 'ether')}).then(() => cb());
      }],
      addPaymentKey: ['ctr','pspCtr', (res, cb) => {
        const pspKey = addrToKey(res.pspCtr.address);
        res.ctr.addKey(pspKey, ALLOW_PAYMENT_PURPOSE, ECDSA_TYPE).then(() => cb());
      }],
      getPaymentKeys: ['ctr','addPaymentKey', (res, cb) => {
        res.ctr.getKeysByPurpose(ALLOW_PAYMENT_PURPOSE).then(keys => cb(null, keys));
      }],
      executePaymentTx: ['ctr', 'deposit', 'addPaymentKey', 'pspCtr', (res, cb) => {
        console.log(res.ctr.address, res.pspCtr.address, web3.toWei(1, 'ether'));
        res.pspCtr.requestPayment(res.ctr.address,targetAccount, web3.toWei(1, 'ether'),"0x746f756368e9", {from: accounts[2]}).then(() => {
          const diff = web3.eth.getBalance(targetAccount).minus(initialBalance);
          assert.isTrue(diff.equals(web3.toWei(1, 'ether')), 'Transaction not executed');
          cb();
        })
      }],
      executePaymentTooBig: ['ctr', 'deposit', 'addPaymentKey', 'pspCtr','executePaymentTx', (res, cb) => {
        res.pspCtr.requestPayment(res.ctr.address,targetAccount, web3.toWei(100, 'ether'),"0x746f756368e9", {from: accounts[2]}).then(() => {
          assert(false,'Transaction should has been reverted -- not enough fund');
        })
          .catch(() => cb());
      }]
    }, (err, res) => {
      const pspKey = addrToKey(res.pspCtr.address);
      assert.isOk(res.getPaymentKeys.find(key => key === pspKey), 'Cannot find PAYMENT key');
      return done();
    });
  })


});

//.catch(() => cb());
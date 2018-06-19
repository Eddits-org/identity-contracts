const async = require('async');

const Identity = artifacts.require('Identity');

const MANAGEMENT_PURPOSE = 1;
const ACTION_PURPOSE = 2;
const CLAIM_PURPOSE = 3;
const ENCRYPTION_PURPOSE = 4;

const ECDSA_TYPE = 1;
const RSA_TYPE = 2;

const addrToKey = addr => '0x'+web3.padLeft(addr.substring(2), 64);

contract('Identity', (accounts) => {

  const owner = accounts[0];
  const claimSigner = accounts[1];

  it('claim signer can add claim', (done) => {
    async.auto({
      ctr: (cb) => Identity.new({from: owner}).then(ctr => cb(null, ctr)),
      addClaimKey: ['ctr', (res, cb) => {        
        res.ctr.addKey(addrToKey(claimSigner), CLAIM_PURPOSE, ECDSA_TYPE).then(() => cb());
      }],
      addClaim: ['ctr', 'addClaimKey', (res, cb) => {
        res.ctr.addClaim(1, 2, claimSigner, '0x12', '0x34', 'http://testclaim', {from: claimSigner}).then(() => cb());
      }],
      getClaimId: ['ctr', 'addClaim', (res, cb) => {
        res.ctr.getClaimIdsByTopic(1).then((ids) => cb(null, ids));
      }],
      getClaim: ['ctr', 'getClaimId', (res, cb) => {
        res.ctr.getClaim(res.getClaimId[0]).then(claim => cb(null, claim));
      }]
    },(err, res) => {
      assert.equal(res.getClaimId.length, 1, 'Invalid number of claims for type 1');
      assert.equal(res.getClaimId[0], '0xb64bcaf657d462875970da9457568a9c3739e18b6baf1472a75dd4af36319302', 'Invalid claim id');
      assert.equal(res.getClaim[0], 1, 'Invalid claim type');
      assert.equal(res.getClaim[1], 2, 'Invalid claim scheme');
      assert.equal(res.getClaim[2], claimSigner, 'Invalid claim issuer');
      assert.equal(res.getClaim[3], '0x12', 'Invalid claim signature');
      assert.equal(res.getClaim[4], '0x34', 'Invalid claim data');
      assert.equal(res.getClaim[5], 'http://testclaim', 'Invalid claim uri');
      done();
    });
  });

  it('non claim signer cannot add claim', (done) => {
    async.auto({
      ctr: (cb) => Identity.new({from: owner}).then(ctr => cb(null, ctr)),
      addClaim: ['ctr', (res, cb) => {
        res.ctr.addClaim(1, 2, claimSigner, '0x12', '0x34', 'http://testclaim', {from: owner})
          .then(() => {
            assert.fail('Non claim signer can add claim');
          })
          .catch(() => cb());
      }],
      getClaimId: ['ctr', 'addClaim', (res, cb) => {
        res.ctr.getClaimIdsByTopic(1).then((ids) => cb(null, ids));
      }]
    },(err, res) => {
      assert.equal(res.getClaimId.length, 0, 'Invalid number of claims for type 1');
      done();
    });
  });

  it('claim signer can remove claim', (done) => {
    async.auto({
      ctr: (cb) => Identity.new({from: owner}).then(ctr => cb(null, ctr)),
      addClaimKey: ['ctr', (res, cb) => {        
        res.ctr.addKey(addrToKey(claimSigner), CLAIM_PURPOSE, ECDSA_TYPE).then(() => cb());
      }],
      addClaim: ['ctr', 'addClaimKey', (res, cb) => {
        res.ctr.addClaim(1, 2, claimSigner, '0x12', '0x34', 'http://testclaim', {from: claimSigner}).then(() => cb());
      }],
      getClaimId: ['ctr', 'addClaim', (res, cb) => {
        res.ctr.getClaimIdsByTopic(1).then((ids) => cb(null, ids));
      }],
      removeClaim: ['ctr', 'getClaimId', (res, cb) => {
        res.ctr.removeClaim(res.getClaimId[0], {from: claimSigner}).then(() => cb());
      }],
      getClaimIdAfterRemove: ['ctr', 'removeClaim', (res, cb) => {
        res.ctr.getClaimIdsByTopic(1).then((ids) => cb(null, ids));
      }],
      getClaim: ['ctr', 'removeClaim', 'getClaimId', (res, cb) => {
        res.ctr.getClaim(res.getClaimId[0]).then((claim) => cb(null, claim));
      }]
    },(err, res) => {
      assert.equal(res.getClaimId.length, 1, 'Invalid number of claims for type 1 before remove');
      assert.equal(res.getClaimIdAfterRemove.length, 0, 'Invalid number of claims for type 1 after remove');
      assert.isTrue(res.getClaim[0].equals(0), 'Invalid claim id after remove');
      done();
    });
  });

  it('management key can remove claim', (done) => {
    const management = accounts[2];

    async.auto({
      ctr: (cb) => Identity.new({from: owner}).then(ctr => cb(null, ctr)),
      addClaimKey: ['ctr', (res, cb) => {        
        res.ctr.addKey(addrToKey(claimSigner), CLAIM_PURPOSE, ECDSA_TYPE).then(() => cb());
      }],
      addManagementKey: ['ctr', (res, cb) => {
        res.ctr.addKey(addrToKey(management), MANAGEMENT_PURPOSE, ECDSA_TYPE).then(() => cb());
      }],
      addClaim: ['ctr', 'addClaimKey', (res, cb) => {
        res.ctr.addClaim(1, 2, claimSigner, '0x12', '0x34', 'http://testclaim', {from: claimSigner}).then(() => cb());
      }],
      getClaimId: ['ctr', 'addClaim', (res, cb) => {
        res.ctr.getClaimIdsByTopic(1).then((ids) => cb(null, ids));
      }],
      removeClaim: ['ctr', 'getClaimId','addManagementKey', (res, cb) => {
        res.ctr.removeClaim(res.getClaimId[0], {from: management}).then(() => cb());
      }],
      getClaimIdAfterRemove: ['ctr', 'removeClaim', (res, cb) => {
        res.ctr.getClaimIdsByTopic(1).then((ids) => cb(null, ids));
      }]
    },(err, res) => {
      assert.equal(res.getClaimIdAfterRemove.length, 0, 'Invalid number of claims for type 1 after remove');
      done();
    });
  });

  it('non claim signer or management key cannot remove claim', (done) => {

    async.auto({
      ctr: (cb) => Identity.new({from: owner}).then(ctr => cb(null, ctr)),
      addClaimKey: ['ctr', (res, cb) => {        
        res.ctr.addKey(addrToKey(claimSigner), CLAIM_PURPOSE, ECDSA_TYPE).then(() => cb());
      }],
      addClaim: ['ctr', 'addClaimKey', (res, cb) => {
        res.ctr.addClaim(1, 2, claimSigner, '0x12', '0x34', 'http://testclaim', {from: claimSigner}).then(() => cb());
      }],
      getClaimId: ['ctr', 'addClaim', (res, cb) => {
        res.ctr.getClaimIdsByTopic(1).then((ids) => cb(null, ids));
      }],
      removeClaim: ['ctr', 'getClaimId', (res, cb) => {
        res.ctr.removeClaim(res.getClaimId[0], {from: accounts[2]})
          .then(() => {
            assert.fail('Non claim signer or management key can remove claim');
          })
          .catch(() => cb());
      }],
      getClaimIdAfterRemove: ['ctr', 'removeClaim', (res, cb) => {
        res.ctr.getClaimIdsByTopic(1).then((ids) => cb(null, ids));
      }]
    },(err, res) => {
      assert.equal(res.getClaimIdAfterRemove.length, 1, 'Invalid number of claims for type 1 after remove');
      done();
    });
  });

});

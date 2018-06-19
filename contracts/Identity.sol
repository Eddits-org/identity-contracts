pragma solidity ^0.4.24;

import "./ERC725.sol";
import "./ERC735.sol";

contract Identity is ERC725, ERC735 {

  event Debug(bytes32 key);

  mapping (bytes32 => uint256) keysType;
  mapping (bytes32 => mapping (uint256 => bool)) keysPurposes;
  mapping (bytes32 => uint256[]) keysPurposesArr;
  mapping (uint256 => bytes32[]) keysByPurpose;
  mapping (uint256 => Transaction) transactions;
  mapping (bytes32 => Claim) claims;
  mapping (uint256 => bytes32[]) claimsByTopic;
  
  uint nonce = 0;
  
  struct Transaction {
    address to;
    uint value;
    bytes data;
    uint nonce;
  }

  modifier isManager {
    require(keysPurposes[bytes32(msg.sender)][MANAGEMENT_PURPOSE]);
    _;
  }

  modifier isManagerOrSelf {
    require(keysPurposes[bytes32(msg.sender)][MANAGEMENT_PURPOSE] || msg.sender == address(this));
    _;
  }

  modifier isClaimSigner {
    require(keysPurposes[bytes32(msg.sender)][CLAIM_PURPOSE]);
    _;
  }

  constructor() public {
    _addKey(bytes32(msg.sender), MANAGEMENT_PURPOSE, ECDSA_TYPE);
  }

  function getKey(bytes32 _key, uint256 _purpose) public constant returns(uint256 purpose, uint256 kType, bytes32 key) {    
    if (keysPurposes[_key][_purpose]) {
      kType = keysType[_key];
      key = _key;
      purpose = _purpose;
    }
  }

  function getKeyPurpose(bytes32 _key) public constant returns(uint256[]) {    
    return keysPurposesArr[_key];
  }

  function getKeysByPurpose(uint256 _purpose) public constant returns(bytes32[]) {
    return keysByPurpose[_purpose];
  }

  function addKey(bytes32 _key, uint256 _purpose, uint256 _type) isManagerOrSelf  public returns (bool) {
    return _addKey(_key, _purpose, _type);
  }

  function _addKey(bytes32 _key, uint256 _purpose, uint256 _type) internal returns (bool) {
    require(!keysPurposes[_key][_purpose]);
    emit KeyAdded(_key, _purpose, _type);
    keysType[_key] = _type;
    keysPurposes[_key][_purpose] = true;
    keysPurposesArr[_key].push(_purpose);
    keysByPurpose[_purpose].push(_key);
    return true;
  }

  function removeKey(bytes32 _key, uint256 _purpose) isManagerOrSelf public returns (bool) {
    emit KeyRemoved(_key, _purpose, keysType[_key]);
    keysPurposes[_key][_purpose] = false;
    // Remove from keysByPurpose
    bytes32[] storage keys = keysByPurpose[_purpose];
    for (uint i = 0; i < keys.length; i++) {      
      if (keys[i] == _key) {
        keys[i] = keys[keys.length - 1];
        delete keys[keys.length - 1];
        keys.length--;
      }
    }
    // Remove from keysPurposesArr
    uint256[] storage purposes = keysPurposesArr[_key];
    for (uint j = 0; j < purposes.length; j++) {      
      if (purposes[j] == _purpose) {
        purposes[j] = purposes[purposes.length - 1];
        delete purposes[purposes.length - 1];
        purposes.length--;
      }
    }
    if (purposes.length == 0) {
      delete keysType[_key];
    }
    return true;
  }

  function execute(address _to, uint256 _value, bytes _data) public returns (uint256 executionId) {
      require(keysPurposes[bytes32(msg.sender)][MANAGEMENT_PURPOSE] || keysPurposes[bytes32(msg.sender)][ACTION_PURPOSE]);
      executionId = uint256(keccak256(abi.encodePacked(_to, _value, _data, nonce)));
      emit ExecutionRequested(executionId, _to, _value, _data);
      transactions[executionId] = Transaction ({
        to: _to,
        value: _value,
        data: _data,
        nonce: nonce
      });
      if (keysPurposes[bytes32(msg.sender)][MANAGEMENT_PURPOSE]) {
        approve(executionId, true);
      }
  }

  function approve(uint256 _id, bool _approve) isManager public returns (bool success) {
    require(transactions[_id].nonce == nonce);
    nonce++;
    if (_approve) {
      success = transactions[_id].to.call.value(transactions[_id].value)(transactions[_id].data);
    } 
  }

  function deposit () public payable {}

  function addClaim(uint256 _topic, uint256 _scheme, address _issuer, bytes _signature, bytes _data, string _uri) isClaimSigner public returns (uint256 requestId) {
    bytes32 claimId = keccak256(abi.encodePacked(_issuer, _topic));
    if (claims[claimId].topic > 0) {
      emit ClaimChanged(claimId, _topic, _scheme, _issuer, _signature, _data, _uri);
    } else {
      emit ClaimAdded(claimId, _topic, _scheme, _issuer, _signature, _data, _uri);
    }
    claims[claimId] = Claim({
      topic: _topic,
      scheme: _scheme,
      issuer: _issuer,
      signature: _signature,
      data: _data,
      uri: _uri
    });
    claimsByTopic[_topic].push(claimId);
  }

  function getClaim(bytes32 _claimId) public constant returns(uint256 topic, uint256 scheme, address issuer, bytes signature, bytes data, string uri) {
    Claim memory claim = claims[_claimId];
    if (claim.topic > 0) {
      topic = claim.topic;
      scheme = claim.scheme;
      issuer = claim.issuer;
      signature = claim.signature;
      data = claim.data;
      uri = claim.uri;
    }
  }

  function getClaimIdsByTopic(uint256 _topic) public constant returns(bytes32[] claimIds) {
    return claimsByTopic[_topic];
  }


  function removeClaim(bytes32 _claimId) public returns (bool success) {
    Claim memory claim = claims[_claimId];
    require(msg.sender == claim.issuer || keysPurposes[bytes32(msg.sender)][MANAGEMENT_PURPOSE] || msg.sender == address(this));
    bytes32[] storage claimsTypeArr = claimsByTopic[claim.topic];
    for (uint i = 0; i < claimsTypeArr.length; i++) {      
      if (claimsTypeArr[i] == _claimId) {
        claimsTypeArr[i] = claimsTypeArr[claimsTypeArr.length - 1];
        delete claimsTypeArr[claimsTypeArr.length - 1];
        claimsTypeArr.length--;
      }
    }
    delete claims[_claimId];
    emit ClaimRemoved(_claimId, claim.topic, claim.scheme, claim.issuer, claim.signature, claim.data, claim.uri);
    return true;
  }

}

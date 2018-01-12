pragma solidity ^0.4.17;

contract ERC725 {

  uint256 constant MANAGEMENT_PURPOSE = 1;
  uint256 constant ACTION_PURPOSE = 2;
  uint256 constant CLAIM_PURPOSE = 3;
  uint256 constant ENCRYPTION_PURPOSE = 4;

  uint256 constant ECDSA_TYPE = 1;
  uint256 constant RSA_TYPE = 2;

  event KeyAdded(bytes32 indexed key, uint256 indexed purpose, uint256 indexed kType);
  event KeyRemoved(bytes32 indexed key, uint256 indexed purpose, uint256 indexed kType);
  event ExecutionRequested(uint256 indexed executionId, address indexed to, uint256 indexed value, bytes data);
  event Executed(uint256 indexed executionId, address indexed to, uint256 indexed value, bytes data);
  event Approved(uint256 indexed executionId, bool approved);

  function getKey(bytes32 _key, uint256 _purpose) public constant returns(uint256 purpose, uint256 kType, bytes32 key);
  function getKeyPurpose(bytes32 _key) public constant returns(uint256[] purposes);
  function getKeysByPurpose(uint256 _purpose) public constant returns(bytes32[] keys);
  function addKey(bytes32 _key, uint256 _purpose, uint256 _type) public returns (bool success);
  function removeKey(bytes32 _key, uint256 _purpose) public returns (bool success);
  function execute(address _to, uint256 _value, bytes _data) public returns (uint256 executionId);
  function approve(uint256 _id, bool _approve) public returns (bool success);

}
pragma solidity ^0.4.24;

import "./ERC725.sol";
import "./Identity.sol";

contract PSP_Identity is ERC725, Payment {

    event Debug(bytes32 key);

    mapping (bytes32 => uint256) keysType;
    mapping (bytes32 => mapping (uint256 => bool)) keysPurposes;
    mapping (bytes32 => uint256[]) keysPurposesArr;
    mapping (uint256 => bytes32[]) keysByPurpose;
    mapping (uint256 => Transaction) transactions;

    bytes32 psp_name;
    uint256 constant ALLOW_PAYMENT_PURPOSE = 101;

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

    function collectFees() public {

    }

    function requestPayment(address from, address to, uint value, bytes32 proof) public {
        require(verifyProof(proof));
        Identity customer = Identity(from);

        (uint256 purpose, uint256 kType, bytes32 key) = customer.getKey( bytes32(address(this)), ALLOW_PAYMENT_PURPOSE );
        require(purpose == ALLOW_PAYMENT_PURPOSE);

        customer.executePayment(to, value);
    }

    function verifyProof(bytes32 proof) internal returns (bool success) {
        return true;
    }

}

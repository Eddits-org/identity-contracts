pragma solidity ^0.4.24;

contract U2FKeyHolder {

    struct U2FKey {
        string label;
        bytes att;
    }

    event U2FKeyAdded(string label, bytes att);

    mapping (bytes32 => U2FKey) u2f_keys;
    bytes32[] u2f_keys_id;
    

    function _addU2FKey(bytes memory _rawId, string memory _label, bytes memory _att) internal {
        bytes32 id = keccak256(abi.encodePacked(_rawId));
        u2f_keys[id] = U2FKey({
            label: _label,
            att: _att
        });
        u2f_keys_id.push(id);
    }

    function _removeU2FKey(bytes32 _id) internal {
        u2f_keys[_id] = U2FKey({
            label: "",
            att: hex"00"
        });
        for (uint i = 0; i < u2f_keys_id.length; i++) {      
            if (u2f_keys_id[i] == _id) {
                u2f_keys_id[i] = u2f_keys_id[u2f_keys_id.length - 1];
                delete u2f_keys_id[u2f_keys_id.length - 1];
                u2f_keys_id.length--;
            }
        }
    }

    function getU2FKey(bytes32 _id) public view returns(string memory label, bytes memory att) {
        U2FKey storage key = u2f_keys[_id];
        label = key.label;
        att = key.att;
    }

    function getU2FKeyIds() public view returns(bytes32[] memory) {
        return u2f_keys_id;
    }

}
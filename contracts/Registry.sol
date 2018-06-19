pragma solidity ^0.4.24;


contract PSPRegistry {

    event PSPAdded(string psp_name, address psp_address);

    address public owner;
    mapping (bytes32 => address) nameToAddress;    // mapping from psp name to psp ERC 725 contract address
    string[] public registeredPSP;

    modifier onlyOwner {
        require(msg.sender == owner);
        _;
    }

    constructor() public {
        owner = msg.sender;
    }

    function getPSPAddress(string psp_name) public view returns (address psp_address) {
        return nameToAddress[keccak256(abi.encodePacked(psp_name))];
    }

    function registerPSP(string psp_name, address psp_address) onlyOwner public {
        nameToAddress[keccak256(abi.encodePacked(psp_name))] = psp_address;
        registeredPSP.push(psp_name);

        emit PSPAdded(psp_name, psp_address);
    }
}

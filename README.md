# EDAS - Smart Contracts

Ethereum Decentralized Authentication Services is a Proof-Of-Concept around an authentication solution based on Ethereum blockchain, ECDSA keys and ERC 725 & 735.

This repository contains contracts code for the PoC.

## Contracts

### Identity

`Identity` is the main Smart Contract, which holds the identity of the end user.  
Based on [ERC725](https://github.com/ethereum/EIPs/issues/725) for the keys management, and [ERC735](https://github.com/ethereum/EIPs/issues/735) about claims holder.


## TODO

* Code review for `Identity` contract
* Integration of [DSSCertifier](https://gitlab.intech.lu/ID/eth-pki-certifier-contracts/blob/master/contracts/DSSCertifier.sol) to issue claims based on DSS Signature from a LuxTrust device
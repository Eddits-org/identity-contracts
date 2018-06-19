# June 2018


- v0.1 psp key
  - Created registry contract
  - Created PSP_Identity contract
  - Added executePayment to Identity ☢️ double check right needed
  - Updated tests

- Updated to solc 0.4.24
  - constructor changed
  - emit key word added when dispatching an event
  - using abi.encodePacked() when hashing see https://github.com/ethereum/solidity/issues/3955

- Updated ERC735 to follow last changes.
  - `claimType` changed to `topic`
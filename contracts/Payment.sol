pragma solidity ^0.4.24;

import "./ERC725.sol";

contract Payment is ERC725 {

    uint256 constant ALLOW_PAYMENT_PURPOSE = 101; // 101 in hope that no standard will take this

    event PaymentMade(uint at, address from, address to, uint256 amount);
}
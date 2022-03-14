// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.7;

contract Airlines {

    address chairperson;
    struct details {
        uint escrow; // deposit for payment settlement
        uint status;
        uint hashOfDetails;
    }

    mapping (address=>details) public balanceDetails;
    mapping (address=>uint) membership;

    modifier onlyChairPerson {
        require(msg.sender == chairperson);
        _;
    }

    modifier onlyMember {
        require(msg.sender == 1);
        _;
    }

    constructor () public payable {
        chairperson = msg.sender;
        membership[msg.sender] = 1;
        balanceDetails[msg.sender].escrow = msg.value;
    }
}

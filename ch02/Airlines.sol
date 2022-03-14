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

    function register() public payable {
        address AirlineA = msg.sender;
        membership[AirlineA] = 1;
        balanceDetails[msg.sender].escrow = msg.value;
    }

    function unregister(address payable AirlineZ) onlyChairPerson public {
        if (chairperson != msg.sender) {
            revert();
        }

        membership[AirlineZ] = 0;
        AirlineZ.transfer(balanceDetails[AirlineZ].escrow);
        balanceDetails[AirlineZ].escrow = 0;
    }

    function request(address toAirline, uint hashOfDetails) onlyMember public {
        if (membership[toAirline] != 1) {
            revert();
        }

        balanceDetails[msg.sender].status = 0;
        balanceDetails[msg.sender].hashOfDetails = hashOfDetails;
    }

    function response(address fromAirline, uint hashOfDetails, uint done) onlyMember public {
        if (membership[fromAirline] != 1) {
            revert();
        }

        balanceDetails[msg.sender].status = done;
        balanceDetails[fromAirline].hashOfDetails = hashOfDetails;
    }

    function settlePayment(address payable toAirline) onlyMember payable public {

        address fromAirline = msg.sender;
        uint amt = msg.value;
        if (balanceDetails[fromAirline].escrow < amt) {
            revert();
        }
        balanceDetails[toAirline].escrow += amt;
        balanceDetails[fromAirline].escrow -= amt;
        toAirline.transfer(amt);
    }
}

// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

contract BlindAuction {

    struct Bid {
        bytes32 blindedBid;
        uint deposit;
    }

    enum Phase {
        Init, Bidding, Reveal, Done
    }

    uint private constant ETH = 1000000000000000000;
    address public beneficiary;
    address public highestBidder;
    uint public highestBid = 0;
    mapping(address => Bid) public bids;
    mapping(address => uint) pendingReturns;
    Phase public currentPhase = Phase.Init;

    event AuctionEnded(address winner, uint highestBid);
    event BiddingStarted();
    event RevealStarted();
    event AuctionInit();

    modifier validPhase(Phase phase) {
        require(currentPhase == phase, 'phaseError');
        _;
    }

    modifier onlyBeneficiary() {
        require(msg.sender == beneficiary, 'onlyBeneficiary');
        _;
    }

    constructor() {
        beneficiary = msg.sender;
    }

    function advancePhase() public onlyBeneficiary {
        if (currentPhase == Phase.Done) {
            currentPhase = Phase.Init;
        } else {
            uint nextPhase = uint(currentPhase) + 1;
            currentPhase = Phase(nextPhase);
        }

        if (currentPhase == Phase.Reveal) {
            emit RevealStarted();
        }

        if (currentPhase == Phase.Bidding) {
            emit BiddingStarted();
        }

        if (currentPhase == Phase.Init) {
            emit AuctionInit();
        }
    }

    function bid(bytes32 blindBid) public payable validPhase(Phase.Bidding) {
        require(msg.sender != beneficiary, 'beneficiaryBid');

        bids[msg.sender] = Bid({
        blindedBid: blindBid, deposit: msg.value});
    }

    function reveal(uint value, bytes32 secret) public validPhase(Phase.Reveal) {
        require(msg.sender != beneficiary, 'beneficiaryReveal');

        uint refund = 0;
        Bid storage bidToCheck = bids[msg.sender];

        if (bidToCheck.blindedBid == keccak256(abi.encodePacked(value, secret))) {
            refund += bidToCheck.deposit;
            if (bidToCheck.deposit >= value * ETH && placeBid(msg.sender, value * ETH)) {
                refund -= value * ETH;
            }
        }
        payable(msg.sender).transfer(refund);
    }

    function placeBid(address bidder, uint value) internal returns (bool success){
        if (value <= highestBid) {
            return false;
        }
        if (highestBidder != address(0)) {
            pendingReturns[highestBidder] += highestBid;
        }
        highestBid = value;
        highestBidder = bidder;
        return true;
    }

    function withdraw() public {
        uint amount = pendingReturns[msg.sender];
        if (amount > 0) {
            pendingReturns[msg.sender] = 0;
            payable(msg.sender).transfer(amount);
        }
    }

    function auctionEnd() public validPhase(Phase.Done) {
        if(address(this).balance >= highestBid){
            payable(beneficiary).transfer(highestBid);
        }
        emit AuctionEnded(highestBidder, highestBid);
    }

    function closeAuction() public onlyBeneficiary {
        selfdestruct(payable(beneficiary));
    }
}

pragma solidity >=0.4.22 <=0.6.0;

contract BlindAuction {

    struct Bid {
        bytes32 blindedBid;
        uint deposit;
    }

    enum Phase {
        Init, Bidding, Reveal, Done
    }

    address payable beneficiary;
    address public highestBidder;
    uint public highestBid = 0;
    mapping(address => Bid) bids;
    mapping(address => uint) pendingReturns;
    Phase public currentPhase = Phase.Init;

    event AuctionEnded(address winner, uint highestBid);
    event BiddingStarted();
    event RevealStarted ();
    event AuctionInit();

    modifier validPhase(Phase phase) {
        require(currentPhase == phase);
        _;
    }

    modifier onlyBeneficiary() {
        require(msg.sender == beneficiary, "Only beneficiary can perform this action");
        _;
    }

    constructor() public {
        beneficiary = msg.sender;
        advancePhase();
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
        bids[msg.sender] = Bid({
            blindedBid : blindBid,
            deposit : msg.value
        });
    }

    function reveal(uint value, bytes32 secret) public validPhase(Phase.Reveal) {
        uint refund = 0;
        Bid storage bidToCheck = bids[msg.sender];
        require(bidToCheck.blindedBid == keccak256(abi.encodePacked(value, secret)), "not matching bid");
        refund += bidToCheck.deposit;

        if (bidToCheck.deposit >= value) {
            if (placeBid(msg.sender, value)) {
                refund -= value;
            }
        }

        msg.sender.transfer(refund);
    }

    function placeBid(address bidder, uint value) internal returns (bool success) {
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
            msg.sender.transfer(amount);
        }
    }

    function auctionEnd() public validPhase(Phase.Done) {
        beneficiary.transfer(highestBid);

        emit AuctionEnded(highestBidder, highestBid);
    }
}

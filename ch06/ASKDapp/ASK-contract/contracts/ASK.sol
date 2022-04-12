pragma solidity >=0.4.22 <=0.6.0;

contract Airlines {

    address chairperson;

    struct reqStruc {
        uint reqID;
        uint fID;
        uint numSeats;
        uint passengerID;
        address toAirline;
    }

    struct respStruc {
        uint reqID;
        bool status;
        address fromAirline;
    }

    mapping(address => uint) public escrow;
    mapping(address => uint) membership;
    mapping(address => reqStruc) reqs;
    mapping(address => respStruc) reps;
    mapping(address => uint) settledReqID;
    uint private constant ETH = 1000000000000000000;

    modifier onlyChairperson {
        require(msg.sender == chairperson);
        _;
    }

    modifier onlyMember {
        require(membership[msg.sender] == 1);
        _;
    }

    constructor () public payable {
        chairperson = msg.sender;
        membership[msg.sender] = 1;
        escrow[msg.sender] = msg.value;
    }

    function register() public payable {
        address AirlineA = msg.sender;
        membership[AirlineA] = 1;
        escrow[AirlineA] = msg.value;
    }

    function unregister(address payable AirlineZ) onlyChairperson public {
        membership[AirlineZ] = 0;
        AirlineZ.transfer(escrow[AirlineZ]);
        escrow[AirlineZ] = 0;
    }


    function ASKrequest(uint reqID, uint flightID, uint numSeats, uint custID, address toAirline) onlyMember public {
        reqs[msg.sender] = reqStruc(reqID, flightID, numSeats, custID, toAirline);
    }

    function ASKresponse(uint reqID, bool success, address fromAirline) onlyMember public {
        reps[msg.sender] = respStruc(reqID, success, fromAirline);
    }

    function settlePayment(uint reqID, address payable toAirline, uint numSeats) onlyMember payable public {
        address fromAirline = msg.sender;

        escrow[toAirline] = escrow[toAirline] + numSeats * ETH;
        escrow[fromAirline] = escrow[fromAirline] - numSeats * ETH;

        settledReqID[fromAirline] = reqID;
    }

    function replenishEscrow() payable public {
        escrow[msg.sender] = escrow[msg.sender] + msg.value;
    }
}
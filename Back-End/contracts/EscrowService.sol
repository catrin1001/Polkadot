//SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/AccessControl.sol";

 

contract EscrowService is AccessControl { //Ownable,

    bytes32 public constant AGENT_ROLE = keccak256("AGENT_ROLE");
    bytes32 public constant SENDER_ROLE = keccak256("SENDER_ROLE");
    bytes32 public constant RECEIVER_ROLE  = keccak256("RECEIVER_ROLE");

    address public vault;
    address payable public agent;
    address payable public sender;
    address payable public receiver;

    uint256 public price;
    uint256 public fee;
    enum Status { REGISTER, DEPOSITED,CLAIM, DECLINE, ACCEPTED }
    Status public status;
    uint256 public lockTime;
    uint256 public balance;
    uint256 public start;

    event Constrcuted(
        uint256 when,
        uint256 till
    );
   
    constructor(address payable _sender_address, address payable _receiver_address, uint32 _price, uint256 _lockTime) {
     
        status = Status.REGISTER;
        vault = address(this);
        agent = payable(msg.sender);
        sender = _sender_address;
        lockTime = _lockTime; // in seconds
        receiver= _receiver_address;
        price = _price;
        fee = 1;
        start = block.timestamp;
        balance = 0;

        _setupRole(AGENT_ROLE, agent);
        _setupRole(SENDER_ROLE, sender);
        _setupRole(RECEIVER_ROLE, receiver);
        emit Constrcuted(
            block.timestamp,
            lockTime
        );
    }

    function SendPayment() external payable onlyRole(SENDER_ROLE) {
        require (msg.value > fee, "Escrow Agent fee of 1 Ether must be covered!");
        require (msg.value >= price, "Sender should pay at least the minimal price for the products or services.");
        require (status == Status.REGISTER, "This should be the first stage of the negociation!");
        payable(agent).transfer(fee);
        uint256 new_price = price - fee;
        payable(vault).transfer(new_price);
        balance += msg.value;
        status = Status.DEPOSITED; // payment submitted to vault
    }

    receive() external payable {
    }


    function ClaimPayment () public onlyRole(RECEIVER_ROLE) {
        // seller should be able to claim payment only within the timelock period.
        require((block.timestamp < start + lockTime ), "You cannot claim the funds after the timelock period");
        //require (status == Status.REGISTER, "Cannot claim Payment without submission!");
        require (status == Status.DEPOSITED, "Can only claim when in DEPOSITED status!");
        status = Status.CLAIM;  // seller has claimed the payment
    }

    function ConfirmDeliver () payable public onlyRole(SENDER_ROLE) {
        require (status == Status.CLAIM , "Can only confirm delivery after seller has claimed for payment");
        status = Status.ACCEPTED; // sender confirmed the delivery
    }

    function DenyDeliver () public onlyRole(SENDER_ROLE) {
        
        require (status == Status.CLAIM, "Can only deny delivery after seller has claimed for payment");
        require((block.timestamp > start + lockTime), "You cannot deny delivery before the timelock period");
        status = Status.DECLINE ;
    }

    function AgentTransfer () onlyRole(AGENT_ROLE) public {
        if(status == Status.ACCEPTED ){
            receiver.transfer(vault.balance);
            balance = 0;
        }

        else if(status == Status.DECLINE ){
            sender.transfer(vault.balance);
            balance = 0;
        }
    }
}
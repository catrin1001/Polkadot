const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EscrowService Testing", function () {

    this.beforeEach(async function() {
        const EscrowService = await hre.ethers.getContractFactory("EscrowService");
        price = 10;
        [deployer,_sender, _receiver, operator] = await ethers.getSigners();
        escrowService = await EscrowService.deploy(_sender.address,_receiver.address,price,10);
        await escrowService.deployed();
    })

    it("Testing constructor", async function () {

       expect(await escrowService.connect(operator).status()).to.equal(0);
       expect(await escrowService.connect(operator).agent()).to.equal(deployer.address);
       expect(await escrowService.connect(operator).vault()).to.equal(escrowService.deployTransaction.creates);
       expect(await escrowService.connect(operator).sender()).to.equal(_sender.address);
       expect(await escrowService.connect(operator).receiver()).to.equal(_receiver.address);

       var x = await escrowService.connect(operator.address).price();
       expect(ethers.BigNumber.from(x).toString()).to.equal((price).toString());
       expect(await escrowService.connect(operator).hasRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("AGENT_ROLE")),deployer.address)).to.equal(true);
       expect(await escrowService.connect(operator).hasRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("SENDER_ROLE")),_sender.address)).to.equal(true);
       expect(await escrowService.connect(operator).hasRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("RECEIVER_ROLE")),_receiver.address)).to.equal(true);
    });

    it("Testing senderSendPayment()", async function () {    

        await expect ( escrowService.connect(_sender).SendPayment({value: 1})).to.be.revertedWith('Escrow Agent fee of 1 Ether must be covered!');
        await expect ( escrowService.connect(_sender).SendPayment({value: 2})).to.be.revertedWith('Sender should pay at least the minimal price for the products or services.');
        expect (await escrowService.connect(_sender).status()).to.equal(0);
        await escrowService.connect(_sender).SendPayment({value: 11});
        expect (await escrowService.connect(_sender).status()).to.equal(1);
        await expect ( escrowService.connect(_sender).SendPayment({value: 11})).to.be.revertedWith('This should be the first stage of the negociation!');
    });

    it("Testing senderDenyDeliver()", async function () {    

        expect (await escrowService.connect(_sender).status()).to.equal(0);
        await escrowService.connect(_sender).SendPayment({value: 11});
        expect (await escrowService.connect(_sender).status()).to.equal(1);
        
        await expect( escrowService.connect(_sender).DenyDeliver()).to.be.revertedWith('Can only deny delivery after seller has claimed for payment');
        await escrowService.connect(_receiver).ClaimPayment();
        expect (await escrowService.connect(_sender).status()).to.equal(2);
       
        await expect( escrowService.connect(_sender).DenyDeliver()).to.be.revertedWith('You cannot deny delivery before the timelock period');
        
        sleep = milliseconds => new Promise ((resolve) => {setTimeout(resolve, milliseconds)});
        await sleep(11000);           
      
        escrowService.connect(_sender).DenyDeliver();
        expect (await escrowService.connect(_sender).status()).to.equal(3);
        await escrowService.connect(deployer).AgentTransfer();
        expect (await escrowService.connect(deployer).balance()).to.equal(0);
    });
});

describe("EscrowService Testing 2", function () {

    this.beforeEach(async function() {

        const EscrowService = await hre.ethers.getContractFactory("EscrowService");
        price = 10;
        [deployer,_sender, _receiver, operator] = await ethers.getSigners();
        escrowService = await EscrowService.deploy(_sender.address,_receiver.address,price,5);
        await escrowService.deployed();
    })

    it("Testing SellerClaimPayment()", async function () {    

        await expect ( escrowService.connect(_receiver).ClaimPayment()).to.be.revertedWith('Can only claim when in DEPOSITED status!');
        await escrowService.connect(_sender).SendPayment({value: 11});
        await escrowService.connect(_receiver).ClaimPayment();
        sleep = milliseconds => new Promise ((resolve) => {setTimeout(resolve, milliseconds)});
        await sleep(6000);
        await expect ( escrowService.connect(_receiver).ClaimPayment()).to.be.revertedWith('You cannot claim the funds after the timelock period');
    });

    it("Testing senderConfirmDeliver()", async function () {    

        await escrowService.connect(_sender).SendPayment({value: 11});
        await expect( escrowService.connect(_sender).ConfirmDeliver()).to.be.revertedWith('Can only confirm delivery after seller has claimed for payment');
        await escrowService.connect(_receiver).ClaimPayment();
        await escrowService.connect(_sender).ConfirmDeliver();
        expect (await escrowService.connect(_sender).status()).to.equal(4);
        await escrowService.connect(deployer).AgentTransfer();
        expect (await escrowService.connect(deployer).balance()).to.equal(0);
    });

});
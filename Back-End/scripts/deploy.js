async function main() {
  const EscrowService = await hre.ethers.getContractFactory("EscrowService");
  const escrowService = await EscrowService.deploy("0x0DB7B76077441623eaaCE24aeFE32F0967e19436","0x6eEe556dEe7Bfc805e2590DB135325969d7C351b", 15, 30);
  await escrowService .deployed();  
  console.log("EscrowService deployed to:",escrowService.address);
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


 
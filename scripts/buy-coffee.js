const hre = require("hardhat");

// Returns the entire Ethereum balance of a given address
async function getBalance(address) {
  const balanceBigInt = await hre.waffle.provider.getBalance(address);
  return hre.ethers.utils.formatEther(balanceBigInt);
}

// Logs the Ether balances for a list of addresses
async function printBalances(addresses) {
  let idx = 1;
  for (const address of addresses) {
    console.log(`Address ${idx} (${address}) balance: `, await getBalance(address));
    idx++;
  }
}

// Logs the memos stored on-chain from coffee purchases
function printMemos(memos) {
  for (const memo of memos) {
    const timestamp = memo.timestamp;
    const tipper = memo.name;
    const tipperAddress = memo.from;
    const message = memo.message;
    console.log(`At ${timestamp}, ${tipper} (${tipperAddress}) said: ${message}`);
  }
}

async function main() {
  // Get example accounts
  const [owner, tipper, tipper2, tipper3] = await hre.ethers.getSigners();

  // We get the contract to deploy & deploy
  const BuyMeACoffee = await hre.ethers.getContractFactory("BuyMeACoffee");
  const buyMeACoffee = await BuyMeACoffee.deploy();
  await buyMeACoffee.deployed();
  console.log("BuyMeACoffee contract deployed to:", buyMeACoffee.address);

  // Check balances before the coffee purchase
  const addresses = [owner.address, tipper.address, buyMeACoffee.address];
  console.log("== Start ==");
  await printBalances(addresses);

  // Buy the owner a few coffees
  const tip = { value: hre.ethers.utils.parseEther("1") };
  await buyMeACoffee.connect(tipper).buyCoffee("Tommy", "Enjoy your Starbucks!", tip);
  await buyMeACoffee.connect(tipper2).buyCoffee("Jenny", "Here's a little tip!", tip);
  await buyMeACoffee
    .connect(tipper3)
    .buyCoffee("Willis", "You've been working hard and deserve this!", tip);

  // Check balances after coffee purchase
  console.log("== Bought coffee ==");
  await printBalances(addresses);

  // Withdraw funds
  await buyMeACoffee.connect(owner).withdrawTips();

  // Check balance after withdraw
  console.log("== Withdraw funds ==");
  await printBalances(addresses);

  // Read all the memos left for the owner
  console.log("== All memos ==");
  const memos = await buyMeACoffee.connect(owner).getMemos();
  printMemos(memos);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

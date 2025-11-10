import { ethers } from "ethers";
import { network } from "hardhat";

async function main() {
  // Replace with your deployed contract address
  const CONTRACT_ADDRESS = "0x124F95C730c0f999944C1D10Eb25E8a29Dd70676";

  // Connect to the network
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  const [walletClient] = await viem.getWalletClients();

  // Create a provider and signer
  const provider = new ethers.JsonRpcProvider("https://rpc.sepolia-api.lisk.com");
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

  // Get contract instance
  const LiskGarden = new ethers.Contract(CONTRACT_ADDRESS, [
    // Add the ABI here or load from artifacts
    "function plantCounter() view returns (uint256)",
    "function PLANT_PRICE() view returns (uint256)",
    "function plantSeed() payable",
    "function getPlant(uint256) view returns (tuple(uint256 id, address owner, uint8 stage, uint256 waterLevel, bool isAlive))"
  ], signer);

  console.log("LiskGarden contract:", CONTRACT_ADDRESS);
  console.log("");

  // Get plant counter
  const plantCounter = await LiskGarden.plantCounter();
  console.log("Total plants:", plantCounter.toString());

  // Plant a seed (costs 0.001 ETH)
  console.log("\n🌱 Planting a seed...");
  const plantPrice = await LiskGarden.PLANT_PRICE();
  const tx = await LiskGarden.plantSeed({ value: plantPrice });
  await tx.wait();
  console.log("Seed planted! Transaction:", tx.hash);

  // Get new plant ID
  const newPlantCounter = await LiskGarden.plantCounter();
  const plantId = newPlantCounter;
  console.log("Your plant ID:", plantId.toString());

  // Get plant details
  const plant = await LiskGarden.getPlant(plantId);
  console.log("\n🌿 Plant details:");
  console.log("  - ID:", plant.id.toString());
  console.log("  - Owner:", plant.owner);
  console.log("  - Stage:", plant.stage, "(0=SEED, 1=SPROUT, 2=GROWING, 3=BLOOMING)");
  console.log("  - Water Level:", plant.waterLevel.toString());
  console.log("  - Is Alive:", plant.isAlive);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
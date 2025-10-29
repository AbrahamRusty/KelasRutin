import { ethers } from "ethers";

async function main() {
  // Replace with your deployed contract address
  const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  // Get contract instance
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const signer = await provider.getSigner();
  const LiskGarden = new ethers.Contract(CONTRACT_ADDRESS, [
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
  console.log("✅ Seed planted! Transaction:", tx.hash);

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

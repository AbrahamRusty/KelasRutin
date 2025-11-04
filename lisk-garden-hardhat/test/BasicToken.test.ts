import { network } from "hardhat";


async function main() {

  const { viem } = await network.connect();

  // 1. Dapatkan instance viem dan publicClient

  const publicClient = await viem.getPublicClient();
  const [senderClient] = await viem.getWalletClients();

  // Replace with your deployed contract address
  const CONTRACT_ADDRESS = "0x673433b063cB50D0f738E5B557bf03358A2BD8d7";

  // 2. Get contract instance
  const LiskGarden = await viem.getContractAt("LiskGarden", CONTRACT_ADDRESS);

  console.log("LiskGarden contract:", CONTRACT_ADDRESS);
  console.log("Using wallet:", senderClient.account.address);
  console.log("");

  // 3. Get plant counter (menggunakan .read)
  const plantCounter = await LiskGarden.read.plantCounter();
  console.log("Total plants:", plantCounter.toString());

  // 4. Plant a seed (menggunakan .read dan .write)
  console.log("\n🌱 Planting a seed...");
  const plantPrice = await LiskGarden.read.PLANT_PRICE();
  
  // Kirim transaksi menggunakan .write
  const txHash = await LiskGarden.write.plantSeed({ value: plantPrice });
  
  console.log("Transaction sent, waiting for confirmation...", txHash);
  
  // 5. Cara baru untuk menunggu transaksi
  await publicClient.waitForTransactionReceipt({ hash: txHash });
  console.log("✅ Seed planted! Transaction:", txHash);

  // Get new plant ID
  const newPlantCounter = await LiskGarden.read.plantCounter();
  const plantId = newPlantCounter;
  console.log("Your plant ID:", plantId.toString());

  // 6. Get plant details (argumen fungsi read ada di dalam array)
  const plant = await LiskGarden.read.getPlant([plantId]);
  
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
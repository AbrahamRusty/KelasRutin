// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract LiskGarden {
    enum GrowthStage { SEED, SPROUT, GROWING, BLOOMING }

    struct Plant {
        uint256 id;
        address owner;
        bool exists;
        bool isAlive;
        GrowthStage stage;
        uint256 plantedTime;
        uint256 lastWatered;
        uint8 waterLevel;
    }

    mapping(uint256 => Plant) public plants;
    mapping(address => uint256[]) private userPlants;
    uint256 public plantCounter;
    address public owner;

    uint256 public constant PLANT_PRICE = 0.001 ether;
    uint256 public constant HARVEST_REWARD = 0.003 ether;
    uint256 public constant STAGE_DURATION = 1 minutes;
    uint256 public constant WATER_DEPLETION_TIME = 30 seconds;
    uint8  public constant WATER_DEPLETION_RATE = 2; // percent per interval

    event PlantSeeded(address indexed owner, uint256 indexed plantId);
    event PlantWatered(uint256 indexed plantId, uint8 newWaterLevel);
    event PlantHarvested(uint256 indexed plantId, address indexed owner, uint256 reward);
    event StageAdvanced(uint256 indexed plantId, GrowthStage newStage);
    event PlantDied(uint256 indexed plantId);

    constructor() {
        owner = msg.sender;
        plantCounter = 0;
    }

    function plantSeed() external payable returns (uint256) {
        require(msg.value >= PLANT_PRICE, "Not enough ETH to plant");

        plantCounter += 1;
        uint256 newId = plantCounter;

        Plant memory p = Plant({
            id: newId,
            owner: msg.sender,
            exists: true,
            isAlive: true,
            stage: GrowthStage.SEED,
            plantedTime: block.timestamp,
            lastWatered: block.timestamp,
            waterLevel: 100
        });

        plants[newId] = p;
        userPlants[msg.sender].push(newId);

        emit PlantSeeded(msg.sender, newId);
        return newId;
    }

    function calculateWaterLevel(uint256 plantId) public view returns (uint8) {
        Plant storage plant = plants[plantId];
        if (!plant.exists || !plant.isAlive) {
            return 0;
        }

        uint256 elapsed = block.timestamp - plant.lastWatered;
        uint256 intervals = elapsed / WATER_DEPLETION_TIME; 
        uint256 waterLost = intervals * uint256(WATER_DEPLETION_RATE);

        if (waterLost >= plant.waterLevel) {
            return 0;
        } else {
            uint256 newLevel = uint256(plant.waterLevel) - waterLost;
            if (newLevel > 100) return 100; // safety
            return uint8(newLevel);
        }
    }

    function updateWaterLevel(uint256 plantId) internal {
        Plant storage plant = plants[plantId];
        if (!plant.exists || !plant.isAlive) return;

        uint8 current = calculateWaterLevel(plantId);
        plant.waterLevel = current;

        if (current == 0) {
            plant.isAlive = false;
            plant.exists = false; 
            emit PlantDied(plantId);
        }
    }

    function waterPlant(uint256 plantId) external {
        Plant storage plant = plants[plantId];
        require(plant.exists, "Plant does not exist");
        require(plant.owner == msg.sender, "Only owner can water");
        require(plant.isAlive, "Plant is dead");

        updateWaterLevel(plantId);
        require(plant.isAlive, "Plant died before watering");

        plant.waterLevel = 100;
        plant.lastWatered = block.timestamp;

        emit PlantWatered(plantId, plant.waterLevel);

        updatePlantStage(plantId);
    }

    function updatePlantStage(uint256 plantId) public {
        Plant storage plant = plants[plantId];
        if (!plant.exists || !plant.isAlive) return;

        uint256 elapsed = block.timestamp - plant.plantedTime;
        uint256 stageIndex = elapsed / STAGE_DURATION;

        if (stageIndex >= 3) {
            if (plant.stage != GrowthStage.BLOOMING) {
                plant.stage = GrowthStage.BLOOMING;
                emit StageAdvanced(plantId, plant.stage);
            }
            return;
        } else {
            GrowthStage newStage = GrowthStage(uint8(stageIndex));
            if (newStage != plant.stage) {
                plant.stage = newStage;
                emit StageAdvanced(plantId, plant.stage);
            }
        }
    }

    function harvestPlant(uint256 plantId) external {
        Plant storage plant = plants[plantId];
        require(plant.exists, "Plant does not exist");
        require(plant.owner == msg.sender, "Only owner can harvest");
        require(plant.isAlive, "Plant is dead");

        updateWaterLevel(plantId);
        require(plant.isAlive, "Plant died before harvest");

        updatePlantStage(plantId);
        require(plant.stage == GrowthStage.BLOOMING, "Plant not blooming yet");

        plant.exists = false;
        plant.isAlive = false;

        emit PlantHarvested(plantId, msg.sender, HARVEST_REWARD);

        require(address(this).balance >= HARVEST_REWARD, "Contract has insufficient funds for reward");
        (bool sent, ) = msg.sender.call{value: HARVEST_REWARD}("");
        require(sent, "Failed to transfer reward");
    }

  
    function getPlant(uint256 plantId) external view returns (Plant memory) {
        Plant storage p = plants[plantId];
        require(p.id != 0 || p.exists == true || p.lastWatered != 0, "Plant does not exist");

        Plant memory m = p;
        m.waterLevel = calculateWaterLevel(plantId);

        return m;
    }

    /// @notice Return list of plantIds owned by a user
    function getUserPlants(address user) external view returns (uint256[] memory) {
        return userPlants[user];
    }

    /// @notice Owner withdraw contract balance
    function withdraw() external {
        require(msg.sender == owner, "Only owner");
        uint256 bal = address(this).balance;
        require(bal > 0, "No funds to withdraw");

        (bool ok, ) = owner.call{value: bal}("");
        require(ok, "Withdraw failed");
    }

    receive() external payable {}
}

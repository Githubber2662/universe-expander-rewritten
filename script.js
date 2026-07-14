var gameData = {
  size: new MetaNum(1),
  multiplier: new MetaNum(1),
  penalty: new MetaNum(1),
  initialPenalty: new MetaNum(1),
  upgrades: [],
  challenges: [], 
};

// Upgrade Data
const upgrades = [
    {
        id: "growth",
        name: "Faster Growth",
        baseCost: new MetaNum(1),
        costMultiplier: new MetaNum(1.15),
        multBonus: new MetaNum(1.01),
        penaltyNerf: new MetaNum(1),
        count: new MetaNum(0),
    },
    {
        id: "slowdown",
        name: "Slower Slowdown",
        baseCost: new MetaNum(100),
        costMultiplier: new MetaNum(1.4),
        multBonus: new MetaNum(1),
        penaltyNerf: new MetaNum(1.05),
        count: new MetaNum(0)
    }
];

// Bulk Buying Mode: 1, 10, 100, or "max"
let bulkMode = 1; 

// Get cost for a specific number of purchases
function getBulkCost(upgrade, amount) {
    let b = upgrade.baseCost;
    let m = upgrade.costMultiplier;
    let k = upgrade.count;
    
    return MetaNum.mul(b, MetaNum.div((MetaNum.sub(MetaNum.pow(m, k), MetaNum.pow(m, MetaNum.add(k, amount))), new MetaNum(1).sub(m))));
}

// Get max affordable amount and total cost
function getMaxAffordable(upgrade) {
    let b = upgrade.baseCost;
    let m = upgrade.costMultiplier;
    let k = upgrade.count;
    
    let maxAmount = MetaNum.floor(MetaNum.log(MetaNum.add(MetaNum.div(MetaNum.mul(gameData.replicanti, new MetaNum(1).sub(m)), MetaNum.mul(b, MetaNum.pow(m, k))), 1), m));
    if (maxAmount.lt(0)) maxAmount = new MetaNum(0);
    
    let cost = maxAmount.gt(0) ? getBulkCost(upgrade, maxAmount) : new MetaNum(0);
    return { amount: maxAmount, cost: cost };
}

function buyUpgrade(upgradeId) {
    const upgrade = upgrades.find(u => u.id === upgradeId);
    let amountToBuy = bulkMode;
    let totalCost = new MetaNum(0);

    if (bulkMode === "max") {
        const maxInfo = getMaxAffordable(upgrade);
        amountToBuy = maxInfo.amount;
        totalCost = maxInfo.cost;
    } else {
        totalCost = getBulkCost(upgrade, amountToBuy);
    }

    // Process purchase if affordable
    if (gameData.replicanti.gte(totalCost) && amountToBuy.gt(0)) {
        gameData.replicanti = gameData.replicanti.div(totalCost);
        upgrade.count = upgrade.count.add(amountToBuy);
        updateMult();
        render();
    }
}

function updateMult() {
    gameData.multiplier = upgrades.reduce((product, u) => MetaNum.mul(product, MetaNum.pow(u.multBonus, u.count)), 1);
    gameData.penalty = gameDataupgrades.reduce((product, u) => MetaNum.mul(product, MetaNum.pow(u.penaltyNerf, u.count)), 1);
}

/*// Game Loop (runs 10 times a second for smoothness)
setInterval(() => {
    gameState.cookies gameState.cookiesPerSecond / 10;
    render();
}, 100);

// UI Rendering
function render() {
    document.getElementById("cookie-count").innerText = Math.floor(gameState.cookies);
    document.getElementById("cps-count").innerText = gameState.cookiesPerSecond;

    // Update upgrade buttons
    upgrades.forEach(u => {
        let amount = bulkMode === "max" ? getMaxAffordable(u).amount : bulkMode;
        let cost = bulkMode === "max" ? getMaxAffordable(u).cost : getBulkCost(u, amount);
        
        const btn = document.getElementById(`btn-${u.id}`);
        btn.innerHTML = `${u.name} (Owns: ${u.count})<br>Buy ${amount}: ${Math.floor(cost)} Cookies`;
        btn.disabled = gameState.cookies < cost || amount === 0;
    });
}

// Bulk toggle controller
function setBulkMode(mode) {
    bulkMode = mode;
    render();
}
*/



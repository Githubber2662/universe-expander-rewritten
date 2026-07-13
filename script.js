var gameData = {
  size: new MetaNum(1),
  multiplier: new MetaNum(1),
  upgrades: [],
  challenges: [], 
};
class upgrade {
  constructor(desc, id, currency, punishment, reward) {
    this.desc = desc;
    this.id = id;
    this.currency = currency;
    this.can = currency.gt(;
    this.punishment = punishment;
    this.reward = reward;
    this.bought = new MetaNum(0);
  }
  buy() {
    negEffect;
  }
}
/*class ClassUnit {
    constructor(name, baseCost, baseProduction, growthRate) {
        this.name = name;
        this.baseCost = baseCost;
        this.baseProduction = baseProduction;
        this.growthRate = growthRate; // e.g., 1.15
        this.level = 0;
    }

    // Dynamic cost calculation based on exponential scaling
    getCost() {
        return Math.floor(this.baseCost * Math.pow(this.growthRate, this.level));
    }

    // Dynamic production calculation based on level
    getProduction() {
        return this.baseProduction * this.level;
    }

    // Standard upgrade logic (buy one)
    upgrade() {
        this.level++;
    }
}
*/

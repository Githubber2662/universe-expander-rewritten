var gameData = {
  size: new MetaNum(1),
  multiplier: new MetaNum(1),
  upgrades: [],
  challenges: [], 
};
const UPGS = {
    replicanti: {
        cols: 4,
        can(x) { return player.replicanti.gte(this[x].cost()) && (x == 2 ? !(CHALS.onChal("normal2") || CHALS.onChal("inf1")) : true) },
        buy(x) {
            if (this.can(x)) {
                if (!ACHS.has(34)) player.replicanti = player.replicanti.div(this[x].cost()).max(1)
                player.rep_upgs[x] = player.rep_upgs[x].add(1)
            }
        },
        buyMax() {
            for (let x = 1; x <= this.cols; x++) this.max(x)
        },
        max(x) {
            if (this.can(x)) {
                let bulk = this[x].bulk()
                if (bulk.gt(player.rep_upgs[x])) {
                    if (!ACHS.has(34)) player.replicanti = player.replicanti.div(this[x].cost(bulk.sub(1))).max(1)
                    player.rep_upgs[x] = bulk
                }
            }
        },

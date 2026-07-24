var gameData = {
  size: new MetaNum(1),
  multiplier: new MetaNum(1),
  penalty: new MetaNum(1),
  initialPenalty: new MetaNum(1),
  inChallenge: [], 
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
        baseCost: new MetaNum(1.5),
        costMultiplier: new MetaNum(1.4),
        multBonus: new MetaNum(1),
        penaltyNerf: new MetaNum(1.05),
        count: new MetaNum(0)
    }
];
const challenges = [
    {
        id: "slowdown",
        name: "Slowdown",
        goal: new MetaNum(10000),
        penalty: new MetaNum(2),
        completed: false,
    },
    {
        id: "compaction",
        name: "Compaction",
        goal: new MetaNum(10000),
        penalty: MetaNum.add(1, MetaNum.log(size, 2)),
        completed: false,
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
    gameData.initialPenalty = challenges.reduce((product, u) => MetaNum.mul(product, u.penlaty), 1);
}

function formatReadable() {
    function formatCount(pattern, count) {
      return count >= 4 ? pattern + "^" + count : pattern.repeat(count);
    }
    function formatFiniteOps(r0) {
      // Find the highest level
      var highest = -1;
      for (var i = r0.length - 1; i >= 1; i--) {
        if (r0[i] > 0) { highest = i; break; }
      }
      if (highest === -1) return "";

      // If highest level is 23+, use normalized Aa notation
      if (highest >= 23) {
        var coeff = r0[highest];
        var pow9 = 9;
        for (var i = highest - 1; i >= 1; i--) {
          coeff += (r0[i] || 0) / pow9;
          pow9 *= 9;
        }
        // Carry: if coeff >= 9, move to next level
        var level = highest;
        while (coeff >= 9) {
          coeff /= 9;
          level++;
        }
        // Format coefficient
        var coeffStr;
        if (Math.abs(coeff - Math.round(coeff)) < 1e-12 && Math.round(coeff) <= Number.MAX_SAFE_INTEGER) {
          coeffStr = String(Math.round(coeff));
        } else {
          coeffStr = decimalPlaces(coeff, 8);
        }
        return coeffStr + "Aa" + level;
      }

      // Letter notation for levels <= 22
      var parts = [];
      for (var i = highest; i >= 1; i--) {
        if (r0[i] > 0) {
          var letter = String.fromCharCode(68 + i);
          var token = formatCount(letter, r0[i]);
          parts.push(token);
        }
      }
      if (parts.length === 0) return "";
      var hasPower = false;
      for (var j = 0; j < parts.length; j++) {
        if (parts[j].indexOf("^") !== -1) { hasPower = true; break; }
      }
      var sep = hasPower ? " " : "";
      return parts.join(sep) + (hasPower ? " " : "");
    }
    // Helper: format a MetaNum as scientific notation (AeB)
    function formatExponent(num) {
      if (isSimple(num)) {
        var val = num.toNumber();
        if (isFinite(val) && val !== 0) {
          return val.toExponential(6).replace(/\+/g, '');
        }
      }
      if (num.layer === 0 && num.array.length === 1) {
        var r0 = num.array[0];
        if (r0.length === 2) {
          // E notation: array is [mantissa, 1], value = 10^mantissa
          var m = r0[0];
          if (Number.isInteger(m)) {
            return "1E" + m;
          }
          var mant = Math.pow(10, m % 1);
          var exp = Math.floor(m);
          return mant.toPrecision(6).replace(/0+$/, '').replace(/\.$/, '') + "E" + exp;
        }
      }
      // Fallback: use native toString
      return num.toString();
    }
    if (this.isNaN()) return "NaN";
    if (this.isInfinite()) return this.sign === -1 || this.sign === -2 ? "-Infinity" : "Infinity";

    if (this.eq(MetaNum.ZERO)) return "0";

    if (this.sign === -1 || this.sign === -2) return "-" + this.abs().toString();

    if (isSmall(this)) {
      // Three tiers of small value display
      var recip = this.clone();
      recip.sign = 1;  // Get the reciprocal (large number)
      var mag = recip.log10();  // log10(reciprocal) = magnitude exponent
      var maxSf = new MetaNum(MAX_SAFE_INTEGER);
      var eMaxSf = MetaNum.pow(MetaNum.TEN, maxSf);
      
      // Tier 1: |x| > 1e-MAX_SAFE_INTEGER → -log10(|x|) < MAX_SAFE_INTEGER → mag < MAX_SAFE_INTEGER
      if (mag.lt(maxSf)) {
        var expVal = mag.toNumber();
        if (Number.isFinite(expVal)) {
          if (Number.isInteger(expVal)) {
            return "1E-" + String(Math.round(expVal));
          }
          // Non-integer: normalize so mantissa is in [1, 10)
          var frac = expVal - Math.floor(expVal);
          var mantissa = Math.pow(10, 1 - frac);
          var intExp = Math.floor(expVal) + 1;
          var mantStr = mantissa.toPrecision(6).replace(/0+$/, '').replace(/\.$/, '');
          return mantStr + "E-" + intExp;
        }
      }
      
      // Tier 2: MAX_SAFE_INTEGER ≤ mag < 10^MAX_SAFE_INTEGER
      if (!mag.isInfinite() && mag.gte(maxSf) && mag.lt(eMaxSf)) {
        // Format mag in scientific notation for the "e-AeB" format
        var expStr = formatExponent(mag);
        return "E-" + expStr;
      }
      
      // Tier 3: mag ≥ 10^MAX_SAFE_INTEGER → display as reciprocal
      if (recip.layer === 0 && recip.array.length === 1 && recip.array[0].length === 1) {
        return recip.array[0][0] + "⁻¹";
      }
      return recip.toString() + "⁻¹";
    }

    if (this.layer > 0) {
      var LAYER_SYMBOLS = {1: '!', 2: '@', 3: '#', 4: '$', 5: '%', 6: '&', 7: '~', 8: '<', 9: '>', 10: '?'};
      var sym = this.layer <= 10 ? LAYER_SYMBOLS[this.layer] : null;
      
      // Layer >= 11: use {m}ε{n} format
      if (this.layer >= 11) {
        var epsVal;
        var epsIsSpecial = false;
        
        // Check for special case: r0 stores ordinal level directly [coeff, m] with 99 <= m <= MAX_SAFE_INTEGER
        if (this.array.length === 1 && this.array[0].length === 2 &&
            this.array[0][1] >= 99 && this.array[0][1] <= MAX_SAFE_INTEGER) {
          epsVal = this.array[0][1];
          epsIsSpecial = true;
        } else if (this.array.length >= 2) {
          // Normal case: ordinal level from last row structure
          // The ε value is the ordinal exponent (number of ordinal params = lastRow.length - 2)
          var lastRow = this.array[this.array.length - 1];
          epsVal = lastRow[0] || 1;
        } else {
          epsVal = this.array[0][0] || 1;
        }
        
        if (epsIsSpecial) {
          return "{" + epsVal + "}\u03B5{" + (this.layer - 1) + "}";
        }
        // Normal case: bare format mεn for simple values
        var epsStr;
        if (Number.isInteger(epsVal) && epsVal >= 1 && epsVal <= 1e15) {
          epsStr = String(epsVal);
        } else {
          epsStr = "{" + epsVal + "}";
        }
        // If there's more structure beyond the simple ε format, include array notation
        if (this.array.length > 2 || (this.array.length === 2 && this.array[0].length > 1)) {
          epsStr += " [" + this.array[0].join(",") + "]";
          for (var i = 1; i < this.array.length - 1; i++) {
            epsStr += " [" + this.array[i].join(",") + "]";
          }
        }
        return epsStr + "\u03B5" + this.layer;
      }
      
      // Layers 1-10: check for special ε compact format first
      // Special case: r0 stores ordinal level directly [coeff, m] with 99 <= m <= MAX_SAFE_INTEGER
      if (sym && this.array.length === 1 && this.array[0].length === 2 &&
          this.array[0][1] >= 99 && this.array[0][1] <= Number.MAX_SAFE_INTEGER) {
        return "{" + this.array[0][1] + "}\u03B5{" + (this.layer - 1) + "}";
      }

      // Layers 1-10: try letter notation
      if (sym && this.array.length >= 2) {
        var ordTokens = [];
        var validLetter = true;
        
        for (var i = this.array.length - 1; i >= 1; i--) {
          var row = this.array[i];
          if (row.length < 3) { validLetter = false; break; }
          var diag = row[row.length - 1];
          var countVals = row[0];
          var vals = row.slice(1, row.length - 1);
          var n = vals.length;
          
          if (diag < 1 || diag > 26) { validLetter = false; break; }
          
          var U = String.fromCharCode(64 + diag);
          var allZero = true;
          var anyLarge = false;
          var largeVal = -1;
          for (var j = 0; j < n; j++) {
            if (vals[j] > 25) { anyLarge = true; largeVal = vals[j]; }
            if (vals[j] !== 0) allZero = false;
          }
          
          var token;
          if (allZero) {
            token = n > 26 ? U + "a" + n : U + "a".repeat(n);
          } else if (anyLarge && n === 1) {
            // Compact format: single large value
            token = U + "a" + largeVal;
          } else {
            var lower = "";
            var ok = true;
            for (var j = n - 1; j >= 0; j--) {
              if (vals[j] > 25) { ok = false; break; }
              lower += String.fromCharCode(97 + vals[j]);
            }
            if (!ok) { validLetter = false; break; }
            token = U + lower;
          }
          if (countVals > 1) {
            token = countVals >= 4 ? token + "^" + countVals : token.repeat(countVals);
          }
          ordTokens.push(token);
        }
        
        if (validLetter && ordTokens.length > 0) {
          var finOps = formatFiniteOps(this.array[0]);
          var hasAa = finOps && finOps.indexOf("Aa") !== -1;
          var baseStr = "";
          if (!hasAa) {
            if (this.array[0].length === 1) {
              baseStr = String(this.array[0][0]);
            } else if (finOps !== "" && this.array[0].length >= 1 && this.array[0][0] > 0) {
              baseStr = String(this.array[0][0]);
            }
          }
          // Always include layer symbol for layers 1-10
          if (this.layer >= 1 && finOps === "" && baseStr !== "") {
            return sym + ordTokens.join("") + baseStr;
          }
          return sym + ordTokens.join("") + (finOps ? finOps : "") + baseStr;
        }
      }
      
      // Ultimate fallback: array notation with layer symbol
      var s = (this.layer <= 10 ? LAYER_SYMBOLS[this.layer] || ("!".repeat(this.layer)) : "E" + this.layer) + " ";
      for (var i = 0; i < this.array.length; i++) {
        if (i > 0) s += " ";
        s += "[" + this.array[i].join(",") + "]";
      }
      return s;
    }

    if (this.array.length <= 1) {
      var r0 = this.array[0];

      if (r0.length === 1) return String(r0[0]);

      if (r0.length >= 24) {
        // Find highest level with non-zero value
        var highest = -1;
        for (var j = r0.length - 1; j >= 1; j--) {
          if (r0[j] && r0[j] !== 0) { highest = j; break; }
        }
        if (highest >= 23) {
          // Normalized Aa notation: absorb all lower levels into coefficient
          var coeff = r0[highest];
          var pow9 = 9;
          for (var j = highest - 1; j >= 1; j--) {
            coeff += (r0[j] || 0) / pow9;
            pow9 *= 9;
          }
          var level = highest;
          while (coeff >= 9) {
            coeff /= 9;
            level++;
          }
          var coeffStr;
          if (Math.abs(coeff - Math.round(coeff)) < 1e-12 && Math.round(coeff) <= Number.MAX_SAFE_INTEGER) {
            coeffStr = String(Math.round(coeff));
          } else {
            coeffStr = decimalPlaces(coeff, 8);
          }
          return coeffStr + "Aa" + level;
        }
        // Fallback: letter notation for all levels
        var result = "";
        for (var j = r0.length - 1; j >= 1; j--) {
          if (!r0[j] || r0[j] === 0) continue;
          var letter = String.fromCharCode(68 + j);
          if (r0[j] > 3) {
            result += letter + "^" + r0[j] + " ";
          } else {
            result += letter.repeat(r0[j]);
          }
        }
        result += decimalPlaces(r0[0], 6);
        return result;
      }

      var result = "";
      for (var j = r0.length - 1; j >= 1; j--) {
        if (!r0[j] || r0[j] === 0) continue;
        if (j <= 22) {
          var letter = String.fromCharCode(68 + j);
          if (r0[j] > 3) {
            result += letter + "^" + r0[j] + " ";
          } else {
            result += letter.repeat(r0[j]);
          }
        } else {
          result += r0[j] + "Aa" + j + " ";
        }
      }
      result += decimalPlaces(r0[0], 6);
      return result;
    }

    // Layer 0 with ordinal rows: try letter notation
    if (this.array.length > 1) {
      // Check if all ordinal rows are 2-element [count, value] (h10 ω-level format)
      var allTwoElement = true;
      for (var i = 1; i < this.array.length; i++) {
        if (this.array[i].length !== 2) { allTwoElement = false; break; }
      }
      if (allTwoElement) {
        // Check for truncation pattern: array[0] = [10] placeholder
        var isTruncated = this.array[0].length === 1 && this.array[0][0] === 10;
        if (isTruncated) {
          // Show only the last row: count Aa value
          var lastRow = this.array[this.array.length - 1];
          return lastRow[0] + "Aa" + lastRow[1];
        }
        // Non-truncated: show all rows
        var tokens = [];
        for (var i = this.array.length - 1; i >= 1; i--) {
          var row = this.array[i];
          var tok = row[0] > 1 ? row[0] + "Aa" + row[1] : "Aa" + row[1] + i > 1 ? ";" : "";
          tokens.push(tok);
        }
        var finOps = formatFiniteOps(this.array[0]);
        var hasAa = finOps && finOps.indexOf("Aa") !== -1;
        var baseNum = hasAa ? "" : decimalPlaces(this.array[0][0], 6);
        return tokens.join("") + (finOps ? finOps : "") + baseNum;
      }
      
      var ordTokens = [];
      var validLetter = true;
      var useExclaim = false;
      
      for (var i = this.array.length - 1; i >= 1; i--) {
        var row = this.array[i];
        if (row.length < 3) { validLetter = false; break; }
        var diag = row[row.length - 1];
        var countVals = row[0];
        var vals = row.slice(1, row.length - 1);
        var n = vals.length;
        
        if (diag < 1 || diag > 26) { validLetter = false; break; }
        
        var U = String.fromCharCode(64 + diag);
        var allZero = true;
        var anyLarge = false;
        for (var j = 0; j < n; j++) {
          if (vals[j] > 25) { anyLarge = true; }
          if (vals[j] !== 0) allZero = false;
        }
        if (anyLarge) { validLetter = false; break; }
        if (!validLetter) break;
        
        var token;
        if (allZero) {
          if (n > 26) {
            useExclaim = true;
            token = U + "a" + n;
          } else {
            token = U + "a".repeat(n);
          }
        } else {
          var lower = "";
          for (var j = n - 1; j >= 0; j--) {
            lower += String.fromCharCode(97 + vals[j]);
          }
          token = U + lower;
        }
        if (countVals > 1) {
          token = countVals >= 4 ? token + "^" + countVals : token.repeat(countVals);
        }
        ordTokens.push(token);
      }
      
      if (validLetter) {
        var finOps = formatFiniteOps(this.array[0]);
        var hasAa = finOps && finOps.indexOf("Aa") !== -1;
        var prefix = useExclaim ? "!" : "";
        var baseNum = (useExclaim || hasAa) ? "" : decimalPlaces(this.array[0][0], 6);
        return prefix + ordTokens.join("") + (finOps ? finOps : "") + baseNum;
      }
    }

    if (this.array.length === 2 &&
        this.array[0].length === 1 && this.array[0][0] === 10 &&
        this.array[1].length === 2) {
      return this.array[1][0] + "Aa" + this.array[1][1];
    }

    var multiResult = "";
    for (var i = 0; i < this.array.length; i++) {
      if (i > 0) multiResult += " ";
      multiResult += "[" + this.array[i].join(",") + "]";
    }
    return multiResult;
  };
    


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



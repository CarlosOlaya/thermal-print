var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// node_modules/qrcode/lib/core/utils.js
var require_utils = __commonJS({
  "node_modules/qrcode/lib/core/utils.js"(exports2) {
    var toSJISFunction;
    var CODEWORDS_COUNT = [
      0,
      // Not used
      26,
      44,
      70,
      100,
      134,
      172,
      196,
      242,
      292,
      346,
      404,
      466,
      532,
      581,
      655,
      733,
      815,
      901,
      991,
      1085,
      1156,
      1258,
      1364,
      1474,
      1588,
      1706,
      1828,
      1921,
      2051,
      2185,
      2323,
      2465,
      2611,
      2761,
      2876,
      3034,
      3196,
      3362,
      3532,
      3706
    ];
    exports2.getSymbolSize = function getSymbolSize(version) {
      if (!version) throw new Error('"version" cannot be null or undefined');
      if (version < 1 || version > 40) throw new Error('"version" should be in range from 1 to 40');
      return version * 4 + 17;
    };
    exports2.getSymbolTotalCodewords = function getSymbolTotalCodewords(version) {
      return CODEWORDS_COUNT[version];
    };
    exports2.getBCHDigit = function(data) {
      let digit = 0;
      while (data !== 0) {
        digit++;
        data >>>= 1;
      }
      return digit;
    };
    exports2.setToSJISFunction = function setToSJISFunction(f) {
      if (typeof f !== "function") {
        throw new Error('"toSJISFunc" is not a valid function.');
      }
      toSJISFunction = f;
    };
    exports2.isKanjiModeEnabled = function() {
      return typeof toSJISFunction !== "undefined";
    };
    exports2.toSJIS = function toSJIS(kanji) {
      return toSJISFunction(kanji);
    };
  }
});

// node_modules/qrcode/lib/core/error-correction-level.js
var require_error_correction_level = __commonJS({
  "node_modules/qrcode/lib/core/error-correction-level.js"(exports2) {
    exports2.L = { bit: 1 };
    exports2.M = { bit: 0 };
    exports2.Q = { bit: 3 };
    exports2.H = { bit: 2 };
    function fromString(string) {
      if (typeof string !== "string") {
        throw new Error("Param is not a string");
      }
      const lcStr = string.toLowerCase();
      switch (lcStr) {
        case "l":
        case "low":
          return exports2.L;
        case "m":
        case "medium":
          return exports2.M;
        case "q":
        case "quartile":
          return exports2.Q;
        case "h":
        case "high":
          return exports2.H;
        default:
          throw new Error("Unknown EC Level: " + string);
      }
    }
    exports2.isValid = function isValid(level) {
      return level && typeof level.bit !== "undefined" && level.bit >= 0 && level.bit < 4;
    };
    exports2.from = function from(value, defaultValue) {
      if (exports2.isValid(value)) {
        return value;
      }
      try {
        return fromString(value);
      } catch (e) {
        return defaultValue;
      }
    };
  }
});

// node_modules/qrcode/lib/core/bit-buffer.js
var require_bit_buffer = __commonJS({
  "node_modules/qrcode/lib/core/bit-buffer.js"(exports2, module2) {
    function BitBuffer() {
      this.buffer = [];
      this.length = 0;
    }
    BitBuffer.prototype = {
      get: function(index) {
        const bufIndex = Math.floor(index / 8);
        return (this.buffer[bufIndex] >>> 7 - index % 8 & 1) === 1;
      },
      put: function(num2, length) {
        for (let i = 0; i < length; i++) {
          this.putBit((num2 >>> length - i - 1 & 1) === 1);
        }
      },
      getLengthInBits: function() {
        return this.length;
      },
      putBit: function(bit) {
        const bufIndex = Math.floor(this.length / 8);
        if (this.buffer.length <= bufIndex) {
          this.buffer.push(0);
        }
        if (bit) {
          this.buffer[bufIndex] |= 128 >>> this.length % 8;
        }
        this.length++;
      }
    };
    module2.exports = BitBuffer;
  }
});

// node_modules/qrcode/lib/core/bit-matrix.js
var require_bit_matrix = __commonJS({
  "node_modules/qrcode/lib/core/bit-matrix.js"(exports2, module2) {
    function BitMatrix(size) {
      if (!size || size < 1) {
        throw new Error("BitMatrix size must be defined and greater than 0");
      }
      this.size = size;
      this.data = new Uint8Array(size * size);
      this.reservedBit = new Uint8Array(size * size);
    }
    BitMatrix.prototype.set = function(row, col, value, reserved) {
      const index = row * this.size + col;
      this.data[index] = value;
      if (reserved) this.reservedBit[index] = true;
    };
    BitMatrix.prototype.get = function(row, col) {
      return this.data[row * this.size + col];
    };
    BitMatrix.prototype.xor = function(row, col, value) {
      this.data[row * this.size + col] ^= value;
    };
    BitMatrix.prototype.isReserved = function(row, col) {
      return this.reservedBit[row * this.size + col];
    };
    module2.exports = BitMatrix;
  }
});

// node_modules/qrcode/lib/core/alignment-pattern.js
var require_alignment_pattern = __commonJS({
  "node_modules/qrcode/lib/core/alignment-pattern.js"(exports2) {
    var getSymbolSize = require_utils().getSymbolSize;
    exports2.getRowColCoords = function getRowColCoords(version) {
      if (version === 1) return [];
      const posCount = Math.floor(version / 7) + 2;
      const size = getSymbolSize(version);
      const intervals = size === 145 ? 26 : Math.ceil((size - 13) / (2 * posCount - 2)) * 2;
      const positions = [size - 7];
      for (let i = 1; i < posCount - 1; i++) {
        positions[i] = positions[i - 1] - intervals;
      }
      positions.push(6);
      return positions.reverse();
    };
    exports2.getPositions = function getPositions(version) {
      const coords = [];
      const pos = exports2.getRowColCoords(version);
      const posLength = pos.length;
      for (let i = 0; i < posLength; i++) {
        for (let j = 0; j < posLength; j++) {
          if (i === 0 && j === 0 || // top-left
          i === 0 && j === posLength - 1 || // bottom-left
          i === posLength - 1 && j === 0) {
            continue;
          }
          coords.push([pos[i], pos[j]]);
        }
      }
      return coords;
    };
  }
});

// node_modules/qrcode/lib/core/finder-pattern.js
var require_finder_pattern = __commonJS({
  "node_modules/qrcode/lib/core/finder-pattern.js"(exports2) {
    var getSymbolSize = require_utils().getSymbolSize;
    var FINDER_PATTERN_SIZE = 7;
    exports2.getPositions = function getPositions(version) {
      const size = getSymbolSize(version);
      return [
        // top-left
        [0, 0],
        // top-right
        [size - FINDER_PATTERN_SIZE, 0],
        // bottom-left
        [0, size - FINDER_PATTERN_SIZE]
      ];
    };
  }
});

// node_modules/qrcode/lib/core/mask-pattern.js
var require_mask_pattern = __commonJS({
  "node_modules/qrcode/lib/core/mask-pattern.js"(exports2) {
    exports2.Patterns = {
      PATTERN000: 0,
      PATTERN001: 1,
      PATTERN010: 2,
      PATTERN011: 3,
      PATTERN100: 4,
      PATTERN101: 5,
      PATTERN110: 6,
      PATTERN111: 7
    };
    var PenaltyScores = {
      N1: 3,
      N2: 3,
      N3: 40,
      N4: 10
    };
    exports2.isValid = function isValid(mask) {
      return mask != null && mask !== "" && !isNaN(mask) && mask >= 0 && mask <= 7;
    };
    exports2.from = function from(value) {
      return exports2.isValid(value) ? parseInt(value, 10) : void 0;
    };
    exports2.getPenaltyN1 = function getPenaltyN1(data) {
      const size = data.size;
      let points = 0;
      let sameCountCol = 0;
      let sameCountRow = 0;
      let lastCol = null;
      let lastRow = null;
      for (let row = 0; row < size; row++) {
        sameCountCol = sameCountRow = 0;
        lastCol = lastRow = null;
        for (let col = 0; col < size; col++) {
          let module3 = data.get(row, col);
          if (module3 === lastCol) {
            sameCountCol++;
          } else {
            if (sameCountCol >= 5) points += PenaltyScores.N1 + (sameCountCol - 5);
            lastCol = module3;
            sameCountCol = 1;
          }
          module3 = data.get(col, row);
          if (module3 === lastRow) {
            sameCountRow++;
          } else {
            if (sameCountRow >= 5) points += PenaltyScores.N1 + (sameCountRow - 5);
            lastRow = module3;
            sameCountRow = 1;
          }
        }
        if (sameCountCol >= 5) points += PenaltyScores.N1 + (sameCountCol - 5);
        if (sameCountRow >= 5) points += PenaltyScores.N1 + (sameCountRow - 5);
      }
      return points;
    };
    exports2.getPenaltyN2 = function getPenaltyN2(data) {
      const size = data.size;
      let points = 0;
      for (let row = 0; row < size - 1; row++) {
        for (let col = 0; col < size - 1; col++) {
          const last = data.get(row, col) + data.get(row, col + 1) + data.get(row + 1, col) + data.get(row + 1, col + 1);
          if (last === 4 || last === 0) points++;
        }
      }
      return points * PenaltyScores.N2;
    };
    exports2.getPenaltyN3 = function getPenaltyN3(data) {
      const size = data.size;
      let points = 0;
      let bitsCol = 0;
      let bitsRow = 0;
      for (let row = 0; row < size; row++) {
        bitsCol = bitsRow = 0;
        for (let col = 0; col < size; col++) {
          bitsCol = bitsCol << 1 & 2047 | data.get(row, col);
          if (col >= 10 && (bitsCol === 1488 || bitsCol === 93)) points++;
          bitsRow = bitsRow << 1 & 2047 | data.get(col, row);
          if (col >= 10 && (bitsRow === 1488 || bitsRow === 93)) points++;
        }
      }
      return points * PenaltyScores.N3;
    };
    exports2.getPenaltyN4 = function getPenaltyN4(data) {
      let darkCount = 0;
      const modulesCount = data.data.length;
      for (let i = 0; i < modulesCount; i++) darkCount += data.data[i];
      const k = Math.abs(Math.ceil(darkCount * 100 / modulesCount / 5) - 10);
      return k * PenaltyScores.N4;
    };
    function getMaskAt(maskPattern, i, j) {
      switch (maskPattern) {
        case exports2.Patterns.PATTERN000:
          return (i + j) % 2 === 0;
        case exports2.Patterns.PATTERN001:
          return i % 2 === 0;
        case exports2.Patterns.PATTERN010:
          return j % 3 === 0;
        case exports2.Patterns.PATTERN011:
          return (i + j) % 3 === 0;
        case exports2.Patterns.PATTERN100:
          return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0;
        case exports2.Patterns.PATTERN101:
          return i * j % 2 + i * j % 3 === 0;
        case exports2.Patterns.PATTERN110:
          return (i * j % 2 + i * j % 3) % 2 === 0;
        case exports2.Patterns.PATTERN111:
          return (i * j % 3 + (i + j) % 2) % 2 === 0;
        default:
          throw new Error("bad maskPattern:" + maskPattern);
      }
    }
    exports2.applyMask = function applyMask(pattern, data) {
      const size = data.size;
      for (let col = 0; col < size; col++) {
        for (let row = 0; row < size; row++) {
          if (data.isReserved(row, col)) continue;
          data.xor(row, col, getMaskAt(pattern, row, col));
        }
      }
    };
    exports2.getBestMask = function getBestMask(data, setupFormatFunc) {
      const numPatterns = Object.keys(exports2.Patterns).length;
      let bestPattern = 0;
      let lowerPenalty = Infinity;
      for (let p = 0; p < numPatterns; p++) {
        setupFormatFunc(p);
        exports2.applyMask(p, data);
        const penalty = exports2.getPenaltyN1(data) + exports2.getPenaltyN2(data) + exports2.getPenaltyN3(data) + exports2.getPenaltyN4(data);
        exports2.applyMask(p, data);
        if (penalty < lowerPenalty) {
          lowerPenalty = penalty;
          bestPattern = p;
        }
      }
      return bestPattern;
    };
  }
});

// node_modules/qrcode/lib/core/error-correction-code.js
var require_error_correction_code = __commonJS({
  "node_modules/qrcode/lib/core/error-correction-code.js"(exports2) {
    var ECLevel = require_error_correction_level();
    var EC_BLOCKS_TABLE = [
      // L  M  Q  H
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      2,
      2,
      1,
      2,
      2,
      4,
      1,
      2,
      4,
      4,
      2,
      4,
      4,
      4,
      2,
      4,
      6,
      5,
      2,
      4,
      6,
      6,
      2,
      5,
      8,
      8,
      4,
      5,
      8,
      8,
      4,
      5,
      8,
      11,
      4,
      8,
      10,
      11,
      4,
      9,
      12,
      16,
      4,
      9,
      16,
      16,
      6,
      10,
      12,
      18,
      6,
      10,
      17,
      16,
      6,
      11,
      16,
      19,
      6,
      13,
      18,
      21,
      7,
      14,
      21,
      25,
      8,
      16,
      20,
      25,
      8,
      17,
      23,
      25,
      9,
      17,
      23,
      34,
      9,
      18,
      25,
      30,
      10,
      20,
      27,
      32,
      12,
      21,
      29,
      35,
      12,
      23,
      34,
      37,
      12,
      25,
      34,
      40,
      13,
      26,
      35,
      42,
      14,
      28,
      38,
      45,
      15,
      29,
      40,
      48,
      16,
      31,
      43,
      51,
      17,
      33,
      45,
      54,
      18,
      35,
      48,
      57,
      19,
      37,
      51,
      60,
      19,
      38,
      53,
      63,
      20,
      40,
      56,
      66,
      21,
      43,
      59,
      70,
      22,
      45,
      62,
      74,
      24,
      47,
      65,
      77,
      25,
      49,
      68,
      81
    ];
    var EC_CODEWORDS_TABLE = [
      // L  M  Q  H
      7,
      10,
      13,
      17,
      10,
      16,
      22,
      28,
      15,
      26,
      36,
      44,
      20,
      36,
      52,
      64,
      26,
      48,
      72,
      88,
      36,
      64,
      96,
      112,
      40,
      72,
      108,
      130,
      48,
      88,
      132,
      156,
      60,
      110,
      160,
      192,
      72,
      130,
      192,
      224,
      80,
      150,
      224,
      264,
      96,
      176,
      260,
      308,
      104,
      198,
      288,
      352,
      120,
      216,
      320,
      384,
      132,
      240,
      360,
      432,
      144,
      280,
      408,
      480,
      168,
      308,
      448,
      532,
      180,
      338,
      504,
      588,
      196,
      364,
      546,
      650,
      224,
      416,
      600,
      700,
      224,
      442,
      644,
      750,
      252,
      476,
      690,
      816,
      270,
      504,
      750,
      900,
      300,
      560,
      810,
      960,
      312,
      588,
      870,
      1050,
      336,
      644,
      952,
      1110,
      360,
      700,
      1020,
      1200,
      390,
      728,
      1050,
      1260,
      420,
      784,
      1140,
      1350,
      450,
      812,
      1200,
      1440,
      480,
      868,
      1290,
      1530,
      510,
      924,
      1350,
      1620,
      540,
      980,
      1440,
      1710,
      570,
      1036,
      1530,
      1800,
      570,
      1064,
      1590,
      1890,
      600,
      1120,
      1680,
      1980,
      630,
      1204,
      1770,
      2100,
      660,
      1260,
      1860,
      2220,
      720,
      1316,
      1950,
      2310,
      750,
      1372,
      2040,
      2430
    ];
    exports2.getBlocksCount = function getBlocksCount(version, errorCorrectionLevel) {
      switch (errorCorrectionLevel) {
        case ECLevel.L:
          return EC_BLOCKS_TABLE[(version - 1) * 4 + 0];
        case ECLevel.M:
          return EC_BLOCKS_TABLE[(version - 1) * 4 + 1];
        case ECLevel.Q:
          return EC_BLOCKS_TABLE[(version - 1) * 4 + 2];
        case ECLevel.H:
          return EC_BLOCKS_TABLE[(version - 1) * 4 + 3];
        default:
          return void 0;
      }
    };
    exports2.getTotalCodewordsCount = function getTotalCodewordsCount(version, errorCorrectionLevel) {
      switch (errorCorrectionLevel) {
        case ECLevel.L:
          return EC_CODEWORDS_TABLE[(version - 1) * 4 + 0];
        case ECLevel.M:
          return EC_CODEWORDS_TABLE[(version - 1) * 4 + 1];
        case ECLevel.Q:
          return EC_CODEWORDS_TABLE[(version - 1) * 4 + 2];
        case ECLevel.H:
          return EC_CODEWORDS_TABLE[(version - 1) * 4 + 3];
        default:
          return void 0;
      }
    };
  }
});

// node_modules/qrcode/lib/core/galois-field.js
var require_galois_field = __commonJS({
  "node_modules/qrcode/lib/core/galois-field.js"(exports2) {
    var EXP_TABLE = new Uint8Array(512);
    var LOG_TABLE = new Uint8Array(256);
    (function initTables() {
      let x = 1;
      for (let i = 0; i < 255; i++) {
        EXP_TABLE[i] = x;
        LOG_TABLE[x] = i;
        x <<= 1;
        if (x & 256) {
          x ^= 285;
        }
      }
      for (let i = 255; i < 512; i++) {
        EXP_TABLE[i] = EXP_TABLE[i - 255];
      }
    })();
    exports2.log = function log(n) {
      if (n < 1) throw new Error("log(" + n + ")");
      return LOG_TABLE[n];
    };
    exports2.exp = function exp(n) {
      return EXP_TABLE[n];
    };
    exports2.mul = function mul(x, y) {
      if (x === 0 || y === 0) return 0;
      return EXP_TABLE[LOG_TABLE[x] + LOG_TABLE[y]];
    };
  }
});

// node_modules/qrcode/lib/core/polynomial.js
var require_polynomial = __commonJS({
  "node_modules/qrcode/lib/core/polynomial.js"(exports2) {
    var GF = require_galois_field();
    exports2.mul = function mul(p1, p2) {
      const coeff = new Uint8Array(p1.length + p2.length - 1);
      for (let i = 0; i < p1.length; i++) {
        for (let j = 0; j < p2.length; j++) {
          coeff[i + j] ^= GF.mul(p1[i], p2[j]);
        }
      }
      return coeff;
    };
    exports2.mod = function mod(divident, divisor) {
      let result = new Uint8Array(divident);
      while (result.length - divisor.length >= 0) {
        const coeff = result[0];
        for (let i = 0; i < divisor.length; i++) {
          result[i] ^= GF.mul(divisor[i], coeff);
        }
        let offset = 0;
        while (offset < result.length && result[offset] === 0) offset++;
        result = result.slice(offset);
      }
      return result;
    };
    exports2.generateECPolynomial = function generateECPolynomial(degree) {
      let poly = new Uint8Array([1]);
      for (let i = 0; i < degree; i++) {
        poly = exports2.mul(poly, new Uint8Array([1, GF.exp(i)]));
      }
      return poly;
    };
  }
});

// node_modules/qrcode/lib/core/reed-solomon-encoder.js
var require_reed_solomon_encoder = __commonJS({
  "node_modules/qrcode/lib/core/reed-solomon-encoder.js"(exports2, module2) {
    var Polynomial = require_polynomial();
    function ReedSolomonEncoder(degree) {
      this.genPoly = void 0;
      this.degree = degree;
      if (this.degree) this.initialize(this.degree);
    }
    ReedSolomonEncoder.prototype.initialize = function initialize(degree) {
      this.degree = degree;
      this.genPoly = Polynomial.generateECPolynomial(this.degree);
    };
    ReedSolomonEncoder.prototype.encode = function encode(data) {
      if (!this.genPoly) {
        throw new Error("Encoder not initialized");
      }
      const paddedData = new Uint8Array(data.length + this.degree);
      paddedData.set(data);
      const remainder = Polynomial.mod(paddedData, this.genPoly);
      const start = this.degree - remainder.length;
      if (start > 0) {
        const buff = new Uint8Array(this.degree);
        buff.set(remainder, start);
        return buff;
      }
      return remainder;
    };
    module2.exports = ReedSolomonEncoder;
  }
});

// node_modules/qrcode/lib/core/version-check.js
var require_version_check = __commonJS({
  "node_modules/qrcode/lib/core/version-check.js"(exports2) {
    exports2.isValid = function isValid(version) {
      return !isNaN(version) && version >= 1 && version <= 40;
    };
  }
});

// node_modules/qrcode/lib/core/regex.js
var require_regex = __commonJS({
  "node_modules/qrcode/lib/core/regex.js"(exports2) {
    var numeric = "[0-9]+";
    var alphanumeric = "[A-Z $%*+\\-./:]+";
    var kanji = "(?:[u3000-u303F]|[u3040-u309F]|[u30A0-u30FF]|[uFF00-uFFEF]|[u4E00-u9FAF]|[u2605-u2606]|[u2190-u2195]|u203B|[u2010u2015u2018u2019u2025u2026u201Cu201Du2225u2260]|[u0391-u0451]|[u00A7u00A8u00B1u00B4u00D7u00F7])+";
    kanji = kanji.replace(/u/g, "\\u");
    var byte = "(?:(?![A-Z0-9 $%*+\\-./:]|" + kanji + ")(?:.|[\r\n]))+";
    exports2.KANJI = new RegExp(kanji, "g");
    exports2.BYTE_KANJI = new RegExp("[^A-Z0-9 $%*+\\-./:]+", "g");
    exports2.BYTE = new RegExp(byte, "g");
    exports2.NUMERIC = new RegExp(numeric, "g");
    exports2.ALPHANUMERIC = new RegExp(alphanumeric, "g");
    var TEST_KANJI = new RegExp("^" + kanji + "$");
    var TEST_NUMERIC = new RegExp("^" + numeric + "$");
    var TEST_ALPHANUMERIC = new RegExp("^[A-Z0-9 $%*+\\-./:]+$");
    exports2.testKanji = function testKanji(str) {
      return TEST_KANJI.test(str);
    };
    exports2.testNumeric = function testNumeric(str) {
      return TEST_NUMERIC.test(str);
    };
    exports2.testAlphanumeric = function testAlphanumeric(str) {
      return TEST_ALPHANUMERIC.test(str);
    };
  }
});

// node_modules/qrcode/lib/core/mode.js
var require_mode = __commonJS({
  "node_modules/qrcode/lib/core/mode.js"(exports2) {
    var VersionCheck = require_version_check();
    var Regex = require_regex();
    exports2.NUMERIC = {
      id: "Numeric",
      bit: 1 << 0,
      ccBits: [10, 12, 14]
    };
    exports2.ALPHANUMERIC = {
      id: "Alphanumeric",
      bit: 1 << 1,
      ccBits: [9, 11, 13]
    };
    exports2.BYTE = {
      id: "Byte",
      bit: 1 << 2,
      ccBits: [8, 16, 16]
    };
    exports2.KANJI = {
      id: "Kanji",
      bit: 1 << 3,
      ccBits: [8, 10, 12]
    };
    exports2.MIXED = {
      bit: -1
    };
    exports2.getCharCountIndicator = function getCharCountIndicator(mode, version) {
      if (!mode.ccBits) throw new Error("Invalid mode: " + mode);
      if (!VersionCheck.isValid(version)) {
        throw new Error("Invalid version: " + version);
      }
      if (version >= 1 && version < 10) return mode.ccBits[0];
      else if (version < 27) return mode.ccBits[1];
      return mode.ccBits[2];
    };
    exports2.getBestModeForData = function getBestModeForData(dataStr) {
      if (Regex.testNumeric(dataStr)) return exports2.NUMERIC;
      else if (Regex.testAlphanumeric(dataStr)) return exports2.ALPHANUMERIC;
      else if (Regex.testKanji(dataStr)) return exports2.KANJI;
      else return exports2.BYTE;
    };
    exports2.toString = function toString(mode) {
      if (mode && mode.id) return mode.id;
      throw new Error("Invalid mode");
    };
    exports2.isValid = function isValid(mode) {
      return mode && mode.bit && mode.ccBits;
    };
    function fromString(string) {
      if (typeof string !== "string") {
        throw new Error("Param is not a string");
      }
      const lcStr = string.toLowerCase();
      switch (lcStr) {
        case "numeric":
          return exports2.NUMERIC;
        case "alphanumeric":
          return exports2.ALPHANUMERIC;
        case "kanji":
          return exports2.KANJI;
        case "byte":
          return exports2.BYTE;
        default:
          throw new Error("Unknown mode: " + string);
      }
    }
    exports2.from = function from(value, defaultValue) {
      if (exports2.isValid(value)) {
        return value;
      }
      try {
        return fromString(value);
      } catch (e) {
        return defaultValue;
      }
    };
  }
});

// node_modules/qrcode/lib/core/version.js
var require_version = __commonJS({
  "node_modules/qrcode/lib/core/version.js"(exports2) {
    var Utils = require_utils();
    var ECCode = require_error_correction_code();
    var ECLevel = require_error_correction_level();
    var Mode = require_mode();
    var VersionCheck = require_version_check();
    var G18 = 1 << 12 | 1 << 11 | 1 << 10 | 1 << 9 | 1 << 8 | 1 << 5 | 1 << 2 | 1 << 0;
    var G18_BCH = Utils.getBCHDigit(G18);
    function getBestVersionForDataLength(mode, length, errorCorrectionLevel) {
      for (let currentVersion = 1; currentVersion <= 40; currentVersion++) {
        if (length <= exports2.getCapacity(currentVersion, errorCorrectionLevel, mode)) {
          return currentVersion;
        }
      }
      return void 0;
    }
    function getReservedBitsCount(mode, version) {
      return Mode.getCharCountIndicator(mode, version) + 4;
    }
    function getTotalBitsFromDataArray(segments, version) {
      let totalBits = 0;
      segments.forEach(function(data) {
        const reservedBits = getReservedBitsCount(data.mode, version);
        totalBits += reservedBits + data.getBitsLength();
      });
      return totalBits;
    }
    function getBestVersionForMixedData(segments, errorCorrectionLevel) {
      for (let currentVersion = 1; currentVersion <= 40; currentVersion++) {
        const length = getTotalBitsFromDataArray(segments, currentVersion);
        if (length <= exports2.getCapacity(currentVersion, errorCorrectionLevel, Mode.MIXED)) {
          return currentVersion;
        }
      }
      return void 0;
    }
    exports2.from = function from(value, defaultValue) {
      if (VersionCheck.isValid(value)) {
        return parseInt(value, 10);
      }
      return defaultValue;
    };
    exports2.getCapacity = function getCapacity(version, errorCorrectionLevel, mode) {
      if (!VersionCheck.isValid(version)) {
        throw new Error("Invalid QR Code version");
      }
      if (typeof mode === "undefined") mode = Mode.BYTE;
      const totalCodewords = Utils.getSymbolTotalCodewords(version);
      const ecTotalCodewords = ECCode.getTotalCodewordsCount(version, errorCorrectionLevel);
      const dataTotalCodewordsBits = (totalCodewords - ecTotalCodewords) * 8;
      if (mode === Mode.MIXED) return dataTotalCodewordsBits;
      const usableBits = dataTotalCodewordsBits - getReservedBitsCount(mode, version);
      switch (mode) {
        case Mode.NUMERIC:
          return Math.floor(usableBits / 10 * 3);
        case Mode.ALPHANUMERIC:
          return Math.floor(usableBits / 11 * 2);
        case Mode.KANJI:
          return Math.floor(usableBits / 13);
        case Mode.BYTE:
        default:
          return Math.floor(usableBits / 8);
      }
    };
    exports2.getBestVersionForData = function getBestVersionForData(data, errorCorrectionLevel) {
      let seg;
      const ecl = ECLevel.from(errorCorrectionLevel, ECLevel.M);
      if (Array.isArray(data)) {
        if (data.length > 1) {
          return getBestVersionForMixedData(data, ecl);
        }
        if (data.length === 0) {
          return 1;
        }
        seg = data[0];
      } else {
        seg = data;
      }
      return getBestVersionForDataLength(seg.mode, seg.getLength(), ecl);
    };
    exports2.getEncodedBits = function getEncodedBits(version) {
      if (!VersionCheck.isValid(version) || version < 7) {
        throw new Error("Invalid QR Code version");
      }
      let d = version << 12;
      while (Utils.getBCHDigit(d) - G18_BCH >= 0) {
        d ^= G18 << Utils.getBCHDigit(d) - G18_BCH;
      }
      return version << 12 | d;
    };
  }
});

// node_modules/qrcode/lib/core/format-info.js
var require_format_info = __commonJS({
  "node_modules/qrcode/lib/core/format-info.js"(exports2) {
    var Utils = require_utils();
    var G15 = 1 << 10 | 1 << 8 | 1 << 5 | 1 << 4 | 1 << 2 | 1 << 1 | 1 << 0;
    var G15_MASK = 1 << 14 | 1 << 12 | 1 << 10 | 1 << 4 | 1 << 1;
    var G15_BCH = Utils.getBCHDigit(G15);
    exports2.getEncodedBits = function getEncodedBits(errorCorrectionLevel, mask) {
      const data = errorCorrectionLevel.bit << 3 | mask;
      let d = data << 10;
      while (Utils.getBCHDigit(d) - G15_BCH >= 0) {
        d ^= G15 << Utils.getBCHDigit(d) - G15_BCH;
      }
      return (data << 10 | d) ^ G15_MASK;
    };
  }
});

// node_modules/qrcode/lib/core/numeric-data.js
var require_numeric_data = __commonJS({
  "node_modules/qrcode/lib/core/numeric-data.js"(exports2, module2) {
    var Mode = require_mode();
    function NumericData(data) {
      this.mode = Mode.NUMERIC;
      this.data = data.toString();
    }
    NumericData.getBitsLength = function getBitsLength(length) {
      return 10 * Math.floor(length / 3) + (length % 3 ? length % 3 * 3 + 1 : 0);
    };
    NumericData.prototype.getLength = function getLength() {
      return this.data.length;
    };
    NumericData.prototype.getBitsLength = function getBitsLength() {
      return NumericData.getBitsLength(this.data.length);
    };
    NumericData.prototype.write = function write(bitBuffer) {
      let i, group, value;
      for (i = 0; i + 3 <= this.data.length; i += 3) {
        group = this.data.substr(i, 3);
        value = parseInt(group, 10);
        bitBuffer.put(value, 10);
      }
      const remainingNum = this.data.length - i;
      if (remainingNum > 0) {
        group = this.data.substr(i);
        value = parseInt(group, 10);
        bitBuffer.put(value, remainingNum * 3 + 1);
      }
    };
    module2.exports = NumericData;
  }
});

// node_modules/qrcode/lib/core/alphanumeric-data.js
var require_alphanumeric_data = __commonJS({
  "node_modules/qrcode/lib/core/alphanumeric-data.js"(exports2, module2) {
    var Mode = require_mode();
    var ALPHA_NUM_CHARS = [
      "0",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L",
      "M",
      "N",
      "O",
      "P",
      "Q",
      "R",
      "S",
      "T",
      "U",
      "V",
      "W",
      "X",
      "Y",
      "Z",
      " ",
      "$",
      "%",
      "*",
      "+",
      "-",
      ".",
      "/",
      ":"
    ];
    function AlphanumericData(data) {
      this.mode = Mode.ALPHANUMERIC;
      this.data = data;
    }
    AlphanumericData.getBitsLength = function getBitsLength(length) {
      return 11 * Math.floor(length / 2) + 6 * (length % 2);
    };
    AlphanumericData.prototype.getLength = function getLength() {
      return this.data.length;
    };
    AlphanumericData.prototype.getBitsLength = function getBitsLength() {
      return AlphanumericData.getBitsLength(this.data.length);
    };
    AlphanumericData.prototype.write = function write(bitBuffer) {
      let i;
      for (i = 0; i + 2 <= this.data.length; i += 2) {
        let value = ALPHA_NUM_CHARS.indexOf(this.data[i]) * 45;
        value += ALPHA_NUM_CHARS.indexOf(this.data[i + 1]);
        bitBuffer.put(value, 11);
      }
      if (this.data.length % 2) {
        bitBuffer.put(ALPHA_NUM_CHARS.indexOf(this.data[i]), 6);
      }
    };
    module2.exports = AlphanumericData;
  }
});

// node_modules/qrcode/lib/core/byte-data.js
var require_byte_data = __commonJS({
  "node_modules/qrcode/lib/core/byte-data.js"(exports2, module2) {
    var Mode = require_mode();
    function ByteData(data) {
      this.mode = Mode.BYTE;
      if (typeof data === "string") {
        this.data = new TextEncoder().encode(data);
      } else {
        this.data = new Uint8Array(data);
      }
    }
    ByteData.getBitsLength = function getBitsLength(length) {
      return length * 8;
    };
    ByteData.prototype.getLength = function getLength() {
      return this.data.length;
    };
    ByteData.prototype.getBitsLength = function getBitsLength() {
      return ByteData.getBitsLength(this.data.length);
    };
    ByteData.prototype.write = function(bitBuffer) {
      for (let i = 0, l = this.data.length; i < l; i++) {
        bitBuffer.put(this.data[i], 8);
      }
    };
    module2.exports = ByteData;
  }
});

// node_modules/qrcode/lib/core/kanji-data.js
var require_kanji_data = __commonJS({
  "node_modules/qrcode/lib/core/kanji-data.js"(exports2, module2) {
    var Mode = require_mode();
    var Utils = require_utils();
    function KanjiData(data) {
      this.mode = Mode.KANJI;
      this.data = data;
    }
    KanjiData.getBitsLength = function getBitsLength(length) {
      return length * 13;
    };
    KanjiData.prototype.getLength = function getLength() {
      return this.data.length;
    };
    KanjiData.prototype.getBitsLength = function getBitsLength() {
      return KanjiData.getBitsLength(this.data.length);
    };
    KanjiData.prototype.write = function(bitBuffer) {
      let i;
      for (i = 0; i < this.data.length; i++) {
        let value = Utils.toSJIS(this.data[i]);
        if (value >= 33088 && value <= 40956) {
          value -= 33088;
        } else if (value >= 57408 && value <= 60351) {
          value -= 49472;
        } else {
          throw new Error(
            "Invalid SJIS character: " + this.data[i] + "\nMake sure your charset is UTF-8"
          );
        }
        value = (value >>> 8 & 255) * 192 + (value & 255);
        bitBuffer.put(value, 13);
      }
    };
    module2.exports = KanjiData;
  }
});

// node_modules/dijkstrajs/dijkstra.js
var require_dijkstra = __commonJS({
  "node_modules/dijkstrajs/dijkstra.js"(exports2, module2) {
    "use strict";
    var dijkstra = {
      single_source_shortest_paths: function(graph, s, d) {
        var predecessors = {};
        var costs = {};
        costs[s] = 0;
        var open = dijkstra.PriorityQueue.make();
        open.push(s, 0);
        var closest, u, v, cost_of_s_to_u, adjacent_nodes, cost_of_e, cost_of_s_to_u_plus_cost_of_e, cost_of_s_to_v, first_visit;
        while (!open.empty()) {
          closest = open.pop();
          u = closest.value;
          cost_of_s_to_u = closest.cost;
          adjacent_nodes = graph[u] || {};
          for (v in adjacent_nodes) {
            if (adjacent_nodes.hasOwnProperty(v)) {
              cost_of_e = adjacent_nodes[v];
              cost_of_s_to_u_plus_cost_of_e = cost_of_s_to_u + cost_of_e;
              cost_of_s_to_v = costs[v];
              first_visit = typeof costs[v] === "undefined";
              if (first_visit || cost_of_s_to_v > cost_of_s_to_u_plus_cost_of_e) {
                costs[v] = cost_of_s_to_u_plus_cost_of_e;
                open.push(v, cost_of_s_to_u_plus_cost_of_e);
                predecessors[v] = u;
              }
            }
          }
        }
        if (typeof d !== "undefined" && typeof costs[d] === "undefined") {
          var msg = ["Could not find a path from ", s, " to ", d, "."].join("");
          throw new Error(msg);
        }
        return predecessors;
      },
      extract_shortest_path_from_predecessor_list: function(predecessors, d) {
        var nodes = [];
        var u = d;
        var predecessor;
        while (u) {
          nodes.push(u);
          predecessor = predecessors[u];
          u = predecessors[u];
        }
        nodes.reverse();
        return nodes;
      },
      find_path: function(graph, s, d) {
        var predecessors = dijkstra.single_source_shortest_paths(graph, s, d);
        return dijkstra.extract_shortest_path_from_predecessor_list(
          predecessors,
          d
        );
      },
      /**
       * A very naive priority queue implementation.
       */
      PriorityQueue: {
        make: function(opts) {
          var T = dijkstra.PriorityQueue, t = {}, key;
          opts = opts || {};
          for (key in T) {
            if (T.hasOwnProperty(key)) {
              t[key] = T[key];
            }
          }
          t.queue = [];
          t.sorter = opts.sorter || T.default_sorter;
          return t;
        },
        default_sorter: function(a, b) {
          return a.cost - b.cost;
        },
        /**
         * Add a new item to the queue and ensure the highest priority element
         * is at the front of the queue.
         */
        push: function(value, cost) {
          var item = { value, cost };
          this.queue.push(item);
          this.queue.sort(this.sorter);
        },
        /**
         * Return the highest priority element in the queue.
         */
        pop: function() {
          return this.queue.shift();
        },
        empty: function() {
          return this.queue.length === 0;
        }
      }
    };
    if (typeof module2 !== "undefined") {
      module2.exports = dijkstra;
    }
  }
});

// node_modules/qrcode/lib/core/segments.js
var require_segments = __commonJS({
  "node_modules/qrcode/lib/core/segments.js"(exports2) {
    var Mode = require_mode();
    var NumericData = require_numeric_data();
    var AlphanumericData = require_alphanumeric_data();
    var ByteData = require_byte_data();
    var KanjiData = require_kanji_data();
    var Regex = require_regex();
    var Utils = require_utils();
    var dijkstra = require_dijkstra();
    function getStringByteLength(str) {
      return unescape(encodeURIComponent(str)).length;
    }
    function getSegments(regex, mode, str) {
      const segments = [];
      let result;
      while ((result = regex.exec(str)) !== null) {
        segments.push({
          data: result[0],
          index: result.index,
          mode,
          length: result[0].length
        });
      }
      return segments;
    }
    function getSegmentsFromString(dataStr) {
      const numSegs = getSegments(Regex.NUMERIC, Mode.NUMERIC, dataStr);
      const alphaNumSegs = getSegments(Regex.ALPHANUMERIC, Mode.ALPHANUMERIC, dataStr);
      let byteSegs;
      let kanjiSegs;
      if (Utils.isKanjiModeEnabled()) {
        byteSegs = getSegments(Regex.BYTE, Mode.BYTE, dataStr);
        kanjiSegs = getSegments(Regex.KANJI, Mode.KANJI, dataStr);
      } else {
        byteSegs = getSegments(Regex.BYTE_KANJI, Mode.BYTE, dataStr);
        kanjiSegs = [];
      }
      const segs = numSegs.concat(alphaNumSegs, byteSegs, kanjiSegs);
      return segs.sort(function(s1, s2) {
        return s1.index - s2.index;
      }).map(function(obj) {
        return {
          data: obj.data,
          mode: obj.mode,
          length: obj.length
        };
      });
    }
    function getSegmentBitsLength(length, mode) {
      switch (mode) {
        case Mode.NUMERIC:
          return NumericData.getBitsLength(length);
        case Mode.ALPHANUMERIC:
          return AlphanumericData.getBitsLength(length);
        case Mode.KANJI:
          return KanjiData.getBitsLength(length);
        case Mode.BYTE:
          return ByteData.getBitsLength(length);
      }
    }
    function mergeSegments(segs) {
      return segs.reduce(function(acc, curr) {
        const prevSeg = acc.length - 1 >= 0 ? acc[acc.length - 1] : null;
        if (prevSeg && prevSeg.mode === curr.mode) {
          acc[acc.length - 1].data += curr.data;
          return acc;
        }
        acc.push(curr);
        return acc;
      }, []);
    }
    function buildNodes(segs) {
      const nodes = [];
      for (let i = 0; i < segs.length; i++) {
        const seg = segs[i];
        switch (seg.mode) {
          case Mode.NUMERIC:
            nodes.push([
              seg,
              { data: seg.data, mode: Mode.ALPHANUMERIC, length: seg.length },
              { data: seg.data, mode: Mode.BYTE, length: seg.length }
            ]);
            break;
          case Mode.ALPHANUMERIC:
            nodes.push([
              seg,
              { data: seg.data, mode: Mode.BYTE, length: seg.length }
            ]);
            break;
          case Mode.KANJI:
            nodes.push([
              seg,
              { data: seg.data, mode: Mode.BYTE, length: getStringByteLength(seg.data) }
            ]);
            break;
          case Mode.BYTE:
            nodes.push([
              { data: seg.data, mode: Mode.BYTE, length: getStringByteLength(seg.data) }
            ]);
        }
      }
      return nodes;
    }
    function buildGraph(nodes, version) {
      const table = {};
      const graph = { start: {} };
      let prevNodeIds = ["start"];
      for (let i = 0; i < nodes.length; i++) {
        const nodeGroup = nodes[i];
        const currentNodeIds = [];
        for (let j = 0; j < nodeGroup.length; j++) {
          const node = nodeGroup[j];
          const key = "" + i + j;
          currentNodeIds.push(key);
          table[key] = { node, lastCount: 0 };
          graph[key] = {};
          for (let n = 0; n < prevNodeIds.length; n++) {
            const prevNodeId = prevNodeIds[n];
            if (table[prevNodeId] && table[prevNodeId].node.mode === node.mode) {
              graph[prevNodeId][key] = getSegmentBitsLength(table[prevNodeId].lastCount + node.length, node.mode) - getSegmentBitsLength(table[prevNodeId].lastCount, node.mode);
              table[prevNodeId].lastCount += node.length;
            } else {
              if (table[prevNodeId]) table[prevNodeId].lastCount = node.length;
              graph[prevNodeId][key] = getSegmentBitsLength(node.length, node.mode) + 4 + Mode.getCharCountIndicator(node.mode, version);
            }
          }
        }
        prevNodeIds = currentNodeIds;
      }
      for (let n = 0; n < prevNodeIds.length; n++) {
        graph[prevNodeIds[n]].end = 0;
      }
      return { map: graph, table };
    }
    function buildSingleSegment(data, modesHint) {
      let mode;
      const bestMode = Mode.getBestModeForData(data);
      mode = Mode.from(modesHint, bestMode);
      if (mode !== Mode.BYTE && mode.bit < bestMode.bit) {
        throw new Error('"' + data + '" cannot be encoded with mode ' + Mode.toString(mode) + ".\n Suggested mode is: " + Mode.toString(bestMode));
      }
      if (mode === Mode.KANJI && !Utils.isKanjiModeEnabled()) {
        mode = Mode.BYTE;
      }
      switch (mode) {
        case Mode.NUMERIC:
          return new NumericData(data);
        case Mode.ALPHANUMERIC:
          return new AlphanumericData(data);
        case Mode.KANJI:
          return new KanjiData(data);
        case Mode.BYTE:
          return new ByteData(data);
      }
    }
    exports2.fromArray = function fromArray(array) {
      return array.reduce(function(acc, seg) {
        if (typeof seg === "string") {
          acc.push(buildSingleSegment(seg, null));
        } else if (seg.data) {
          acc.push(buildSingleSegment(seg.data, seg.mode));
        }
        return acc;
      }, []);
    };
    exports2.fromString = function fromString(data, version) {
      const segs = getSegmentsFromString(data, Utils.isKanjiModeEnabled());
      const nodes = buildNodes(segs);
      const graph = buildGraph(nodes, version);
      const path = dijkstra.find_path(graph.map, "start", "end");
      const optimizedSegs = [];
      for (let i = 1; i < path.length - 1; i++) {
        optimizedSegs.push(graph.table[path[i]].node);
      }
      return exports2.fromArray(mergeSegments(optimizedSegs));
    };
    exports2.rawSplit = function rawSplit(data) {
      return exports2.fromArray(
        getSegmentsFromString(data, Utils.isKanjiModeEnabled())
      );
    };
  }
});

// node_modules/qrcode/lib/core/qrcode.js
var require_qrcode = __commonJS({
  "node_modules/qrcode/lib/core/qrcode.js"(exports2) {
    var Utils = require_utils();
    var ECLevel = require_error_correction_level();
    var BitBuffer = require_bit_buffer();
    var BitMatrix = require_bit_matrix();
    var AlignmentPattern = require_alignment_pattern();
    var FinderPattern = require_finder_pattern();
    var MaskPattern = require_mask_pattern();
    var ECCode = require_error_correction_code();
    var ReedSolomonEncoder = require_reed_solomon_encoder();
    var Version = require_version();
    var FormatInfo = require_format_info();
    var Mode = require_mode();
    var Segments = require_segments();
    function setupFinderPattern(matrix, version) {
      const size = matrix.size;
      const pos = FinderPattern.getPositions(version);
      for (let i = 0; i < pos.length; i++) {
        const row = pos[i][0];
        const col = pos[i][1];
        for (let r = -1; r <= 7; r++) {
          if (row + r <= -1 || size <= row + r) continue;
          for (let c = -1; c <= 7; c++) {
            if (col + c <= -1 || size <= col + c) continue;
            if (r >= 0 && r <= 6 && (c === 0 || c === 6) || c >= 0 && c <= 6 && (r === 0 || r === 6) || r >= 2 && r <= 4 && c >= 2 && c <= 4) {
              matrix.set(row + r, col + c, true, true);
            } else {
              matrix.set(row + r, col + c, false, true);
            }
          }
        }
      }
    }
    function setupTimingPattern(matrix) {
      const size = matrix.size;
      for (let r = 8; r < size - 8; r++) {
        const value = r % 2 === 0;
        matrix.set(r, 6, value, true);
        matrix.set(6, r, value, true);
      }
    }
    function setupAlignmentPattern(matrix, version) {
      const pos = AlignmentPattern.getPositions(version);
      for (let i = 0; i < pos.length; i++) {
        const row = pos[i][0];
        const col = pos[i][1];
        for (let r = -2; r <= 2; r++) {
          for (let c = -2; c <= 2; c++) {
            if (r === -2 || r === 2 || c === -2 || c === 2 || r === 0 && c === 0) {
              matrix.set(row + r, col + c, true, true);
            } else {
              matrix.set(row + r, col + c, false, true);
            }
          }
        }
      }
    }
    function setupVersionInfo(matrix, version) {
      const size = matrix.size;
      const bits = Version.getEncodedBits(version);
      let row, col, mod;
      for (let i = 0; i < 18; i++) {
        row = Math.floor(i / 3);
        col = i % 3 + size - 8 - 3;
        mod = (bits >> i & 1) === 1;
        matrix.set(row, col, mod, true);
        matrix.set(col, row, mod, true);
      }
    }
    function setupFormatInfo(matrix, errorCorrectionLevel, maskPattern) {
      const size = matrix.size;
      const bits = FormatInfo.getEncodedBits(errorCorrectionLevel, maskPattern);
      let i, mod;
      for (i = 0; i < 15; i++) {
        mod = (bits >> i & 1) === 1;
        if (i < 6) {
          matrix.set(i, 8, mod, true);
        } else if (i < 8) {
          matrix.set(i + 1, 8, mod, true);
        } else {
          matrix.set(size - 15 + i, 8, mod, true);
        }
        if (i < 8) {
          matrix.set(8, size - i - 1, mod, true);
        } else if (i < 9) {
          matrix.set(8, 15 - i - 1 + 1, mod, true);
        } else {
          matrix.set(8, 15 - i - 1, mod, true);
        }
      }
      matrix.set(size - 8, 8, 1, true);
    }
    function setupData(matrix, data) {
      const size = matrix.size;
      let inc = -1;
      let row = size - 1;
      let bitIndex = 7;
      let byteIndex = 0;
      for (let col = size - 1; col > 0; col -= 2) {
        if (col === 6) col--;
        while (true) {
          for (let c = 0; c < 2; c++) {
            if (!matrix.isReserved(row, col - c)) {
              let dark = false;
              if (byteIndex < data.length) {
                dark = (data[byteIndex] >>> bitIndex & 1) === 1;
              }
              matrix.set(row, col - c, dark);
              bitIndex--;
              if (bitIndex === -1) {
                byteIndex++;
                bitIndex = 7;
              }
            }
          }
          row += inc;
          if (row < 0 || size <= row) {
            row -= inc;
            inc = -inc;
            break;
          }
        }
      }
    }
    function createData(version, errorCorrectionLevel, segments) {
      const buffer = new BitBuffer();
      segments.forEach(function(data) {
        buffer.put(data.mode.bit, 4);
        buffer.put(data.getLength(), Mode.getCharCountIndicator(data.mode, version));
        data.write(buffer);
      });
      const totalCodewords = Utils.getSymbolTotalCodewords(version);
      const ecTotalCodewords = ECCode.getTotalCodewordsCount(version, errorCorrectionLevel);
      const dataTotalCodewordsBits = (totalCodewords - ecTotalCodewords) * 8;
      if (buffer.getLengthInBits() + 4 <= dataTotalCodewordsBits) {
        buffer.put(0, 4);
      }
      while (buffer.getLengthInBits() % 8 !== 0) {
        buffer.putBit(0);
      }
      const remainingByte = (dataTotalCodewordsBits - buffer.getLengthInBits()) / 8;
      for (let i = 0; i < remainingByte; i++) {
        buffer.put(i % 2 ? 17 : 236, 8);
      }
      return createCodewords(buffer, version, errorCorrectionLevel);
    }
    function createCodewords(bitBuffer, version, errorCorrectionLevel) {
      const totalCodewords = Utils.getSymbolTotalCodewords(version);
      const ecTotalCodewords = ECCode.getTotalCodewordsCount(version, errorCorrectionLevel);
      const dataTotalCodewords = totalCodewords - ecTotalCodewords;
      const ecTotalBlocks = ECCode.getBlocksCount(version, errorCorrectionLevel);
      const blocksInGroup2 = totalCodewords % ecTotalBlocks;
      const blocksInGroup1 = ecTotalBlocks - blocksInGroup2;
      const totalCodewordsInGroup1 = Math.floor(totalCodewords / ecTotalBlocks);
      const dataCodewordsInGroup1 = Math.floor(dataTotalCodewords / ecTotalBlocks);
      const dataCodewordsInGroup2 = dataCodewordsInGroup1 + 1;
      const ecCount = totalCodewordsInGroup1 - dataCodewordsInGroup1;
      const rs = new ReedSolomonEncoder(ecCount);
      let offset = 0;
      const dcData = new Array(ecTotalBlocks);
      const ecData = new Array(ecTotalBlocks);
      let maxDataSize = 0;
      const buffer = new Uint8Array(bitBuffer.buffer);
      for (let b = 0; b < ecTotalBlocks; b++) {
        const dataSize = b < blocksInGroup1 ? dataCodewordsInGroup1 : dataCodewordsInGroup2;
        dcData[b] = buffer.slice(offset, offset + dataSize);
        ecData[b] = rs.encode(dcData[b]);
        offset += dataSize;
        maxDataSize = Math.max(maxDataSize, dataSize);
      }
      const data = new Uint8Array(totalCodewords);
      let index = 0;
      let i, r;
      for (i = 0; i < maxDataSize; i++) {
        for (r = 0; r < ecTotalBlocks; r++) {
          if (i < dcData[r].length) {
            data[index++] = dcData[r][i];
          }
        }
      }
      for (i = 0; i < ecCount; i++) {
        for (r = 0; r < ecTotalBlocks; r++) {
          data[index++] = ecData[r][i];
        }
      }
      return data;
    }
    function createSymbol(data, version, errorCorrectionLevel, maskPattern) {
      let segments;
      if (Array.isArray(data)) {
        segments = Segments.fromArray(data);
      } else if (typeof data === "string") {
        let estimatedVersion = version;
        if (!estimatedVersion) {
          const rawSegments = Segments.rawSplit(data);
          estimatedVersion = Version.getBestVersionForData(rawSegments, errorCorrectionLevel);
        }
        segments = Segments.fromString(data, estimatedVersion || 40);
      } else {
        throw new Error("Invalid data");
      }
      const bestVersion = Version.getBestVersionForData(segments, errorCorrectionLevel);
      if (!bestVersion) {
        throw new Error("The amount of data is too big to be stored in a QR Code");
      }
      if (!version) {
        version = bestVersion;
      } else if (version < bestVersion) {
        throw new Error(
          "\nThe chosen QR Code version cannot contain this amount of data.\nMinimum version required to store current data is: " + bestVersion + ".\n"
        );
      }
      const dataBits = createData(version, errorCorrectionLevel, segments);
      const moduleCount = Utils.getSymbolSize(version);
      const modules = new BitMatrix(moduleCount);
      setupFinderPattern(modules, version);
      setupTimingPattern(modules);
      setupAlignmentPattern(modules, version);
      setupFormatInfo(modules, errorCorrectionLevel, 0);
      if (version >= 7) {
        setupVersionInfo(modules, version);
      }
      setupData(modules, dataBits);
      if (isNaN(maskPattern)) {
        maskPattern = MaskPattern.getBestMask(
          modules,
          setupFormatInfo.bind(null, modules, errorCorrectionLevel)
        );
      }
      MaskPattern.applyMask(maskPattern, modules);
      setupFormatInfo(modules, errorCorrectionLevel, maskPattern);
      return {
        modules,
        version,
        errorCorrectionLevel,
        maskPattern,
        segments
      };
    }
    exports2.create = function create(data, options) {
      if (typeof data === "undefined" || data === "") {
        throw new Error("No input text");
      }
      let errorCorrectionLevel = ECLevel.M;
      let version;
      let mask;
      if (typeof options !== "undefined") {
        errorCorrectionLevel = ECLevel.from(options.errorCorrectionLevel, ECLevel.M);
        version = Version.from(options.version);
        mask = MaskPattern.from(options.maskPattern);
        if (options.toSJISFunc) {
          Utils.setToSJISFunction(options.toSJISFunc);
        }
      }
      return createSymbol(data, version, errorCorrectionLevel, mask);
    };
  }
});

// src/index.ts
var index_exports = {};
__export(index_exports, {
  COMANDA_FONT_SIZES: () => COMANDA_FONT_SIZES,
  DEFAULT_LOGO_SCALE: () => DEFAULT_LOGO_SCALE,
  ESC: () => ESC,
  FOODLY_FOOTER_PDF_WIDTH: () => FOODLY_FOOTER_PDF_WIDTH,
  FOODLY_FOOTER_PNG: () => FOODLY_FOOTER_PNG,
  LOGO_SCALES: () => LOGO_SCALES,
  MAX_LOGO_HEIGHT: () => MAX_LOGO_HEIGHT,
  MAX_LOGO_WIDTH_BYTES: () => MAX_LOGO_WIDTH_BYTES,
  center: () => center,
  escBeep: () => escBeep,
  escBold: () => escBold,
  escCashDrawerPulse: () => escCashDrawerPulse,
  escCut: () => escCut,
  escFontSize: () => escFontSize,
  escLeftMargin: () => escLeftMargin,
  formatDate: () => formatDate,
  formatMoney: () => formatMoney,
  formatTime: () => formatTime,
  isFoodlyFooterLine: () => isFoodlyFooterLine,
  labelMetodo: () => labelMetodo,
  leftRight: () => leftRight,
  qrFilaMarker: () => qrFilaMarker,
  qrMarker: () => qrMarker,
  renderCierreCaja: () => renderCierreCaja,
  renderComanda: () => renderComanda,
  renderComandaAnulacion: () => renderComandaAnulacion,
  renderCompra: () => renderCompra,
  renderCorreccion: () => renderCorreccion,
  renderDatosCliente: () => renderDatosCliente,
  renderFactura: () => renderFactura,
  renderFacturasTurno: () => renderFacturasTurno,
  renderGastosTurno: () => renderGastosTurno,
  renderNotaCredito: () => renderNotaCredito,
  renderPrecuenta: () => renderPrecuenta,
  renderReciboAbono: () => renderReciboAbono,
  renderReporteVentas: () => renderReporteVentas,
  renderReservasDia: () => renderReservasDia,
  renderRetirosCaja: () => renderRetirosCaja,
  renderStickerEntrega: () => renderStickerEntrega,
  renderStickerPrueba: () => renderStickerPrueba,
  renderTomaInventario: () => renderTomaInventario,
  renderVentasPLU: () => renderVentasPLU,
  sanitizeText: () => sanitizeText,
  stickerBitmapDesdeRgba: () => stickerBitmapDesdeRgba,
  textToEscPosBytes: () => textToEscPosBytes,
  tsplBeep: () => tsplBeep
});
module.exports = __toCommonJS(index_exports);

// src/types.ts
var COMANDA_FONT_SIZES = ["normal", "grande", "extra_grande"];

// src/foodly-footer.ts
var FOODLY_FOOTER_TEXT = "Desarrollado por foodly.com.co";
var FOODLY_FOOTER_RASTER = {
  widthBytes: 39,
  height: 30,
  data: "A///8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH///8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAfgf/4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf8P/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAfgP/AAAAAAAAAAAAADnAAAYAAAAAAAAHgAAAAZwAAAAAAAAAAAAA+AAAAAH+AAAAAAAAADnAAAYAAAAAAAAPgAAAAZwAAAAAAAAAAAAA/8AAAAH/gAAAAAAAADnAAAYAAAAAAAAOAAAAAZwAAAAAAAAAAAAA+AAAAAHDwAAAAAAAADnAAAYAAAAAAAAMAAAAAZwAAAAAAAAAAAAA//wAAAHAwfD4+HbsfDnHwPYfAHeD4dg/j4HwPZ3DgHw+Hc8AHw+A//n8AAHA4/n5/H78/znP4f4/wH/H+fg/H+P8f53DAPx/n/+APx/g/gP+AAHA5xmADnjxxznAc45xwHjOOeAMOOcc45zHAcDjnHHAcDjg+A//AAHA5hnADnDhg7nAcwZg4HDsHcAMMHYOwZzmAcDB3HHAcDBw4///gAHA5/3wfnDhg7nD8wZg4HDsHcAMMHYOwZxmAYDB3HHAYDBwz///gAHA5/h5/nDhg7nP8wZg4HDsHcAMMHYOwZxmAYDB3HHAYDBwn///AAHBxgAdjnDhg7nMcwZg4HDsHcAMMHYOwZx8AYDB3HHAYDBwP8P/AAHDxwgdjnDhxznMc45xwHHOOcAMOOcc45w8McDjnHHMcDjgf4H8AAH/g/n5/nDg/jnP8f4/gH/H8cAMH8P4f5w8OPx/HHHOPx/AfwAgAAH+AfHw/nDgfDnH8PYfAH+D4cAMD4HwPZw4MHw+HHHMHw+A/wAAAAAAAAAAAAAAAAAAAAAAAHAAAAAAAAAAAAA4AAAAAAAAAAAA/wAAAAAAAAAAAAAAAAAAAAAAAHAAAAAAAAAAAAAwAAAAAAAAAAAA/wAAAAAAAAAAAAAAAAAAAAAAAHAAAAAAAAAAAAHwAAAAAAAAAAAA/wAAAAAAAAAAAAAAAAAAAAAAAHAAAAAAAAAAAAHgAAAAAAAAAAAA/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
};
var FOODLY_FOOTER_PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAATgAAAAeAQAAAACQhj9YAAABrElEQVR42q2TQWsTQRTHfzO7NiOCGaGChaJrycGj1YuHFNaQgx/DQ86SntRDdQxF1IPNByjSD1J0LIHiQc0HkLixQkRB1xJ0V7YZD4XYJFTn4P/05vGbP+/NvCeKkHLKPyWHeEmmnlwC2od7mfn5uTqRDycsdnzajfl1GOUGXOMI9zBwODlzf7oamceAM9OcmMrIkgWqdqaeGb8QCJxW6sn8Onms+zxeu3Dp9ep93XErZn1nb5n+dyMJQqD30xVZukb2PkvibPtTQvPZ8DkY8+Je1yTplhQ/RkCR3P06d+oa5VvNN5Rye+7qoEg2ReGqm8FT+3aAnBs6QGBRum7g0ZlEfViMUKunl+jDkgVUU57VGHCL3TbAwWSbhhhAg5w/zJy4bQCOnZ7wchfj3MXB3heAYNLv8593uVkFRi4D2DZw51vkzn+EbGO/R9y1vZhhmrWlrQXQqZcrbcQrDlrtK/F+6QYsVCoNyDsNw2h5IZI8eAeipU4CLZRQkaGuQddUjVCZ6yAjHYOb0cY42h1H8q9Tp4797wm52I87sjkC57cf8H854cl5GsrQj/sNYliy+nsdPPYAAAAASUVORK5CYII=";
var FOODLY_FOOTER_PDF_WIDTH = FOODLY_FOOTER_RASTER.widthBytes * 8 * 72 / 203;
var FOODLY_FOOTER_MARKER = "";
function isFoodlyFooterLine(line) {
  if (!line.startsWith(FOODLY_FOOTER_MARKER)) return false;
  const text2 = line.slice(1).trimStart();
  return text2 === FOODLY_FOOTER_TEXT || text2 === "Foodly";
}

// src/escpos.ts
var import_qrcode = __toESM(require_qrcode(), 1);

// src/utils.ts
var METODO_LABELS = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  tarjeta_debito: "Tarjeta debito",
  tarjeta_credito: "Tarjeta credito",
  datafono: "Tarjeta",
  transferencia: "Transferencia",
  nequi: "Nequi",
  daviplata: "Daviplata",
  bold: "Bold",
  rappi_pay: "Rappi Pay",
  pse: "PSE",
  bonos: "Bonos",
  credito: "Credito",
  mixto: "Mixto"
};
function sanitizeText(value) {
  return String(value ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\r\n?/g, "\n").replace(/\t/g, " ").replace(/[^\x20-\x7E\n]/g, "");
}
function labelMetodo(raw) {
  const key = sanitizeText(raw || "efectivo").toLowerCase().trim();
  if (key.includes("+")) {
    return key.split("+").map((part) => labelMetodo(part.trim())).join(" + ");
  }
  return METODO_LABELS[key] || capitalize(key.replace(/_+/g, " ")) || "Efectivo";
}
function center(text2, width = 48) {
  const safe = sanitizeText(text2);
  if (safe.length >= width) return safe;
  return " ".repeat(Math.floor((width - safe.length) / 2)) + safe;
}
function leftRight(left, right, width = 48) {
  const safeLeft = sanitizeText(left);
  const safeRight = sanitizeText(right);
  const gap = width - safeLeft.length - safeRight.length;
  return safeLeft + " ".repeat(Math.max(gap, 1)) + safeRight;
}
function wrapWords(value, width) {
  const clean = String(value || "").trim();
  if (clean.length <= width) return [clean];
  const out = [];
  let actual = "";
  for (const palabra of clean.split(/\s+/)) {
    const tentativa = actual ? `${actual} ${palabra}` : palabra;
    if (tentativa.length <= width) {
      actual = tentativa;
      continue;
    }
    if (actual) out.push(actual);
    if (palabra.length > width) {
      for (let i = 0; i < palabra.length; i += width) out.push(palabra.slice(i, i + width));
      actual = out.pop() || "";
    } else {
      actual = palabra;
    }
  }
  if (actual) out.push(actual);
  return out;
}
function itemRow(qty, name, right, width = 48) {
  const qtyStr = String(Number(qty) || 1).padStart(2, " ");
  const safeRight = sanitizeText(right);
  const nameMax = Math.max(6, width - qtyStr.length - safeRight.length - 2);
  const nameStr = sanitizeText(name).substring(0, nameMax);
  return leftRight(`${qtyStr} ${nameStr}`, safeRight, width);
}
function rightPadMoney(value, width) {
  const safe = sanitizeText(value);
  return safe.length >= width ? safe : " ".repeat(width - safe.length) + safe;
}
function formatMoney(value) {
  return (Number(value) || 0).toLocaleString("es-CO");
}
function formatDate(date, timezone = "America/Bogota") {
  try {
    return sanitizeText(date.toLocaleDateString("es-CO", { timeZone: timezone }));
  } catch {
    return sanitizeText(date.toLocaleDateString("es-CO"));
  }
}
function formatTime(date, timezone = "America/Bogota") {
  try {
    return sanitizeText(date.toLocaleTimeString("es-CO", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    }));
  } catch {
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  }
}
var AVANCE_CORTE = ["", "", "", "", ""];
function footer(width = 48, text2) {
  const marca = text2 === void 0 ? FOODLY_FOOTER_MARKER + center(FOODLY_FOOTER_TEXT.length <= width ? FOODLY_FOOTER_TEXT : "Foodly", width) : center(text2.length > width ? text2.replace(/www\./i, "") : text2, width);
  return ["", marca, ...AVANCE_CORTE].join("\n");
}
function clampColumns(columns) {
  const numeric = Number(columns);
  if (!Number.isFinite(numeric)) return 48;
  return Math.min(80, Math.max(24, Math.floor(numeric)));
}
function capitalize(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : "";
}

// src/escpos.ts
var ESC = "\x1B";
var GS = "";
var MAX_LOGO_WIDTH_BYTES = 18;
var MAX_LOGO_HEIGHT = 80;
var LOGO_SCALES = [75, 100, 125, 150, 175, 200, 225, 250, 275, 300, 325, 350, 375, 400];
var DEFAULT_LOGO_SCALE = 200;
function rasterLogoBytes(logo) {
  if (!logo) return [];
  const { widthBytes, height, data } = logo;
  if (!Number.isInteger(widthBytes) || widthBytes < 1 || widthBytes > MAX_LOGO_WIDTH_BYTES || !Number.isInteger(height) || height < 1 || height > MAX_LOGO_HEIGHT || typeof data !== "string" || data.length !== Math.ceil(widthBytes * height / 3) * 4) return [];
  let image;
  try {
    image = atob(data);
  } catch {
    return [];
  }
  if (image.length !== widthBytes * height) return [];
  let firstInk = 0;
  let lastInk = image.length - 1;
  while (firstInk <= lastInk && image.charCodeAt(firstInk) === 0) firstInk++;
  if (firstInk > lastInk) return [];
  while (image.charCodeAt(lastInk) === 0) lastInk--;
  const top = Math.floor(firstInk / widthBytes);
  const inkHeight = Math.floor(lastInk / widthBytes) - top + 1;
  const scale = logo.escala !== void 0 && LOGO_SCALES.includes(logo.escala) ? logo.escala : DEFAULT_LOGO_SCALE;
  const width = widthBytes * 8;
  const paperDots = logo.columns === 48 ? 576 : 384;
  const ratio = Math.min(scale / 100, paperDots / width);
  const scaledWidth = Math.round(width * ratio);
  const scaledHeight = Math.max(1, Math.round(inkHeight * ratio));
  const scaledWidthBytes = Math.ceil(scaledWidth / 8);
  const raster = new Uint8Array(scaledWidthBytes * scaledHeight);
  for (let y = 0; y < scaledHeight; y++) {
    const sourceRow = (top + Math.floor(y * inkHeight / scaledHeight)) * widthBytes;
    for (let x = 0; x < scaledWidth; x++) {
      const sourceX = Math.floor(x * width / scaledWidth);
      if (image.charCodeAt(sourceRow + (sourceX >> 3)) & 128 >> sourceX % 8) {
        raster[y * scaledWidthBytes + (x >> 3)] |= 128 >> x % 8;
      }
    }
  }
  return [...centeredRasterBytes(scaledWidthBytes, scaledHeight, raster), 10];
}
function centeredRasterBytes(widthBytes, height, raster) {
  return [
    27,
    97,
    1,
    29,
    118,
    48,
    0,
    widthBytes & 255,
    widthBytes >> 8,
    height & 255,
    height >> 8,
    ...raster,
    27,
    97,
    0
  ];
}
var footerRasterBytes = centeredRasterBytes(
  FOODLY_FOOTER_RASTER.widthBytes,
  FOODLY_FOOTER_RASTER.height,
  Array.from(atob(FOODLY_FOOTER_RASTER.data), (byte) => byte.charCodeAt(0))
);
function escBold(active) {
  return ESC + (active ? "E" : "E\0");
}
function escFontSize(size) {
  const map = {
    1: "!\0",
    2: "!",
    3: "!",
    4: "!"
  };
  return map[size];
}
function escCut() {
  return GS + "V\0";
}
function escLeftMargin(dots = 0) {
  const safeDots = Math.max(0, Math.min(65535, Math.trunc(dots)));
  return GS + "L" + String.fromCharCode(safeDots & 255, safeDots >> 8 & 255);
}
function escCashDrawerPulse() {
  return ESC + "p\0\xFA";
}
function escBeep(count = 2, duration = 3) {
  const safeCount = Math.max(1, Math.min(9, Math.trunc(count)));
  const safeDuration = Math.max(1, Math.min(9, Math.trunc(duration)));
  return ESC + "B" + String.fromCharCode(safeCount, safeDuration);
}
var QR_SENTINEL = "";
function qrMarker(data, moduleSize = 6) {
  const size = Math.max(3, Math.min(8, Math.trunc(moduleSize)));
  return QR_SENTINEL + String.fromCharCode(size) + (data || "") + QR_SENTINEL;
}
function escQrCommandBytes(data, moduleSize) {
  const enc = [];
  for (const ch of data) enc.push(ch.charCodeAt(0) & 255);
  const store = enc.length + 3;
  return [
    27,
    97,
    1,
    // ESC a 1 — centrar
    29,
    40,
    107,
    4,
    0,
    49,
    65,
    50,
    0,
    // modelo 2
    29,
    40,
    107,
    3,
    0,
    49,
    67,
    moduleSize & 255,
    // tamaño módulo
    29,
    40,
    107,
    3,
    0,
    49,
    69,
    49,
    // corrección M
    29,
    40,
    107,
    store & 255,
    store >> 8 & 255,
    49,
    80,
    48,
    ...enc,
    // datos
    29,
    40,
    107,
    3,
    0,
    49,
    81,
    48,
    // imprimir
    27,
    97,
    0
    // ESC a 0 — volver a izquierda
  ];
}
var QR_FILA = "";
function qrFilaMarker(qrs, columns) {
  const size = columns >= 42 ? 5 : 4;
  const [a, b] = qrs.filter((qr) => qr.data);
  if (!a) return "";
  if (!b) return `${qrMarker(a.data, size)}
${center(a.rotulo, columns)}`;
  return `${qrMarker(a.data, size)}
${QR_FILA}${center(a.rotulo, columns).padEnd(columns)}
${qrMarker(b.data, size)}
${center(b.rotulo, columns)}`;
}
function qrFilaBytes(datos, columns) {
  try {
    const version = Math.max(...datos.map((d) => (0, import_qrcode.create)(d, { errorCorrectionLevel: "M" }).version));
    const [a, b] = datos.map((d) => (0, import_qrcode.create)(d, { errorCorrectionLevel: "M", version }).modules);
    const mitad = columns * 6;
    const punto = Math.min(5, Math.floor(mitad / (a.size + 6)));
    if (punto < 3) return null;
    const lado = a.size * punto;
    const recorte = Math.floor((mitad - lado) / 2 / 8) * 8;
    const widthBytes = (mitad - recorte) / 4;
    const xA = Math.floor((mitad - lado) / 2) - recorte;
    const blanco = punto * 4;
    const height = lado + blanco * 2;
    const raster = new Uint8Array(widthBytes * height);
    for (let y = 0; y < lado; y++) {
      const fila = Math.floor(y / punto);
      for (let x = 0; x < lado; x++) {
        const col = Math.floor(x / punto);
        for (const [simbolo, x0] of [[a, xA], [b, xA + mitad]]) {
          if (!simbolo.get(fila, col)) continue;
          raster[(blanco + y) * widthBytes + (x0 + x >> 3)] |= 128 >> (x0 + x) % 8;
        }
      }
    }
    return centeredRasterBytes(widthBytes, height, raster);
  } catch {
    return null;
  }
}
function filaDesdeSegmentos(segmentos, s) {
  const primero = /^\n\x1C([^\n]+)\n$/.exec(segmentos[s + 1] ?? "");
  const segundo = /^\n([^\n]*)/.exec(segmentos[s + 3] ?? "");
  if (!primero || !segundo) return null;
  const columns = primero[1].length;
  const imagen = qrFilaBytes([segmentos[s].slice(1), segmentos[s + 2].slice(1)], columns);
  if (!imagen) return null;
  const mitad = columns / 2;
  const rotulos = center(primero[1].trim(), mitad).padEnd(mitad) + center(segundo[1].trim(), mitad);
  segmentos[s + 3] = segmentos[s + 3].slice(segundo[0].length);
  return [...imagen, ...textSegmentToBytes(rotulos)];
}
function textSegmentToBytes(segment) {
  const bytes = [];
  for (let i = 0; i < segment.length; i++) {
    if (segment[i] === FOODLY_FOOTER_MARKER && (i === 0 || segment[i - 1] === "\n")) {
      const lineBreak = segment.indexOf("\n", i);
      const end = lineBreak === -1 ? segment.length : lineBreak;
      if (isFoodlyFooterLine(segment.slice(i, end))) {
        bytes.push(...footerRasterBytes);
        i = end - 1;
        continue;
      }
    }
    const code = segment.charCodeAt(i);
    if (code === 27 || code === 29 || code === 10 || code === 13) {
      bytes.push(code);
      if (code === 27 || code === 29) {
        const command = segment.charCodeAt(i + 1);
        if (Number.isFinite(command)) {
          bytes.push(command);
          const paramCount = escPosParamCount(code, command);
          for (let param = 0; param < paramCount && i + 2 + param < segment.length; param++) {
            bytes.push(segment.charCodeAt(i + 2 + param) & 255);
          }
          i += 1 + paramCount;
        }
      }
      continue;
    }
    const safe = sanitizeText(segment[i]);
    for (const safeChar of safe) {
      const safeCode = safeChar.charCodeAt(0);
      if (safeCode >= 32 && safeCode <= 126) bytes.push(safeCode);
    }
  }
  return bytes;
}
function textToEscPosBytes(text2, options = {}) {
  const bytes = [27, 64];
  if (options.openCashDrawer) bytes.push(...textSegmentToBytes(escCashDrawerPulse()));
  if (options.leftMarginDots !== void 0) bytes.push(...textSegmentToBytes(escLeftMargin(options.leftMarginDots)));
  const logo = rasterLogoBytes(options.logo);
  bytes.push(...logo);
  const document = [
    (text2 || "").replace(/^(?:[ \t]*(?:\r\n?|\n))+/, ""),
    options.cut ? escCut() : "",
    options.beepAfterPrint ? escBeep() : ""
  ].join("");
  const segmentos = document.split(QR_SENTINEL);
  for (let s = 0; s < segmentos.length; s++) {
    if (s % 2 === 1) {
      const fila = filaDesdeSegmentos(segmentos, s);
      if (fila) {
        bytes.push(...fila);
        s += 2;
        continue;
      }
      const seg = segmentos[s];
      const moduleSize = seg.charCodeAt(0) || 6;
      const data = seg.slice(1);
      if (data) bytes.push(...escQrCommandBytes(data, moduleSize));
    } else {
      bytes.push(...textSegmentToBytes(segmentos[s]));
    }
  }
  return new Uint8Array(bytes);
}
function escPosParamCount(prefix, command) {
  if (prefix === 27) {
    if (command === 66) return 2;
    if (command === 69) return 1;
    if (command === 112) return 3;
    if (command === 97) return 1;
    return 0;
  }
  if (prefix === 29) {
    if (command === 33) return 1;
    if (command === 76) return 2;
    if (command === 86) return 1;
    return 0;
  }
  return 0;
}

// src/renderers/comanda.ts
function wrap(text2, width) {
  const lines = [];
  for (const paragraph of text2.split("\n")) {
    let remaining = paragraph.trim();
    while (remaining.length > width) {
      const space = remaining.lastIndexOf(" ", width);
      const end = space > 0 ? space : width;
      lines.push(remaining.slice(0, end).trimEnd());
      remaining = remaining.slice(end).trimStart();
    }
    lines.push(remaining);
  }
  return lines;
}
function renderComanda(payload, options = {}) {
  return render(payload, options, payload.tipo_comanda === "anulacion");
}
function renderComandaAnulacion(payload, options = {}) {
  return render(payload, options, true);
}
function render(payload, options, anulacion) {
  const size = options.comandaFontSize === "extra_grande" ? 4 : options.comandaFontSize === "grande" ? 2 : 1;
  const width = clampColumns(options.columns) / (size === 4 ? 2 : 1);
  const now = options.now || /* @__PURE__ */ new Date();
  const timezone = options.timezone || "America/Bogota";
  const sep = "-".repeat(width);
  const sep2 = "=".repeat(width);
  const sepX = "X".repeat(width);
  const bold = (text2) => escBold(true) + text2 + escBold(false);
  const lines = [];
  function add(text2, style = {}) {
    for (const part of wrap(text2, width)) {
      const line = style.center ? center(part, width) : part;
      lines.push(style.bold ? bold(line) : line);
    }
  }
  function addPair(first, second, gap, style = {}) {
    const combined = first + gap + second;
    if (combined.length <= width && !combined.includes("\n")) {
      lines.push(style.center ? center(combined, width) : (style.bold ? bold(first) : first) + gap + second);
      return;
    }
    add(first, style);
    add(second, { center: style.center });
  }
  const secciones = !anulacion && Array.isArray(payload.secciones) && payload.secciones.length ? payload.secciones : null;
  const numero = "COMANDA #" + sanitizeText(payload.comanda || "");
  const area = sanitizeText(payload.area || "").toUpperCase();
  if (anulacion) {
    lines.push(sep2);
    add(width < 17 ? "* ANULACION *" : "*** ANULACION ***", { bold: true, center: true });
  }
  if (secciones) add(numero, { center: true });
  else addPair(numero, area, " | ", { center: true });
  lines.push(sep2);
  const mesa = sanitizeText(payload.mesa_nombre || "Mesa: " + (payload.mesa || "")).toUpperCase();
  addPair(mesa, "Mesero: " + sanitizeText(payload.mesero || ""), "   ", { bold: true });
  if (payload.cliente_nombre) add("Cliente: " + sanitizeText(payload.cliente_nombre), { bold: true });
  if (payload.localizador) add("Localizador: " + sanitizeText(payload.localizador), { bold: true });
  if (!anulacion && payload.comensales) add("Personas: " + sanitizeText(payload.comensales));
  const hora = payload.hora ? sanitizeText(payload.hora) : formatTime(now, timezone);
  addPair("Fecha: " + formatDate(now, timezone), "Hora: " + hora, "   ");
  function addItems(items) {
    for (const item of items || []) {
      const qty = sanitizeText(anulacion ? Math.abs(Number(item.cantidad) || 1) : item.cantidad || 1).padStart(3, " ");
      let prefix = qty + "  ";
      if (prefix.length >= width) {
        add(qty, { bold: true });
        prefix = "     ";
      }
      const name = sanitizeText(item.nombre || item.producto || "").toUpperCase();
      const continuation = " ".repeat(prefix.length);
      wrap(name, width - prefix.length).forEach((line, index) => {
        lines.push(bold((index === 0 ? prefix : continuation) + line));
      });
      if (item.comentario) {
        const indent = "      ";
        for (const line of wrap("> " + sanitizeText(item.comentario), width - indent.length)) lines.push(indent + line);
      }
      lines.push("");
    }
  }
  if (secciones) {
    for (const seccion of secciones) {
      lines.push(sep);
      add("* " + sanitizeText(seccion.area || "").toUpperCase() + " *", { bold: true, center: true });
      lines.push(sep);
      addItems(seccion.items);
    }
  } else {
    lines.push(sep);
    if (anulacion && payload.motivo) {
      add("MOTIVO: " + sanitizeText(payload.motivo).toUpperCase(), { bold: true });
      lines.push(sep);
    }
    if (anulacion) add(width < 17 ? "* NO PREPARAR *" : "** NO PREPARAR **", { bold: true, center: true });
    else lines.push("CANT  PRODUCTO");
    lines.push(sep);
    addItems(payload.items);
  }
  if (anulacion) {
    lines.push(sepX);
    add("** ANULADO **", { bold: true, center: true });
  }
  lines.push(anulacion ? sepX : sep2);
  if (size !== 1) {
    lines[0] = escFontSize(size) + lines[0];
    lines[lines.length - 1] += escFontSize(1);
  }
  return lines.concat("", "", "", "").join("\n");
}

// src/renderers/sticker-iconos.ts
var MOTO = [
  "..........................",
  "..........................",
  "..........................",
  "..........................",
  "..........................",
  "..........................",
  "..########................",
  "..########......#####.....",
  "..########......#####.....",
  "..########.....#####......",
  "..########.....#####......",
  "..########.....##.###.....",
  "..########....###.###.....",
  "..##############...##.....",
  ".###############...##.....",
  ".##############....###....",
  "....####...........####...",
  "...######.........######..",
  "...######.........######..",
  "...######.........######..",
  "...######.........######..",
  "....####...........####...",
  "......#..............#....",
  "..........................",
  "..........................",
  ".........................."
];
var BOLSA = [
  "..........................",
  "..........................",
  "...........####...........",
  "..........######..........",
  ".........########.........",
  "........###....###........",
  "........###....###........",
  "........##......##........",
  "........###....###........",
  "....##################....",
  "....##################....",
  "....##################....",
  "....##################....",
  "....##################....",
  "....##################....",
  "....##################....",
  "....##################....",
  "....##################....",
  "....##################....",
  "....##################....",
  "....##################....",
  "...####################...",
  "....##################....",
  "....##################....",
  "..........................",
  ".........................."
];
function desdeArte(filas) {
  return {
    ancho: filas[0].length,
    alto: filas.length,
    puntos: filas.join("").split("").map((c) => c === "#")
  };
}
var ICONO_MOTO = desdeArte(MOTO);
var ICONO_BOLSA = desdeArte(BOLSA);

// src/renderers/sticker.ts
var PUNTOS_MM = 8;
var CABEZAL = 384;
var MARGEN = 8;
var FUENTES = { "1": [8, 12], "2": [12, 20], "3": [16, 24], "4": [24, 32] };
var QR_CAJA = 100;
var QR_MAX = 78;
var ICONO = 36;
function renderStickerEntrega(data, options = {}) {
  const anchoMm = acotar(options.anchoMm, 30, 80, 50);
  const altoMm = acotar(options.altoMm, 20, 80, 30);
  const etiquetaAncho = anchoMm * PUNTOS_MM;
  const etiquetaAlto = altoMm * PUNTOS_MM;
  const x0 = MARGEN + Math.max(0, Math.floor((CABEZAL - etiquetaAncho) / 2));
  const ancho = Math.min(etiquetaAncho, CABEZAL) - 2 * MARGEN;
  const grande = altoMm >= 40;
  const mesa = texto(data.mesa_nombre);
  const llevar = /llevar/i.test(mesa);
  const cliente = isRecord(data.cliente) ? data.cliente : {};
  const p = new Programa();
  p.cmd(`SIZE ${anchoMm} mm,${altoMm} mm`);
  p.cmd("GAP 2 mm,0 mm");
  p.cmd("DIRECTION 1,0");
  p.cmd("REFERENCE 0,0");
  p.cmd("DENSITY 8");
  p.cmd("SET TEAR ON");
  p.cmd("CLS");
  const franjaAlto = grande ? 48 : 40;
  const yFranja = MARGEN;
  const icono = iconoDeFranja(options, llevar);
  const xTitulo = x0 + (icono ? 4 + 40 + 6 : 8);
  const hora = horaCorta(options.now || /* @__PURE__ */ new Date(), options.timezone || "America/Bogota");
  const xHora = x0 + ancho - 6 - hora.length * FUENTES["2"][0];
  const titulo = recortar((mesa || (llevar ? "Para llevar" : "Domicilio")).toUpperCase(), Math.floor((xHora - 8 - xTitulo) / FUENTES["3"][0]));
  p.texto(xTitulo, yFranja + (franjaAlto - 24) / 2, "3", titulo);
  p.texto(xHora, yFranja + (franjaAlto - 20) / 2, "2", hora);
  p.cmd(`REVERSE ${x0},${yFranja},${ancho},${franjaAlto}`);
  if (icono) p.bitmap(x0 + 4, yFranja + (franjaAlto - ICONO) / 2, iconoCircular(icono));
  let fondo = etiquetaAlto - MARGEN;
  const restaurante = texto(data.tenant_nombre);
  if (grande && restaurante) {
    const yPie = etiquetaAlto - MARGEN - FUENTES["2"][1];
    const nombre2 = recortar(restaurante, Math.floor(ancho / FUENTES["2"][0]));
    p.cmd(`BAR ${x0},${yPie - 6},${ancho},2`);
    p.texto(x0 + Math.floor((ancho - nombre2.length * FUENTES["2"][0]) / 2), yPie, "2", nombre2);
    fondo = yPie - 10;
  }
  let y = yFranja + franjaAlto + 8;
  const nombre = texto(cliente.nombre).toUpperCase();
  if (nombre) {
    const cabenGrande = Math.floor(ancho / FUENTES["4"][0]);
    let fuente = "4";
    let lineas = [nombre];
    if (nombre.length > cabenGrande) {
      if (llevar) lineas = envolver(nombre, cabenGrande, 2);
      else {
        fuente = "3";
        lineas = [recortar(nombre, Math.floor(ancho / FUENTES["3"][0]))];
      }
    }
    for (const l of lineas) {
      p.texto(x0, y, fuente, l);
      y += FUENTES[fuente][1] + 4;
    }
    y += 2;
  }
  const direccion = texto(cliente.direccion);
  const barrio = texto(cliente.barrio);
  const conQr = !llevar && options.qr !== false && anchoMm >= 50 && !!direccion && y + QR_CAJA - 1 <= fondo;
  const finQr = conQr ? y + QR_CAJA : 0;
  if (conQr) {
    p.cmd(`QRCODE ${x0 + ancho - QR_CAJA},${y},L,3,A,0,"${urlMaps([direccion, barrio, texto(data.ciudad)])}"`);
  }
  const anchoEn = (yLinea) => conQr && yLinea < finQr + 4 ? ancho - QR_CAJA - 8 : ancho;
  const linea = (fuente, valor, maxLineas = 1) => {
    const [w, h] = FUENTES[fuente];
    for (const l of envolver(valor, Math.floor(anchoEn(y) / w), maxLineas)) {
      if (y + h > fondo) return;
      p.texto(x0, y, fuente, l);
      y += h + 3;
    }
  };
  if (cliente.telefono) linea("3", `Tel ${texto(cliente.telefono)}`);
  if (!llevar && direccion) linea("2", direccion, 2);
  if (!llevar && barrio) linea("2", barrio);
  const nota = texto(cliente.notas);
  if (nota) {
    const fuente = grande || llevar ? "2" : "1";
    const [w, h] = FUENTES[fuente];
    if (grande) {
      const top = y + 2;
      const caja = anchoEn(top);
      const caben = Math.floor((fondo - top - 8) / (h + 3));
      const lineas = caben > 0 ? envolver(`Nota: ${nota}`, Math.floor((caja - 12) / w), caben) : [];
      if (lineas.length) {
        p.cmd(`BOX ${x0},${top},${x0 + caja},${top + 8 + lineas.length * (h + 3)},2`);
        lineas.forEach((l, i) => p.texto(x0 + 6, top + 5 + i * (h + 3), fuente, l));
      }
    } else {
      const caben = Math.floor((fondo - y) / (h + 3));
      if (caben > 0) linea(fuente, `Nota: ${nota}`, caben);
    }
  }
  p.cmd("PRINT 1,1");
  return p.bytes();
}
function renderStickerPrueba(options = {}) {
  return renderStickerEntrega({
    mesa_nombre: "Domicilio 1",
    tenant_nombre: options.empresa || "Foodly",
    cliente: {
      nombre: "Prueba de sticker",
      telefono: "300 000 0000",
      direccion: "Calle 1 # 2-3",
      barrio: "Centro",
      notas: "Si lees esto, la impresora de stickers funciona."
    }
  }, options);
}
function tsplBeep() {
  return ascii("SOUND 5,200\r\n");
}
function stickerBitmapDesdeRgba(rgba, ancho, alto) {
  const puntos = [];
  for (let i = 0; i < ancho * alto; i++) {
    const r = rgba[i * 4], g = rgba[i * 4 + 1], b = rgba[i * 4 + 2], a = rgba[i * 4 + 3];
    const luz = 0.299 * r + 0.587 * g + 0.114 * b;
    puntos.push(a > 110 && luz < 200);
  }
  return { ancho, alto, puntos };
}
function iconoDeFranja(options, llevar) {
  const tipo = options.icono || "logo";
  if (tipo === "ninguno") return null;
  if (tipo === "logo" && options.logo && options.logo.ancho > 0 && options.logo.alto > 0) return options.logo;
  return llevar ? ICONO_BOLSA : ICONO_MOTO;
}
function iconoCircular(dibujo) {
  const r = ICONO / 2;
  const ox = Math.floor((ICONO - Math.min(dibujo.ancho, 28)) / 2) - Math.max(0, Math.floor((dibujo.ancho - 28) / 2));
  const oy = Math.floor((ICONO - Math.min(dibujo.alto, 28)) / 2) - Math.max(0, Math.floor((dibujo.alto - 28) / 2));
  const filas = [];
  for (let y = 0; y < ICONO; y++) {
    const fila = [];
    for (let x = 0; x < ICONO; x++) {
      const dentro = (x - r + 0.5) ** 2 + (y - r + 0.5) ** 2 <= r * r;
      let tinta = !dentro;
      const dx = x - ox, dy = y - oy;
      if (dentro && dx >= 0 && dy >= 0 && dx < dibujo.ancho && dy < dibujo.alto) {
        tinta = Boolean(dibujo.puntos[dy * dibujo.ancho + dx]);
      }
      fila.push(tinta);
    }
    filas.push(fila);
  }
  return filas;
}
var Programa = class {
  constructor() {
    __publicField(this, "partes", []);
  }
  cmd(linea) {
    this.partes.push(ascii(`${linea}\r
`));
  }
  texto(x, y, fuente, valor) {
    if (valor) this.cmd(`TEXT ${Math.round(x)},${Math.round(y)},"${fuente}",0,1,1,"${valor}"`);
  }
  /** TSPL BITMAP: bit 1 = blanco, 0 = negro, el más alto a la izquierda; el relleno va negro. */
  bitmap(x, y, filas) {
    const alto = filas.length;
    const bytesFila = Math.ceil(filas[0].length / 8);
    const datos = new Uint8Array(bytesFila * alto);
    for (let fy = 0; fy < alto; fy++) {
      for (let b = 0; b < bytesFila; b++) {
        let v = 0;
        for (let bit = 0; bit < 8; bit++) {
          const fx = b * 8 + bit;
          if (fx < filas[fy].length && !filas[fy][fx]) v |= 128 >> bit;
        }
        datos[fy * bytesFila + b] = v;
      }
    }
    this.partes.push(ascii(`BITMAP ${Math.round(x)},${Math.round(y)},${bytesFila},${alto},0,`), datos, ascii("\r\n"));
  }
  bytes() {
    const total = this.partes.reduce((n, parte) => n + parte.length, 0);
    const salida = new Uint8Array(total);
    let i = 0;
    for (const parte of this.partes) {
      salida.set(parte, i);
      i += parte.length;
    }
    return salida;
  }
};
function texto(value) {
  return sanitizeText(value).replace(/\s+/g, " ").replace(/"/g, "'").replace(/\\/g, "/").trim();
}
function urlMaps(partes) {
  const base = "https://maps.google.com/?q=";
  const codificar2 = (valor) => encodeURIComponent(valor.trim()).replace(/%20/g, "+");
  let consulta = partes.filter(Boolean).join(", ");
  while (consulta && (base + codificar2(consulta)).length > QR_MAX) consulta = consulta.slice(0, -1);
  return base + codificar2(consulta);
}
function envolver(valor, maxChars, maxLineas) {
  if (maxChars < 1 || maxLineas < 1 || !valor) return [];
  const lineas = [];
  let actual = "";
  for (const palabra of valor.split(" ")) {
    let resto = palabra;
    while (resto.length > maxChars) {
      if (actual) {
        lineas.push(actual);
        actual = "";
      }
      lineas.push(resto.slice(0, maxChars));
      resto = resto.slice(maxChars);
    }
    if (!resto) continue;
    if (!actual) actual = resto;
    else if (actual.length + 1 + resto.length <= maxChars) actual += ` ${resto}`;
    else {
      lineas.push(actual);
      actual = resto;
    }
  }
  if (actual) lineas.push(actual);
  if (lineas.length <= maxLineas) return lineas;
  const visibles = lineas.slice(0, maxLineas);
  visibles[maxLineas - 1] = recortar(`${visibles[maxLineas - 1]} ${lineas[maxLineas]}`, maxChars, true);
  return visibles;
}
function recortar(valor, maxChars, siempreMarcar = false) {
  if (maxChars < 1) return "";
  if (valor.length <= maxChars && !siempreMarcar) return valor;
  if (maxChars <= 3) return valor.slice(0, maxChars);
  return `${valor.slice(0, maxChars - 3).trimEnd()}...`;
}
function horaCorta(fecha, timezone) {
  try {
    return fecha.toLocaleTimeString("en-US", { timeZone: timezone, hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase().replace(/\s+/g, " ");
  } catch {
    const h = fecha.getHours();
    return `${h % 12 || 12}:${String(fecha.getMinutes()).padStart(2, "0")} ${h >= 12 ? "pm" : "am"}`;
  }
}
function acotar(valor, min, max, defecto) {
  const n = Math.round(Number(valor));
  return Number.isFinite(n) && n > 0 ? Math.min(max, Math.max(min, n)) : defecto;
}
function ascii(valor) {
  const salida = new Uint8Array(valor.length);
  for (let i = 0; i < valor.length; i++) salida[i] = valor.charCodeAt(i) & 127;
  return salida;
}
function isRecord(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

// src/renderers/receipt-header.ts
function oneLine(value) {
  return sanitizeText(value).replace(/\s+/g, " ").trim();
}
function receiptContactLines(telefono, direccion, width) {
  const tel = oneLine(telefono);
  return [tel && `Tel: ${tel}`, oneLine(direccion)].filter(Boolean).flatMap((line) => wrapWords(line, width).map((part) => center(part, width)));
}
function receiptCustomerLines(customer, width) {
  const labelValue = (label, value) => {
    const text2 = oneLine(value);
    return text2 && `${label}: ${text2}`;
  };
  const name = labelValue("Cliente", customer.nombre);
  const phone = labelValue("Tel", customer.telefono);
  const address = labelValue("Dir", customer.direccion);
  const neighborhood = labelValue("Barrio", customer.barrio);
  const column = width >= 42 ? 25 : Math.floor(width / 2);
  const pair = (left, right) => {
    const leftLines = left ? wrapWords(left, column - 1) : [];
    const rightLines = right ? wrapWords(right, width - column) : [];
    return Array.from({ length: Math.max(leftLines.length, rightLines.length) }, (_, i) => {
      const leftLine = leftLines[i] ?? "";
      return rightLines[i] ? leftLine.padEnd(column) + rightLines[i] : leftLine;
    });
  };
  return phone || neighborhood ? [...pair(name, phone), ...pair(address, neighborhood)] : [name, address].filter(Boolean).flatMap((line) => wrapWords(line, width));
}
function receiptDetailsLines(mesa, mesero, width, now, timezone) {
  const nombreMesa = oneLine(mesa);
  const nombreMesero = oneLine(mesero);
  const fecha = `Fecha: ${formatDate(now, timezone)}`;
  const hora = `Hora: ${formatTime(now, timezone)}`;
  const atencion = nombreMesero ? `Mesero: ${nombreMesero}` : "";
  const column = width >= 42 ? 25 : Math.min(12, width - Math.max(hora.length, atencion.length));
  const fitsPair = (left, right) => Boolean(left && right && left.length + 2 <= column && right.length <= width - column);
  const servicePair = fitsPair(nombreMesa, atencion) && hora.length <= width - column;
  const lines = fitsPair(fecha, hora) ? [fecha.padEnd(column) + hora] : [fecha, servicePair ? hora.padStart(column + hora.length) : hora];
  const bold = (line) => escBold(true) + line + escBold(false);
  if (servicePair) {
    return [...lines, bold(nombreMesa) + " ".repeat(column - nombreMesa.length) + atencion];
  }
  return [
    ...lines,
    ...nombreMesa ? wrapWords(nombreMesa, width).map(bold) : [],
    ...atencion ? wrapWords(atencion, width) : []
  ];
}

// src/renderers/factura.ts
function renderFactura(factura, options = {}) {
  const width = clampColumns(options.columns);
  const timezone = options.timezone || "America/Bogota";
  const fiscal = factura.fe;
  const now = fechaValida(fiscal?.fecha_generacion) || options.now || /* @__PURE__ */ new Date();
  const encabezado = [];
  renderEncabezado(encabezado, factura, width);
  const datos = [];
  if (!fiscal) datos.push(center(factura.numero_factura || "PEDIDO", width));
  const mesa = factura.mesa_nombre || (factura.mesa_numero ? `Mesa: ${factura.mesa_numero}` : "");
  datos.push(...receiptDetailsLines(mesa, factura.mesero, width, now, timezone));
  renderCliente(datos, factura, width);
  const detalle = [];
  if (fiscal) renderItemsFiscales(detalle, factura.items || [], width, desgloseImpuestos(factura) !== null);
  else renderItems(detalle, factura.items || [], width);
  const totales = [];
  renderTotals(totales, factura, width);
  const pagos = [];
  renderPayments(pagos, factura, width);
  renderCambio(pagos, factura, width);
  const credito = [];
  renderCredito(credito, factura, width);
  const sep = "-".repeat(width);
  const lines = unirSecciones([encabezado, datos, detalle, totales, pagos, credito], sep);
  if (fiscal) {
    lines.push("=".repeat(width));
    renderFiscal(lines, fiscal, width);
  } else {
    lines.push(sep);
    lines.push(center("** SOLO PARA CONTROL INTERNO **", width));
  }
  lines.push(center("Gracias por su visita!", width));
  if (fiscal?.software) {
    lines.push(...AVANCE_CORTE);
  } else {
    lines.push(footer(width, options.footer));
  }
  const bono = [];
  renderBonoQr(bono, factura, width);
  if (bono.length > 0) {
    lines.push(escCut());
    lines.push(...bono);
    lines.push(...AVANCE_CORTE);
  }
  return lines.join("\n");
}
function fechaValida(valor) {
  if (typeof valor !== "string" || !valor) return null;
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}
function unirSecciones(secciones, sep) {
  const lines = [];
  for (const seccion of secciones) {
    if (seccion.length === 0) continue;
    if (lines.length > 0) lines.push(sep);
    lines.push(...seccion);
  }
  return lines;
}
function negrilla(linea) {
  return escBold(true) + linea + escBold(false);
}
function centrado(lines, texto2, width) {
  for (const l of wrapWords2(texto2, width)) lines.push(center(l, width));
}
function renderEncabezado(lines, factura, width) {
  const emisor = factura.fe?.emisor;
  if (!emisor?.razon_social) {
    if (factura.tenant_nombre) centrado(lines, sanitizeText(factura.tenant_nombre).toUpperCase(), width);
    if (factura.nit) lines.push(center(`NIT: ${factura.nit}`, width));
    lines.push(...receiptContactLines(factura.telefono, factura.direccion, width));
    return;
  }
  const marca = factura.tenant_nombre || emisor.nombre_comercial;
  if (marca && normalizar(marca) !== normalizar(emisor.razon_social)) {
    centrado(lines, sanitizeText(marca).toUpperCase(), width);
  }
  centrado(lines, sanitizeText(emisor.razon_social).toUpperCase(), width);
  if (emisor.nit) lines.push(center(`NIT: ${sanitizeText(emisor.nit)}`, width));
  lines.push(...receiptContactLines(factura.telefono, factura.direccion, width));
  for (const calidad of factura.fe?.responsabilidades || []) {
    if (calidad) centrado(lines, sanitizeText(calidad), width);
  }
}
var TIPO_DOC_SIGLA = {
  "13": "CC",
  "31": "NIT",
  "22": "CE",
  "41": "Pasaporte"
};
function normalizar(s) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}
function fiscalYaIdentifica(factura) {
  const adq = factura.fe?.adquirente;
  if (!adq) return false;
  const adqNorm = normalizar(adq);
  if (adqNorm.includes(normalizar("Consumidor Final"))) return false;
  const nombre = factura.cliente;
  const doc = factura.cliente_documento;
  if (doc) return adqNorm.includes(normalizar(doc));
  return !!nombre && adqNorm.includes(normalizar(nombre));
}
function renderCliente(lines, factura, width) {
  const duplicado = fiscalYaIdentifica(factura);
  const nombre = factura.cliente;
  lines.push(...receiptCustomerLines({
    nombre: duplicado || nombre === "Consumidor final" ? void 0 : nombre,
    telefono: factura.cliente_telefono,
    direccion: factura.cliente_direccion,
    barrio: factura.cliente_barrio
  }, width));
  if (!duplicado && factura.cliente_documento) {
    const sigla = TIPO_DOC_SIGLA[factura.cliente_tipo_documento ?? ""] ?? "Doc";
    lines.push(`${sigla}: ${sanitizeText(factura.cliente_documento)}`);
  }
  if (factura.localizador) lines.push(`Localizador: ${sanitizeText(factura.localizador)}`);
}
function renderFiscal(lines, fe, width) {
  centrado(lines, sanitizeText(fe.tipo_label || "DOCUMENTO ELECTRONICO"), width);
  lines.push(center(sanitizeText(fe.numero || ""), width));
  if (fe.adquirente) centrado(lines, sanitizeText(fe.adquirente), width);
  if (fe.fecha_expedicion) {
    lines.push(center(`Expedicion: ${sanitizeText(fe.fecha_expedicion)}`, width));
  }
  if (fe.resolucion) centrado(lines, sanitizeText(fe.resolucion), width);
  if (fe.cufe) {
    lines.push(center(fe.es_cufe === false ? "CUDE:" : "CUFE:", width));
    for (const l of wrap2(fe.cufe, width)) lines.push(center(l, width));
  }
  if (fe.qr) {
    lines.push("");
    lines.push(qrMarker(fe.qr, width >= 42 ? 7 : 5));
    lines.push("");
  }
  if (fe.url && !fe.qr) {
    lines.push(center("Verifica en la DIAN:", width));
    for (const l of wrap2(fe.url, width)) lines.push(center(l, width));
  }
  if (fe.software) {
    if (lines[lines.length - 1] !== "") lines.push("");
    for (const parte of sanitizeText(fe.software).split(" - ")) {
      centrado(lines, parte.trim(), width);
    }
  }
}
function wrapWords2(text2, width) {
  const clean = String(text2 || "").trim();
  if (clean.length <= width) return [clean];
  const out = [];
  let actual = "";
  for (const palabra of clean.split(/\s+/)) {
    if (palabra.length > width) {
      if (actual) {
        out.push(actual);
        actual = "";
      }
      out.push(...wrap2(palabra, width));
      continue;
    }
    const tentativa = actual ? `${actual} ${palabra}` : palabra;
    if (tentativa.length > width) {
      out.push(actual);
      actual = palabra;
    } else {
      actual = tentativa;
    }
  }
  if (actual) out.push(actual);
  return out;
}
function wrap2(text2, width) {
  const clean = String(text2 || "");
  if (clean.length <= width) return [clean];
  const out = [];
  for (let i = 0; i < clean.length; i += width) out.push(clean.slice(i, i + width));
  return out;
}
function renderItems(lines, items, width) {
  if (!items.length) return;
  if (width >= 42) lines.push("CANT  PRODUCTO                V.UNI    TOTAL");
  else lines.push(leftRight("CANT PRODUCTO", "TOTAL", width));
  for (const item of items) {
    if (width >= 42) {
      renderWideItem(lines, item);
    } else {
      renderNarrowItem(lines, item, width);
    }
  }
}
function renderItemsFiscales(lines, items, width, conLetras = false) {
  if (!items.length) return;
  const ancho = width >= 42;
  const anchoNombre = Math.max(8, width - 26);
  if (ancho) {
    lines.push(` # CANT ${"PRODUCTO".padEnd(anchoNombre, " ")} ${"V.UNI".padStart(8, " ")} ${"TOTAL".padStart(8, " ")}`);
  } else {
    lines.push(leftRight(" # CANT PRODUCTO", "TOTAL", width));
  }
  items.forEach((item, indice) => {
    const numero = String(indice + 1).padStart(2, " ");
    const letra = conLetras ? sanitizeText(item.letra_impuesto || "").substring(0, 1) : "";
    const cantidad = Number(item.cantidad) || 1;
    const precio = Number(item.precio_unitario) || 0;
    const descuento = Number(item.descuento_monto) || 0;
    const porcentaje2 = Number(item.descuento_porcentaje) || 0;
    const neto = item.es_cortesia ? 0 : Math.max(0, precio * cantidad - descuento);
    const nombre = sanitizeText(item.nombre || item.plato || "");
    if (ancho) {
      const total = item.es_cortesia ? "$0" : formatMoney(neto);
      const anchoTexto = letra ? anchoNombre - 2 : anchoNombre;
      const texto2 = nombre.substring(0, anchoTexto).padEnd(anchoTexto, " ") + (letra ? ` ${letra}` : "");
      lines.push(
        `${numero} ${String(cantidad).padStart(4, " ")} ${texto2} ${rightPadMoney(formatMoney(precio), 8)} ${rightPadMoney(total, 8)}`
      );
    } else {
      const derecha = `$${formatMoney(neto)}`;
      const izquierda = `${numero} ${cantidad}x `;
      if (letra) {
        const hueco = width - derecha.length - 3;
        const maxNombre = Math.max(4, hueco - izquierda.length);
        lines.push(`${`${izquierda}${nombre.substring(0, maxNombre)}`.padEnd(hueco, " ")} ${letra} ${derecha}`);
      } else {
        const maxNombre = Math.max(4, width - izquierda.length - derecha.length - 1);
        lines.push(leftRight(`${izquierda}${nombre.substring(0, maxNombre)}`, derecha, width));
      }
    }
    const identificacion = [
      item.codigo ? `Cod ${sanitizeText(item.codigo)}` : "",
      item.unidad ? sanitizeText(item.unidad) : ""
    ].filter(Boolean).join(" ");
    const marca = item.es_cortesia ? "** CORTESIA **" : descuento > 0 ? ancho && porcentaje2 > 0 ? `Dcto -${porcentaje2}% (-$${formatMoney(descuento)})` : `Dcto (-$${formatMoney(descuento)})` : "";
    const sangria = ancho ? "      " : "   ";
    const juntos = [identificacion, marca].filter(Boolean).join("  ");
    if (juntos && sangria.length + juntos.length <= width) {
      lines.push(sangria + juntos);
    } else {
      if (identificacion) lines.push(sangria + identificacion);
      if (marca) lines.push(sangria + marca);
    }
    if (item.es_cortesia || descuento > 0) {
      renderReason(lines, item.motivo_descuento || (ancho || item.es_cortesia ? item.comentario : void 0));
    }
  });
  lines.push(`Total items: ${items.length}`);
}
function renderWideItem(lines, item) {
  const qty = String(item.cantidad || 1).padStart(3, " ");
  const name = sanitizeText(item.nombre || item.plato || "").substring(0, 22).padEnd(22, " ");
  const price = Number(item.precio_unitario) || 0;
  const qtyNum = Number(item.cantidad) || 1;
  const descPct = Number(item.descuento_porcentaje) || 0;
  const descAmount = Number(item.descuento_monto) || 0;
  const gross = price * qtyNum;
  const net = gross - descAmount;
  if (item.es_cortesia) {
    lines.push(`${qty}  ${name} ${rightPadMoney(formatMoney(price), 8)}       $0`);
    lines.push("      ** CORTESIA **");
    renderReason(lines, item.motivo_descuento || item.comentario);
    return;
  }
  if (descAmount > 0) {
    lines.push(`${qty}  ${name} ${rightPadMoney(formatMoney(price), 8)} ${rightPadMoney(formatMoney(net), 8)}`);
    lines.push(`      ${descPct > 0 ? `Dcto -${descPct}% (-$${formatMoney(descAmount)})` : `Dcto (-$${formatMoney(descAmount)})`}`);
    renderReason(lines, item.motivo_descuento || item.comentario);
    return;
  }
  lines.push(`${qty}  ${name} ${rightPadMoney(formatMoney(price), 8)} ${rightPadMoney(formatMoney(gross), 8)}`);
}
function renderNarrowItem(lines, item, width) {
  const qtyNum = Number(item.cantidad) || 1;
  const price = Number(item.precio_unitario) || 0;
  const descAmount = Number(item.descuento_monto) || 0;
  const gross = price * qtyNum;
  const net = item.es_cortesia ? 0 : gross - descAmount;
  lines.push(itemRow(qtyNum, item.nombre || item.plato || "", `$${formatMoney(net)}`, width));
  if (item.es_cortesia) lines.push("   ** CORTESIA **");
  if (descAmount > 0) lines.push(`   Dcto (-$${formatMoney(descAmount)})`);
  renderReason(lines, item.motivo_descuento || (item.es_cortesia ? item.comentario : void 0));
}
function renderTotals(lines, factura, width) {
  const descMesa = Number(factura.descuento_monto) || 0;
  const subtotalVisible = (Number(factura.subtotal) || 0) + descMesa;
  const iva = Number(factura.monto_iva) || 0;
  const servicio = Number(factura.propina) || 0;
  const total = Number(factura.total) || 0;
  const imp = factura.fe?.impuesto;
  const desglose = desgloseImpuestos(factura);
  const conImpuesto = Boolean(desglose || imp && imp.monto > 0);
  if (descMesa > 0 || iva > 0 || conImpuesto || servicio > 0 || subtotalVisible !== total) {
    lines.push(leftRight("SUBTOTAL:", `$${formatMoney(subtotalVisible)}`, width));
  }
  if (descMesa > 0) {
    lines.push(leftRight("DESC. MESA:", `-$${formatMoney(descMesa)}`, width));
    const reason = factura.motivo_descuento || factura.motivo_descuento_mesa || factura.justificacion_descuento || factura.descuento_motivo;
    renderReason(lines, reason, "  Motivo: ");
    lines.push(leftRight("NETO:", `$${formatMoney(factura.subtotal)}`, width));
  }
  if (iva > 0) lines.push(leftRight("IVA:", `$${formatMoney(iva)}`, width));
  if (desglose) {
    renderDesgloseImpuestos(lines, desglose, width);
  } else if (imp && imp.monto > 0) {
    lines.push(leftRight("BASE GRAVABLE:", `$${formatMoney(imp.base)}`, width));
    lines.push(leftRight(`${imp.label} ${imp.tarifa}%:`, `$${formatMoney(imp.monto)}`, width));
  }
  if (servicio > 0) lines.push(leftRight("SERVICIO:", `$${formatMoney(servicio)}`, width));
  const totalPedido = leftRight("TOTAL PEDIDO:", `$ ${formatMoney(total)}`, width);
  const deliveryAmount = Number(factura.recaudo_domicilio_monto) || 0;
  if (deliveryAmount > 0) {
    const totalCliente = Number(factura.total_cliente) || total + deliveryAmount;
    lines.push(totalPedido);
    lines.push(leftRight("DOMICILIO:", `$${formatMoney(deliveryAmount)}`, width));
    lines.push(negrilla(leftRight("TOTAL A PAGAR:", `$ ${formatMoney(totalCliente)}`, width)));
  } else {
    lines.push(negrilla(totalPedido));
  }
}
function desgloseImpuestos(factura) {
  const filas = factura.fe?.impuestos;
  return Array.isArray(filas) && filas.length > 1 ? filas : null;
}
function conCentavos(valor) {
  return (Number(valor) || 0).toLocaleString("es-CO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
function valorEnColumna(valor, ancho) {
  const texto2 = conCentavos(valor);
  return rightPadMoney(texto2.length < ancho ? texto2 : formatMoney(Math.round(Number(valor) || 0)), ancho);
}
function renderDesgloseImpuestos(lines, filas, width) {
  const [anchoBase, anchoValor] = width >= 42 ? [14, 16] : [10, 11];
  const anchoNombre = Math.max(8, width - anchoBase - anchoValor);
  lines.push(`${"IMPUESTOS".padEnd(anchoNombre, " ")}${"BASE".padStart(anchoBase, " ")}${"VALOR".padStart(anchoValor, " ")}`);
  let total = 0;
  for (const fila of filas) {
    const nombre = `${sanitizeText(fila.letra).substring(0, 1)} ${sanitizeText(fila.nombre)}`;
    const excluido = fila.monto === void 0 || fila.monto === null;
    total += excluido ? 0 : Number(fila.monto) || 0;
    lines.push(
      (nombre.substring(0, anchoNombre).padEnd(anchoNombre, " ") + valorEnColumna(fila.base, anchoBase) + (excluido ? "" : valorEnColumna(Number(fila.monto) || 0, anchoValor))).trimEnd()
    );
  }
  lines.push(leftRight("TOTAL IMPUESTOS:", `$${conCentavos(total)}`, width));
}
function renderPayments(lines, factura, width) {
  const payments = factura.pagos || [];
  const forma = factura.fe?.forma_pago ? sanitizeText(factura.fe.forma_pago).toUpperCase() : "";
  const titulo = (dividido) => forma ? `FORMA DE PAGO: ${forma}${dividido ? " (DIVIDIDO)" : ""}` : `FORMAS DE PAGO${dividido ? " (DIVIDIDO)" : ""}`;
  if (payments.length > 1) {
    centrado(lines, titulo(true), width);
    for (const payment of payments) renderPayment(lines, payment, width, true);
    const totalCobrado = payments.reduce((sum, payment) => sum + Number(payment.monto || 0) + Number(payment.propina || 0), 0);
    lines.push(leftRight("TOTAL COBRADO:", `$${formatMoney(totalCobrado)}`, width));
  } else if (payments.length === 1) {
    centrado(lines, titulo(false), width);
    renderPayment(lines, payments[0], width, false);
  } else if (factura.metodo_pago) {
    centrado(lines, titulo(false), width);
    lines.push(leftRight(`${labelMetodo(factura.metodo_pago)}:`, `$${formatMoney(factura.total)}`, width));
  }
}
function renderPayment(lines, payment, width, detailed) {
  const method = labelMetodo(payment.metodo || payment.metodo_pago);
  const amount = Number(payment.monto) || 0;
  const tip = Number(payment.propina) || 0;
  if (detailed && tip > 0) {
    lines.push(`${method}:`);
    lines.push(leftRight("  Subtotal:", `$${formatMoney(amount)}`, width));
    lines.push(leftRight("  + Servicio:", `$${formatMoney(tip)}`, width));
    lines.push(leftRight("  Total metodo:", `$${formatMoney(amount + tip)}`, width));
    return;
  }
  lines.push(leftRight(`${method}:`, `$${formatMoney(amount)}`, width));
  if (tip > 0) lines.push(leftRight("  + Servicio:", `$${formatMoney(tip)}`, width));
}
function renderCambio(lines, factura, width) {
  const recibido = factura.efectivo_recibido;
  const cambio = factura.cambio;
  if (typeof recibido !== "number" || typeof cambio !== "number") return;
  if (!(recibido > 0) || !(cambio >= 0) || cambio > recibido) return;
  lines.push(leftRight("EFECTIVO RECIBIDO:", `$${formatMoney(recibido)}`, width));
  lines.push(leftRight("CAMBIO:", `$${formatMoney(cambio)}`, width));
}
function renderCredito(lines, factura, width) {
  const credito = factura.credito;
  const monto = Number(credito?.monto) || 0;
  if (!credito || monto <= 0) return;
  lines.push(negrilla(leftRight("A CREDITO:", `$${formatMoney(monto)}`, width)));
  if (credito.cliente) lines.push(`A nombre de: ${sanitizeText(credito.cliente)}`);
  const vence = fechaCorta(credito.vencimiento);
  if (vence) lines.push(leftRight("Vence:", vence, width));
  if (typeof credito.saldo_cliente === "number" && credito.saldo_cliente > 0) {
    lines.push(leftRight("Debe en total:", `$${formatMoney(credito.saldo_cliente)}`, width));
  }
  lines.push("");
  lines.push(`Firma: ${"_".repeat(Math.max(10, width - 8))}`);
}
function renderBonoQr(lines, factura, width) {
  const ticket = factura.bono_qr;
  const url = typeof ticket?.url === "string" ? ticket.url.trim() : "";
  const bonos = (ticket?.bonos || []).filter(
    (b) => Boolean(b) && Number(b.porcentaje) > 0 && Boolean(fechaCorta(b.desde)) && Boolean(fechaCorta(b.hasta))
  );
  if (!url || bonos.length === 0) return;
  if (bonos.length === 1) {
    const bono = bonos[0];
    centradoNegrilla(lines, `BONO VUELVE - ${bono.ruta}`, width);
    centrado(lines, `${porcentaje(bono)}% en tu proxima visita, del ${fechaCorta(bono.desde)} al ${fechaCorta(bono.hasta)}`, width);
  } else {
    centradoNegrilla(lines, `GANASTE ${bonos.length} BONOS VUELVE`, width);
    for (const bono of bonos) {
      centrado(lines, `${bono.ruta}: ${porcentaje(bono)}% del ${fechaCorta(bono.desde)} al ${fechaCorta(bono.hasta)}`, width);
    }
  }
  lines.push("");
  lines.push(qrMarker(url, width >= 42 ? 7 : 5));
  lines.push("");
  centradoNegrilla(lines, bonos.length === 1 ? "Escanea y reclama tu bono" : "Escanea y reclama tus bonos", width);
  if (bonos.length === 1) {
    const donde = dondeSeUsa(bonos[0]);
    if (donde) centrado(lines, donde, width);
    const tope = Number(bonos[0].tope) || 0;
    if (tope > 0) centrado(lines, `Sobre max. $${formatMoney(tope)} de compra.`, width);
  }
  const terminos = sanitizeText(ticket?.terminos || "").trim();
  if (terminos) {
    centrado(lines, "Aplican terminos y condiciones:", width);
    for (const l of wrapUrl(terminos, width)) lines.push(center(l, width));
  } else {
    centrado(lines, "Aplican terminos y condiciones.", width);
  }
  lines.push(center("Bonos por Foodly", width));
}
function wrapUrl(url, width) {
  if (url.length <= width) return [url];
  const tramos = url.split(/(?<=\/)/);
  const out = [];
  let actual = "";
  for (const tramo of tramos) {
    if (tramo.length > width) {
      if (actual) {
        out.push(actual);
        actual = "";
      }
      out.push(...wrap2(tramo, width));
      continue;
    }
    if ((actual + tramo).length > width) {
      out.push(actual);
      actual = tramo;
    } else {
      actual += tramo;
    }
  }
  if (actual) out.push(actual);
  return out;
}
function porcentaje(bono) {
  const pct = Number(bono.porcentaje) || 0;
  return Number.isInteger(pct) ? String(pct) : pct.toLocaleString("es-CO", { maximumFractionDigits: 2 });
}
function dondeSeUsa(bono) {
  const nombres = (bono.donde || []).map((n) => sanitizeText(n).trim()).filter(Boolean);
  const total = Math.max(Number(bono.total_restaurantes) || 0, nombres.length);
  if (total > 4 || total > nombres.length) return `En los ${total} restaurantes de la ruta.`;
  if (nombres.length === 0) return "";
  if (nombres.length === 1) return `En ${nombres[0]}.`;
  return `En ${nombres.slice(0, -1).join(", ")} o ${nombres[nombres.length - 1]}.`;
}
function centradoNegrilla(lines, texto2, width) {
  for (const l of wrapWords2(sanitizeText(texto2), width)) lines.push(negrilla(center(l, width)));
}
function fechaCorta(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
}
function renderReason(lines, reason, prefix = "      Motivo: ") {
  if (reason) lines.push(`${prefix}${sanitizeText(reason)}`);
}

// src/renderers/compra.ts
function renderCompra(data, options = {}) {
  const width = clampColumns(options.columns);
  const wrap3 = (value) => wrapWords(sanitizeText(value).replace(/\s+/g, " "), width);
  const fecha = new Date(data.registrado_en);
  const estados = { pendiente: "PENDIENTE DE PAGO", pagada: "PAGADA", anulada: "ANULADA", reversada: "REVERSADA" };
  const lines = [
    ...wrap3(data.empresa_nombre).map((line) => escBold(true) + center(line, width) + escBold(false)),
    ...data.empresa_nit ? wrap3("NIT: " + data.empresa_nit).map((line) => center(line, width)) : [],
    ...receiptContactLines(data.empresa_telefono, data.empresa_direccion, width),
    "-".repeat(width),
    center("COMPROBANTE DE COMPRA", width),
    center(data.numero, width),
    escBold(true) + center(estados[data.estado], width) + escBold(false),
    leftRight(formatDate(fecha, options.timezone), formatTime(fecha, options.timezone), width)
  ];
  if (data.registrado_por_nombre) lines.push(...wrap3("Registro: " + data.registrado_por_nombre));
  if (data.proveedor_nombre) lines.push(...wrap3("Proveedor: " + data.proveedor_nombre));
  if (data.proveedor_nit) lines.push(...wrap3("Doc: " + data.proveedor_nit));
  lines.push("-".repeat(width));
  lines.push(leftRight("INSUMO / CANTIDAD x PRECIO", "TOTAL", width));
  for (const item of data.lineas) {
    lines.push(...wrap3(item.nombre));
    const cantidad = Number(item.cantidad).toLocaleString("es-CO", { maximumFractionDigits: 4 });
    const medida = sanitizeText(item.unidad).replace(/\s+/g, " ");
    const precio = cantidad + " " + medida + " x $" + formatMoney(item.precio_unitario);
    const importe = "$" + formatMoney(item.subtotal);
    if (precio.length + importe.length + 1 <= width) lines.push(leftRight(precio, importe, width));
    else lines.push(...wrap3(precio), importe.padStart(width));
  }
  lines.push("-".repeat(width));
  const label = data.estado === "pendiente" ? "TOTAL POR PAGAR" : "TOTAL COMPRA";
  const total = "$" + formatMoney(data.total);
  const totalLines = label.length + total.length + 1 <= width ? [leftRight(label, total, width)] : [label, total.padStart(width)];
  lines.push(...totalLines.map((line) => escBold(true) + line + escBold(false)));
  if (data.metodo_pago) lines.push(...wrap3("Medio de pago: " + labelMetodo(data.metodo_pago)));
  if (data.pagado_por_nombre) lines.push(...wrap3("Pago: " + data.pagado_por_nombre));
  lines.push(footer(width, options.footer));
  return lines.join("\n");
}

// src/renderers/qr-entrega.ts
var QR_COMODO = 106;
var QR_MAX2 = 213;
var RUTA = "https://www.google.com/maps/dir/?api=1&destination=";
function limpio(value) {
  return sanitizeText(value).replace(/\s+/g, " ").trim();
}
function codificar(valor) {
  return encodeURIComponent(valor).replace(/%2C/g, ",");
}
function urlRuta(direccion, barrio, ciudad) {
  const armar = (dir2, conBarrio) => RUTA + codificar([dir2, conBarrio ? barrio : "", ciudad].filter(Boolean).join(", ")).replace(/%20/g, "+");
  const completa = armar(direccion, true);
  if (completa.length <= QR_MAX2) return completa;
  let dir = direccion;
  while (dir && armar(dir, false).length > QR_MAX2) dir = dir.slice(0, -1).trimEnd();
  return armar(dir, false);
}
function numeroWhatsapp(value) {
  const [primero] = limpio(value).split(/[/,;]|\by\b/i);
  const digitos = primero.replace(/\D/g, "");
  if (/^3\d{9}$/.test(digitos)) return `57${digitos}`;
  if (/^573\d{9}$/.test(digitos)) return digitos;
  return primero.trim().startsWith("+") && digitos.length >= 10 && digitos.length <= 15 ? digitos : "";
}
function urlWhatsapp(numero, nombre, restaurante) {
  const cliente = nombre.split(" ")[0].slice(0, 20);
  const saludo = `${cliente ? `Hola ${cliente}` : "Hola"}, voy en camino con tu domicilio`;
  const armar = (texto2) => `https://wa.me/${numero}?text=${codificar(texto2)}`;
  const conRestaurante = armar(`${saludo} de ${restaurante}`);
  return restaurante && conRestaurante.length <= QR_COMODO ? conRestaurante : armar(saludo);
}
function qrsDeEntrega(cliente, ciudad, restaurante) {
  const direccion = limpio(cliente.direccion);
  const numero = numeroWhatsapp(cliente.telefono);
  const qrs = [];
  if (direccion) qrs.push({ rotulo: "RUTA", data: urlRuta(direccion, limpio(cliente.barrio), limpio(ciudad)) });
  if (numero) qrs.push({ rotulo: "WHATSAPP", data: urlWhatsapp(numero, limpio(cliente.nombre), limpio(restaurante)) });
  return qrs;
}

// src/renderers/documents.ts
function renderPrecuenta(data, options = {}) {
  const ctx = context(options);
  const lines = header(data, "VERIFICACION DE PEDIDO", ctx);
  const subtotal = num(data.subtotal);
  const descuentoMesa = num(data.descuento_mesa ?? data.descuento_monto);
  const propinaPct = numOrDefault(data.porcentaje_propina_sugerida, 10);
  const propina = numOrDefault(data.propina_sugerida, Math.round(subtotal * propinaPct / 100));
  const total = num(data.total);
  const domicilio = num(data.recaudo_domicilio_monto);
  const mesaNombre = text(data.mesa_nombre || (data.mesa_numero ? `Mesa: ${data.mesa_numero}` : ""));
  const esDelivery = /domicilio|llevar/i.test(mesaNombre);
  lines.push(...receiptDetailsLines(mesaNombre, data.mesero, ctx.width, ctx.now, ctx.timezone));
  lines.push(ctx.sep);
  renderItemTable(lines, arr(data.items), ctx, "nombre", false);
  lines.push(leftRight("SUBTOTAL:", money(subtotal + descuentoMesa), ctx.width));
  if (descuentoMesa > 0) {
    lines.push(leftRight("DESC. MESA:", `-${money(descuentoMesa)}`, ctx.width));
    renderReason2(lines, data.motivo_descuento || data.motivo_descuento_mesa || data.justificacion_descuento || data.descuento_motivo);
    lines.push(leftRight("NETO:", money(subtotal), ctx.width));
  }
  if (num(data.monto_servicio) > 0 && !esDelivery) lines.push(leftRight("Servicio:", money(data.monto_servicio), ctx.width));
  if (num(data.monto_iva) > 0) lines.push(leftRight("IVA:", money(data.monto_iva), ctx.width));
  const totalEnNegrilla = (label, valor) => escBold(true) + leftRight(label, money(valor), ctx.width) + escBold(false);
  if (propina > 0 && !esDelivery) {
    const label = `SERVICIO SUGERIDO (${propinaPct}%):`;
    const importe = money(propina);
    const rotulo = label.length + 1 + importe.length > ctx.width ? label.replace("SERVICIO", "SERV.") : label;
    pushLabelValue(lines, rotulo, importe, ctx);
    lines.push(totalEnNegrilla("TOTAL + SERVICIO:", total + propina));
  } else if (domicilio > 0) {
    lines.push(leftRight("TOTAL PEDIDO:", money(total), ctx.width));
    lines.push(leftRight("DOMICILIO:", money(domicilio), ctx.width));
    lines.push(totalEnNegrilla("TOTAL A PAGAR:", num(data.total_cliente) || total + domicilio));
  } else {
    lines.push(totalEnNegrilla("TOTAL A PAGAR:", total));
  }
  lines.push(ctx.sep2);
  lines.push("");
  lines.push(center("Documento no fiscal", ctx.width));
  lines.push(center("Gracias por su visita!", ctx.width));
  lines.push(footer(ctx.width, options.footer));
  if (esDelivery && isRecord2(data.cliente) && !options.datosEntregaAparte) {
    lines.push("");
    lines.push("");
    lines.push("V\0");
    lines.push("\x1B@");
    lines.push("L\0\0");
    lines.push(renderDatosCliente(data, options));
  }
  return lines.join("\n");
}
function renderDatosCliente(data, options = {}) {
  const ctx = context(options);
  const cliente = isRecord2(data.cliente) ? data.cliente : void 0;
  const lines = [];
  if (!cliente) {
    lines.push(center("No hay datos de cliente.", ctx.width));
    lines.push(ctx.sep2);
    lines.push(footer(ctx.width, options.footer));
    return lines.join("\n");
  }
  lines.push(ctx.sep2);
  lines.push(escBold(true) + center("DATOS PARA ENTREGA", ctx.width) + escBold(false));
  lines.push(center(text(data.mesa_nombre).toUpperCase(), ctx.width));
  lines.push(ctx.sep2);
  lines.push("");
  lines.push(...receiptCustomerLines(cliente, ctx.width));
  if (cliente.notas) {
    lines.push(ctx.sep);
    lines.push(escBold(true) + "Notas:" + escBold(false));
    lines.push(text(cliente.notas));
  }
  const qrs = /domicilio/i.test(text(data.mesa_nombre)) ? qrsDeEntrega(cliente, data.ciudad, data.tenant_nombre) : [];
  if (qrs.length) lines.push(ctx.sep, qrFilaMarker(qrs, ctx.width));
  else lines.push("");
  lines.push(ctx.sep2);
  lines.push(footer(ctx.width, options.footer));
  return lines.join("\n");
}
function renderCierreCaja(data, options = {}) {
  const ctx = context(options);
  const esRelevo = text(data.tipo_cierre) === "relevo";
  const relevo = isRecord2(data.relevo) ? data.relevo : void 0;
  const lines = header(data, esRelevo ? "RELEVO DE TURNO" : "CIERRE DE CAJA", ctx);
  const metodos = arr(data.metodos_desglose);
  const tieneDesglose = metodos.length > 0;
  const gastos = isRecord2(data.gastos) ? data.gastos : void 0;
  const ingresosCaja = isRecord2(data.ingresos_caja) ? data.ingresos_caja : void 0;
  const domicilios = isRecord2(data.domicilios) ? data.domicilios : void 0;
  lines.push(leftRight("Cajero:", text(data.cajero), ctx.width));
  if (data.fecha_apertura) lines.push(leftRight("Apertura:", dateTime(data.fecha_apertura, ctx), ctx.width));
  lines.push(leftRight(esRelevo ? "Relevo:" : "Cierre:", dateTime(data.fecha_cierre || ctx.now, ctx), ctx.width));
  lines.push(ctx.sep);
  lines.push(escBold(true) + "VENTAS POR METODO DE PAGO" + escBold(false));
  lines.push(ctx.sep);
  if (tieneDesglose) {
    for (const item of metodos) {
      if (num(item.venta) > 0) lines.push(leftRight(`  ${labelMetodo(item.clave)}:`, money(item.venta), ctx.width));
    }
  } else {
    lines.push(leftRight("  Efectivo:", money(data.total_efectivo), ctx.width));
    lines.push(leftRight("  Datafono:", money(data.total_datafono), ctx.width));
    lines.push(leftRight("  Transferencia:", money(data.total_transferencia), ctx.width));
    if (num(data.total_credito) > 0) lines.push(leftRight("  Credito:", money(data.total_credito), ctx.width));
  }
  lines.push(ctx.sep);
  lines.push(escBold(true) + leftRight("TOTAL VENTAS:", money(data.total_ventas), ctx.width) + escBold(false));
  lines.push("");
  lines.push(escBold(true) + "SERVICIO" + escBold(false));
  lines.push(ctx.sep);
  if (tieneDesglose) {
    for (const item of metodos) {
      if (num(item.servicio) > 0) lines.push(leftRight(`  ${labelMetodo(item.clave)}:`, money(item.servicio), ctx.width));
    }
  } else {
    if (num(data.propina_efectivo) > 0) lines.push(leftRight("  Efectivo:", money(data.propina_efectivo), ctx.width));
    if (num(data.propina_datafono) > 0) lines.push(leftRight("  Datafono:", money(data.propina_datafono), ctx.width));
    if (num(data.propina_transferencia) > 0) lines.push(leftRight("  Transferencia:", money(data.propina_transferencia), ctx.width));
  }
  lines.push(ctx.sep);
  lines.push(escBold(true) + leftRight("TOTAL SERVICIO:", money(data.total_propinas), ctx.width) + escBold(false));
  lines.push("");
  if (num(data.num_anulaciones) > 0 || num(data.items_anulados) > 0) {
    lines.push(escBold(true) + "ANULACIONES" + escBold(false));
    lines.push(ctx.sep);
    if (num(data.num_anulaciones) > 0) lines.push(leftRight("  Pedidos anulados:", data.num_anulaciones, ctx.width));
    if (num(data.monto_anulaciones) > 0) lines.push(leftRight("  Monto anulado:", money(data.monto_anulaciones), ctx.width));
    if (num(data.items_anulados) > 0) lines.push(leftRight("  Items anulados:", data.items_anulados, ctx.width));
    lines.push("");
  }
  const totalIngreso = num(data.total_ingreso) || num(data.total_ventas) + num(data.total_propinas);
  lines.push(ctx.sep2);
  lines.push(escBold(true) + leftRight("TOTAL INGRESO:", money(totalIngreso), ctx.width) + escBold(false));
  lines.push(ctx.sep2);
  lines.push("");
  renderDiscountSummary(lines, data, ctx);
  renderExpenseSummary(lines, gastos, ctx);
  renderCashIncomeSummary(lines, ingresosCaja, ctx);
  renderCarteraSummary(lines, isRecord2(data.cartera) ? data.cartera : void 0, ctx);
  renderCashSummary(lines, data, metodos, gastos, ingresosCaja, domicilios, ctx);
  renderOrderSummary(lines, data, ctx);
  renderDeliverySummary(lines, domicilios, ctx);
  if (esRelevo && relevo) renderActaEntrega(lines, data, relevo, ctx);
  if (data.observaciones) {
    lines.push(ctx.sep);
    lines.push(`Obs: ${text(data.observaciones)}`);
  }
  lines.push(ctx.sep2);
  lines.push("");
  lines.push(center("** SOLO PARA CONTROL INTERNO **", ctx.width));
  lines.push(footer(ctx.width, options.footer));
  return lines.join("\n");
}
function renderGastosTurno(data, options = {}) {
  const ctx = context(options);
  const gastos = isRecord2(data.gastos) ? data.gastos : {};
  const items = arr(gastos.items);
  if (!items.length) return "";
  const lines = header(data, "EGRESOS DEL TURNO", ctx);
  lines.push(leftRight("Cajero:", text(data.cajero), ctx.width));
  lines.push(leftRight("Cierre:", dateTime(data.fecha_cierre || ctx.now, ctx), ctx.width));
  lines.push(ctx.sep);
  renderExpenseRows(lines, items, ctx);
  lines.push(ctx.sep);
  renderExpenseSummary(lines, gastos, ctx);
  lines.push(ctx.sep2);
  lines.push(center("** SOLO PARA CONTROL INTERNO **", ctx.width));
  lines.push(footer(ctx.width, options.footer));
  return lines.join("\n");
}
function renderFacturasTurno(data, options = {}) {
  const ctx = context(options);
  const facturas = arr(data.facturas);
  const lines = header(data, "PEDIDOS DEL TURNO", ctx);
  const cerradas = num(data.num_facturas_cerradas) || facturas.filter((f) => text(f.tipo || "cerrada").toLowerCase() === "cerrada").length;
  const anuladas = num(data.num_facturas_anuladas) || facturas.filter((f) => text(f.tipo).toLowerCase() === "anulada").length;
  const notas = num(data.num_notas_credito) || facturas.filter((f) => text(f.tipo).toLowerCase() === "nc").length;
  const totalCons = num(data.num_facturas_total) || cerradas + anuladas;
  lines.push(leftRight("Cajero:", text(data.cajero), ctx.width));
  lines.push(leftRight("Cierre:", dateTime(data.fecha_cierre || ctx.now, ctx), ctx.width));
  lines.push(ctx.sep);
  lines.push(leftRight("Pedidos cobrados:", cerradas, ctx.width));
  if (anuladas > 0) lines.push(leftRight("Pedidos anulados:", anuladas, ctx.width));
  if (notas > 0) lines.push(leftRight("Notas de ajuste:", notas, ctx.width));
  if (totalCons !== cerradas) lines.push(leftRight("Total consecutivos:", totalCons, ctx.width));
  lines.push(ctx.sep);
  lines.push(escBold(true) + (ctx.width >= 42 ? "PED       METODO              TOTAL" : "PED       TOTAL") + escBold(false));
  lines.push(ctx.sep);
  for (const factura of facturas) {
    renderFacturaTurno(lines, factura, ctx);
  }
  lines.push(ctx.sep2);
  lines.push(leftRight("Total ventas:", money(data.total_ventas), ctx.width));
  lines.push(leftRight("Total servicio:", money(data.total_propinas), ctx.width));
  lines.push(ctx.sep);
  lines.push(escBold(true) + leftRight("TOTAL INGRESO:", money(num(data.total_ingreso) || num(data.total_ventas) + num(data.total_propinas)), ctx.width) + escBold(false));
  lines.push(ctx.sep2);
  lines.push("");
  lines.push(center("** SOLO PARA CONTROL INTERNO **", ctx.width));
  lines.push(footer(ctx.width, options.footer));
  return lines.join("\n");
}
function renderVentasPLU(data, options = {}) {
  const ctx = context(options);
  const lines = header(data, "VENTAS POR PRODUCTO", ctx);
  const productos = arr(data.productos);
  lines.push(leftRight("Cajero:", text(data.cajero), ctx.width));
  lines.push(leftRight("Cierre:", dateTime(data.fecha_cierre || ctx.now, ctx), ctx.width));
  lines.push(ctx.sep);
  lines.push(escBold(true) + (ctx.width >= 42 ? "PRODUCTO                  CANT    TOTAL" : "PRODUCTO") + escBold(false));
  lines.push(ctx.sep);
  for (const item of productos) {
    if (ctx.width >= 42) {
      const nombre = text(item.nombre).substring(0, 24).padEnd(24, " ");
      lines.push(`${nombre} ${String(item.cantidad || 0).padStart(4, " ")} ${money(item.valor).padStart(10, " ")}`);
    } else {
      lines.push(text(item.nombre).substring(0, ctx.width));
      lines.push(leftRight(`  Cant: ${item.cantidad || 0}`, money(item.valor), ctx.width));
    }
  }
  const totalProductos = num(data.total_productos ?? data.total_valor);
  const descuentoMesa = num(data.total_descuento_mesa);
  const totalCuadre = num(data.total_cuadre) || totalProductos - descuentoMesa;
  lines.push(ctx.sep2);
  lines.push(escBold(true) + leftRight("Unidades vendidas:", data.total_items || 0, ctx.width) + escBold(false));
  lines.push(leftRight("Total productos:", money(totalProductos), ctx.width));
  if (descuentoMesa > 0) lines.push(leftRight("Desc. mesa:", `-${money(descuentoMesa)}`, ctx.width));
  lines.push(escBold(true) + leftRight("Total cuadre:", money(totalCuadre), ctx.width) + escBold(false));
  lines.push(ctx.sep2);
  lines.push(center("** SOLO PARA CONTROL INTERNO **", ctx.width));
  lines.push(footer(ctx.width, options.footer));
  return lines.join("\n");
}
function renderReporteVentas(data, options = {}) {
  const ctx = context(options);
  const lines = header(data, "REPORTE DE VENTAS", ctx);
  lines.push(leftRight("Periodo:", `${text(data.desde)} a ${text(data.hasta)}`, ctx.width));
  lines.push(leftRight("Generado:", dateTime(ctx.now, ctx), ctx.width));
  lines.push(ctx.sep);
  if (isRecord2(data.resumen)) {
    const r = data.resumen;
    lines.push(escBold(true) + "RESUMEN" + escBold(false));
    lines.push(ctx.sep);
    lines.push(leftRight("  Pedidos:", r.total_facturas || 0, ctx.width));
    lines.push(leftRight("  Venta bruta:", money(r.venta_bruta), ctx.width));
    if (num(r.total_descuentos) > 0) lines.push(leftRight("  Descuentos:", `-${money(r.total_descuentos)}`, ctx.width));
    lines.push(leftRight("  Venta neta:", money(r.venta_neta), ctx.width));
    if (num(r.total_propinas) > 0) lines.push(leftRight("  Propinas:", money(r.total_propinas), ctx.width));
    lines.push(leftRight("  Ticket prom:", money(r.ticket_promedio), ctx.width));
    lines.push(leftRight("  Comensales:", r.total_comensales || 0, ctx.width));
    lines.push("");
  }
  const productos = arr(data.productos);
  if (productos.length) {
    lines.push(ctx.sep2);
    lines.push(escBold(true) + "PRODUCTOS VENDIDOS" + escBold(false));
    lines.push(ctx.sep);
    let totalCant = 0;
    let totalIngreso = 0;
    for (const p of productos) {
      const cant = num(p.cantidad);
      const ingreso = num(p.ingreso_neto);
      totalCant += cant;
      totalIngreso += ingreso;
      if (ctx.width >= 42) {
        lines.push(`${String(cant).padStart(3, " ")}   ${text(p.nombre).substring(0, 16).padEnd(16, " ")} ${money(ingreso).padStart(12, " ")}`);
      } else {
        lines.push(`${String(cant).padStart(3, " ")} ${text(p.nombre).substring(0, ctx.width - 5)}`);
        lines.push(leftRight("  Ingreso:", money(ingreso), ctx.width));
      }
    }
    lines.push(ctx.sep);
    lines.push(escBold(true) + leftRight(`TOTAL (${totalCant})`, money(totalIngreso), ctx.width) + escBold(false));
    lines.push("");
  }
  const metodos = arr(data.metodos);
  if (metodos.length) {
    lines.push(ctx.sep2);
    lines.push(escBold(true) + "METODOS DE PAGO" + escBold(false));
    lines.push(ctx.sep);
    for (const metodo of metodos) {
      lines.push(leftRight(`  ${labelMetodo(metodo.metodo)}:`, money(metodo.total), ctx.width));
    }
  }
  lines.push(ctx.sep2);
  lines.push(center("** SOLO PARA CONTROL INTERNO **", ctx.width));
  lines.push(footer(ctx.width, options.footer));
  return lines.join("\n");
}
function renderCorreccion(data, options = {}) {
  const ctx = context(options);
  const lines = [];
  lines.push(ctx.sep2);
  lines.push(escBold(true) + center("CORRECCION DE PEDIDO", ctx.width) + escBold(false));
  lines.push(ctx.sep2);
  lines.push(leftRight("Pedido:", data.numero_factura || "N/A", ctx.width));
  if (data.mesa_numero) lines.push(leftRight("Mesa:", data.mesa_numero, ctx.width));
  if (data.mesero) lines.push(leftRight("Mesero:", text(data.mesero), ctx.width));
  lines.push(leftRight("Fecha:", formatDate(ctx.now, ctx.timezone), ctx.width));
  lines.push(leftRight("Hora:", formatTime(ctx.now, ctx.timezone), ctx.width));
  if (data.corregido_por) lines.push(leftRight("Corregido por:", text(data.corregido_por), ctx.width));
  lines.push(ctx.sep);
  lines.push(escBold(true) + "CAMBIOS REALIZADOS" + escBold(false));
  lines.push(ctx.sep);
  for (const cambio of arr(data.cambios)) {
    const campo = text(cambio.campo);
    if (campo === "metodo_pago") {
      lines.push(leftRight("  Metodo anterior:", text(cambio.anterior).toUpperCase(), ctx.width));
      lines.push(leftRight("  Metodo nuevo:", text(cambio.nuevo).toUpperCase(), ctx.width));
    } else if (campo === "servicio") {
      lines.push(leftRight("  Servicio anterior:", money(cambio.anterior), ctx.width));
      lines.push(leftRight("  Servicio nuevo:", money(cambio.nuevo), ctx.width));
    } else if (campo === "total") {
      lines.push(leftRight("  Total anterior:", money(cambio.anterior), ctx.width));
      lines.push(leftRight("  Total nuevo:", money(cambio.nuevo), ctx.width));
    } else if (campo === "pagos") {
      lines.push("  Pagos anteriores:");
      renderCorrectionPayments(lines, arr(cambio.anterior), ctx);
      lines.push("  Pagos nuevos:");
      renderCorrectionPayments(lines, arr(cambio.nuevo), ctx);
    }
    lines.push("");
  }
  lines.push(ctx.sep);
  lines.push(escBold(true) + `Motivo: ${text(data.motivo || "No especificado")}` + escBold(false));
  lines.push(ctx.sep2);
  lines.push(center("DOCUMENTO DE AUDITORIA", ctx.width));
  lines.push(center("Conservar para registros", ctx.width));
  lines.push(footer(ctx.width, options.footer));
  return lines.join("\n");
}
function renderNotaCredito(data, options = {}) {
  const ctx = context(options);
  const detalle = isRecord2(data.detalle) ? data.detalle : {};
  const lines = header(data, "*** NOTA DE AJUSTE ***", ctx);
  if (data.numero_nota) lines.push(center(text(data.numero_nota), ctx.width));
  lines.push(ctx.sep2);
  lines.push(leftRight("Pedido anulado:", text(data.factura_original), ctx.width));
  pushDateTime(lines, ctx);
  lines.push(text(data.mesa_nombre || `Mesa: ${data.mesa_numero || ""}`));
  if (data.mesero) lines.push(`Mesero: ${text(data.mesero)}`);
  lines.push(ctx.sep);
  renderItemTable(lines, arr(detalle.items_anulados), ctx, "plato_nombre");
  const subtotal = num(detalle.subtotal_original);
  const descMesa = num(detalle.descuento_monto_mesa);
  lines.push(leftRight("SUBTOTAL:", money(subtotal + descMesa), ctx.width));
  if (descMesa > 0) {
    const pct = num(detalle.descuento_porcentaje_mesa);
    lines.push(leftRight(pct > 0 ? `DESC. MESA (${pct}%):` : "DESC. MESA:", `-${money(descMesa)}`, ctx.width));
    renderReason2(lines, detalle.motivo_descuento);
    lines.push(leftRight("NETO:", money(subtotal), ctx.width));
  }
  if (num(detalle.monto_iva_original) > 0) lines.push(leftRight("IVA:", money(detalle.monto_iva_original), ctx.width));
  if (num(detalle.servicio_original) > 0) lines.push(leftRight("SERVICIO:", money(detalle.servicio_original), ctx.width));
  if (num(detalle.recaudo_domicilio_monto) > 0) lines.push(leftRight("DOMICILIO:", money(detalle.recaudo_domicilio_monto), ctx.width));
  lines.push(ctx.sep2);
  lines.push(escBold(true) + leftRight("TOTAL ANULADO:", money(data.monto_anulado), ctx.width) + escBold(false));
  lines.push(ctx.sep2);
  renderPayments2(lines, arr(detalle.pagos), detalle.metodo_pago, data.monto_anulado, ctx);
  lines.push(ctx.sep2);
  lines.push("");
  lines.push(escBold(true) + "MOTIVO DE ANULACION:" + escBold(false));
  lines.push(text(data.motivo || "No especificado"));
  lines.push("");
  lines.push(ctx.sep2);
  lines.push(center("** SOLO PARA CONTROL INTERNO **", ctx.width));
  lines.push(center("Nota de Ajuste - Conservar", ctx.width));
  lines.push(footer(ctx.width, options.footer));
  return lines.join("\n");
}
function renderReciboAbono(data, options = {}) {
  const ctx = context(options);
  const fecha = data.fecha ? new Date(String(data.fecha)) : null;
  if (fecha && !Number.isNaN(fecha.getTime())) ctx.now = fecha;
  const bloques = [];
  const encabezado = [];
  if (data.tenant_nombre) encabezado.push(center(text(data.tenant_nombre).toUpperCase(), ctx.width));
  if (data.nit) encabezado.push(center(`NIT: ${text(data.nit)}`, ctx.width));
  bloques.push(encabezado);
  const datos = [];
  datos.push(escBold(true) + center("RECIBO DE ABONO", ctx.width) + escBold(false));
  if (data.numero) datos.push(center(text(data.numero), ctx.width));
  if (data.reimpresion) datos.push(center("(REIMPRESION)", ctx.width));
  pushDateTime(datos, ctx);
  if (data.cliente) datos.push(`Cliente: ${text(data.cliente)}`);
  if (data.cliente_documento) datos.push(`Doc: ${text(data.cliente_documento)}`);
  if (data.cliente_telefono) datos.push(`Tel: ${text(data.cliente_telefono)}`);
  bloques.push(datos);
  const valor = [];
  valor.push(escBold(true) + leftRight("VALOR RECIBIDO:", money(data.monto), ctx.width) + escBold(false));
  if (data.metodo) valor.push(leftRight("Metodo:", labelMetodo(String(data.metodo)), ctx.width));
  if (data.referencia) valor.push(`Ref: ${text(data.referencia)}`);
  bloques.push(valor);
  const aplicaciones = arr(data.aplicaciones);
  if (aplicaciones.length) {
    const aplicado = ["APLICADO A:"];
    for (const a of aplicaciones) {
      aplicado.push(leftRight(`  ${text(a.pedido || "Saldo anterior")}`, money(a.monto), ctx.width));
    }
    bloques.push(aplicado);
  }
  const saldos = [];
  saldos.push(escBold(true) + leftRight("SALDO PENDIENTE:", money(data.saldo_pendiente), ctx.width) + escBold(false));
  if (num(data.saldo_a_favor) > 0) saldos.push(leftRight("Saldo a favor:", money(data.saldo_a_favor), ctx.width));
  if (data.recibido_por) saldos.push(`Recibio: ${text(data.recibido_por)}`);
  saldos.push("");
  saldos.push(`Firma: ${"_".repeat(Math.max(10, ctx.width - 8))}`);
  bloques.push(saldos);
  const lines = [];
  for (const bloque of bloques) {
    if (!bloque.length) continue;
    if (lines.length) lines.push(ctx.sep);
    lines.push(...bloque);
  }
  lines.push(footer(ctx.width, options.footer));
  return lines.join("\n");
}
function renderTomaInventario(data, options = {}) {
  const ctx = context(options);
  const lines = header(data, "TOMA DE INVENTARIO", ctx);
  const items = arr(data.items);
  const ciego = data.modo_ciego === true;
  const blank = "_".repeat(ctx.width >= 42 ? 8 : 6);
  const sistW = 8;
  const nameW = Math.max(8, ctx.width - blank.length - sistW - 2);
  if (data.bodega) lines.push(leftRight("Bodega:", text(data.bodega), ctx.width));
  if (data.generado_por) lines.push(leftRight("Genera:", text(data.generado_por), ctx.width));
  pushDateTime(lines, ctx);
  lines.push(ctx.sep);
  lines.push(escBold(true) + (ctx.width >= 42 ? "PRODUCTO              SISTEMA   FISICO" : `${"PRODUCTO".padEnd(nameW)} ${"SIST".padStart(sistW)} FISICO`) + escBold(false));
  lines.push(ctx.sep);
  if (!items.length) lines.push(center("Sin productos para tomar.", ctx.width));
  for (const item of items) {
    const nombre = text(item.nombre || item.producto);
    const unidad = text(item.unidad || item.unidad_medida || "u");
    const sist = ciego ? blank : `${formatQty(item.stock_actual ?? item.stock ?? item.existencia)} ${unidad}`.trim();
    if (ctx.width >= 42) {
      lines.push(`${nombre.substring(0, 20).padEnd(20, " ")} ${sist.padStart(8, " ")}  ${blank}`);
    } else {
      lines.push(`${nombre.substring(0, nameW).padEnd(nameW, " ")} ${sist.padStart(sistW, " ")} ${blank}`);
    }
  }
  lines.push(ctx.sep2);
  lines.push(leftRight("Total productos:", items.length, ctx.width));
  lines.push("");
  lines.push(center("Cuente el fisico, anote en FISICO", ctx.width));
  lines.push(center("y registre la toma en el sistema.", ctx.width));
  lines.push("");
  lines.push(leftRight("Contado por:", "________________", ctx.width));
  lines.push(leftRight("Firma:", "________________", ctx.width));
  lines.push(ctx.sep2);
  lines.push(center("** SOLO PARA CONTROL INTERNO **", ctx.width));
  lines.push(footer(ctx.width, options.footer));
  return lines.join("\n");
}
function renderReservasDia(data, options = {}) {
  const ctx = context(options);
  const lines = header(data, "RESERVAS DEL DIA", ctx);
  const reservas = arr(data.reservas);
  const personas = reservas.reduce((sum, reserva) => sum + num(reserva.personas), 0);
  const rayaMesa = "_".repeat(Math.max(10, ctx.width - 10));
  lines.push(escBold(true) + center(fechaAgenda(data, ctx), ctx.width) + escBold(false));
  lines.push(`Impreso: ${formatDate(ctx.now, ctx.timezone)} ${formatTime(ctx.now, ctx.timezone)}`);
  if (data.generado_por) lines.push(`Genera:  ${text(data.generado_por)}`);
  lines.push(ctx.sep2);
  if (!reservas.length) {
    lines.push("");
    lines.push(center("Sin reservas para este dia.", ctx.width));
    lines.push("");
    lines.push(ctx.sep2);
    lines.push(footer(ctx.width, options.footer));
    return lines.join("\n");
  }
  for (const reserva of reservas) {
    const hora = hora12(reserva.hora);
    const pers = `${num(reserva.personas) || 1} pers`;
    const nombreMax = Math.max(6, ctx.width - hora.length - pers.length - 2);
    const nombre = text(reserva.nombre_cliente || reserva.nombre).toUpperCase().substring(0, nombreMax);
    lines.push(escBold(true) + leftRight(`${hora} ${nombre}`, pers, ctx.width) + escBold(false));
    if (reserva.zona_preferida) {
      pushWrapped(lines, "Zona preferida", reserva.zona_preferida, ctx);
    }
    pushWrapped(lines, "Mesa asignada", text(reserva.mesa || reserva.ubicacion) || rayaMesa, ctx);
    if (reserva.motivo) pushWrapped(lines, "Motivo", reserva.motivo, ctx);
    if (reserva.notas) pushWrapped(lines, "Notas", reserva.notas, ctx);
    lines.push(ctx.sep);
  }
  lines.push(leftRight("Total reservas:", reservas.length, ctx.width));
  lines.push(leftRight("Total personas:", personas, ctx.width));
  lines.push(ctx.sep2);
  lines.push("");
  for (const linea of wrapWords("Organice las mesas segun esta agenda.", ctx.width)) {
    lines.push(center(linea, ctx.width));
  }
  lines.push(footer(ctx.width, options.footer));
  return lines.join("\n");
}
function pushWrapped(lines, label, value, ctx) {
  const partes = wrapWords(`${label}: ${text(value)}`, ctx.width - 4);
  lines.push(`  ${partes[0]}`);
  for (const parte of partes.slice(1)) lines.push(`    ${parte}`);
}
function hora12(raw) {
  const [h, m] = String(raw ?? "").split(":");
  const hora = Number(h);
  if (!Number.isFinite(hora)) return text(raw).substring(0, 8).padStart(8, " ");
  const minutos = String(m ?? "00").padStart(2, "0").substring(0, 2);
  const sufijo = hora >= 12 ? "PM" : "AM";
  return `${String(hora % 12 || 12).padStart(2, " ")}:${minutos} ${sufijo}`;
}
var DIAS_SEMANA = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];
var MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre"
];
function fechaAgenda(data, ctx) {
  if (data.fecha_legible) return text(data.fecha_legible);
  const [y, m, d] = String(data.fecha || "").split("-").map(Number);
  if (!y || !m || !d) return formatDate(ctx.now, ctx.timezone);
  const fecha = new Date(y, m - 1, d);
  const dia = `${DIAS_SEMANA[fecha.getDay()]} ${d} de ${MESES[m - 1]}`;
  return ctx.width >= 42 ? `${dia} de ${y}` : dia;
}
function renderItemTable(lines, items, ctx, nameKey = "nombre", renderOperationalComments = true) {
  if (!items.length) return;
  lines.push(ctx.width >= 42 ? "CANT  PRODUCTO                V.UNI    TOTAL" : leftRight("CANT PRODUCTO", "TOTAL", ctx.width));
  lines.push(ctx.sep);
  for (const item of items) renderItem(lines, item, ctx, nameKey, renderOperationalComments);
  lines.push(ctx.sep);
}
function renderItem(lines, item, ctx, nameKey, renderOperationalComments) {
  const qty = num(item.cantidad) || 1;
  const name = text(item[nameKey] || item.plato || item.producto || item.plato_nombre);
  const unit = num(item.precio_unitario);
  const descAmount = num(item.descuento_monto);
  const descPct = num(item.descuento_porcentaje);
  const gross = unit * qty;
  const net = item.es_cortesia ? 0 : gross - descAmount;
  if (ctx.width >= 42) {
    lines.push(`${String(qty).padStart(3, " ")}  ${name.substring(0, 22).padEnd(22, " ")} ${rightPadMoney(formatMoney(unit), 8)} ${rightPadMoney(`$${formatMoney(net)}`, 8)}`);
  } else {
    lines.push(itemRow(qty, name, money(net), ctx.width));
  }
  if (item.es_cortesia) lines.push("      ** CORTESIA **");
  if (descAmount > 0) lines.push(`      ${descPct > 0 ? `Dcto -${descPct}% (-${money(descAmount)})` : `Dcto (-${money(descAmount)})`}`);
  renderReason2(lines, item.motivo_descuento || (item.es_cortesia ? item.comentario : void 0));
  if (renderOperationalComments && item.comentario && !item.es_cortesia && !item.motivo_descuento) {
    lines.push(`      > ${text(item.comentario)}`);
  }
}
function renderPayments2(lines, pagos, metodoPago, total, ctx) {
  if (pagos.length > 1) {
    lines.push(center("FORMAS DE PAGO (DIVIDIDO)", ctx.width));
    lines.push(ctx.sep);
    for (const pago of pagos) {
      const metodo = labelMetodo(pago.metodo || pago.metodo_pago);
      const monto = num(pago.monto);
      const propina = num(pago.propina);
      lines.push(`${metodo}:`);
      lines.push(leftRight("  Subtotal:", money(monto), ctx.width));
      if (propina > 0) lines.push(leftRight("  + Servicio:", money(propina), ctx.width));
      lines.push(leftRight("  Total metodo:", money(monto + propina), ctx.width));
      lines.push(ctx.sep);
    }
  } else if (pagos.length === 1) {
    const pago = pagos[0];
    lines.push(center("FORMA DE PAGO", ctx.width));
    lines.push(ctx.sep);
    lines.push(leftRight(`${labelMetodo(pago.metodo || pago.metodo_pago)}:`, money(pago.monto), ctx.width));
    if (num(pago.propina) > 0) lines.push(leftRight("  + Servicio:", money(pago.propina), ctx.width));
  } else if (metodoPago) {
    lines.push(center("FORMA DE PAGO", ctx.width));
    lines.push(ctx.sep);
    lines.push(leftRight(`${labelMetodo(metodoPago)}:`, money(total), ctx.width));
  }
}
function renderFacturaTurno(lines, factura, ctx) {
  const tipo = text(factura.tipo || "cerrada").toLowerCase();
  const numero = text(factura.numero_factura).padEnd(8, " ");
  if (tipo === "anulada") {
    lines.push(`${numero}  ANULADA ${money(factura.total).padStart(Math.max(10, ctx.width - 18), " ")}`);
    const nota = isRecord2(factura.nota_credito) ? factura.nota_credito : void 0;
    if (nota?.numero) lines.push(`  >> Anulada por ${text(nota.numero)}`);
    if (nota?.motivo) lines.push(`     Motivo: ${text(nota.motivo)}`);
    if (!nota && factura.motivo_anulacion) lines.push(`  >> ${text(factura.motivo_anulacion)}`);
    return;
  }
  if (tipo === "nc") {
    lines.push(`[NA]      Nota de Ajuste ${money(factura.total).padStart(10, " ")}`);
    const nota = isRecord2(factura.nota_credito) ? factura.nota_credito : void 0;
    if (nota?.numero) lines.push(`  >> ${text(nota.numero)}: ${text(nota.motivo || "ajuste")}`);
    return;
  }
  if (ctx.width >= 42) {
    const metodo = text(labelMetodo(factura.metodo_pago)).substring(0, 18).padEnd(18, " ");
    lines.push(`${numero}  ${metodo}  ${money(factura.total).padStart(14, " ")}`);
  } else {
    lines.push(`${numero} ${money(factura.total)}`);
    lines.push(`  ${labelMetodo(factura.metodo_pago)}`);
  }
  if (factura.factura_origen_nc) lines.push("  >> Refactura (origen NA)");
  for (const pago of arr(factura.pagos)) {
    const prop = num(pago.propina) > 0 ? ` +serv ${money(pago.propina)}` : "";
    lines.push(`          ${labelMetodo(pago.metodo)}: ${money(pago.monto)}${prop}`);
  }
}
function renderDiscountSummary(lines, data, ctx) {
  const totalDesc = num(data.total_descuentos);
  const totalCort = num(data.total_cortesias);
  if (totalDesc <= 0 && totalCort <= 0) return;
  lines.push(escBold(true) + "DESCUENTOS Y CORTESIAS" + escBold(false));
  lines.push(ctx.sep);
  if (num(data.total_descuentos_mesa) > 0) lines.push(leftRight("  Dcto Mesa:", `-${money(data.total_descuentos_mesa)}`, ctx.width));
  if (num(data.total_descuentos_items) > 0) lines.push(leftRight("  Dcto Items:", `-${money(data.total_descuentos_items)}`, ctx.width));
  if (totalCort > 0) lines.push(leftRight("  Cortesias:", `-${money(totalCort)}`, ctx.width));
  lines.push(ctx.sep);
  lines.push(escBold(true) + leftRight("TOTAL DCTOS:", `-${money(totalDesc + totalCort)}`, ctx.width) + escBold(false));
  lines.push("");
}
function renderExpenseRows(lines, items, ctx) {
  const valores = items.map((item) => money(item.monto));
  const valorW = Math.max(...valores.map((valor) => valor.length));
  if (ctx.width >= 42) {
    const metodoW = 8;
    const categoriaW = 11;
    const conceptoW2 = Math.max(8, ctx.width - valorW - metodoW - categoriaW - 3);
    const fila = (concepto, categoria, metodo, valor) => `${concepto.padEnd(conceptoW2)} ${categoria.padEnd(categoriaW)} ${metodo.padEnd(metodoW)} ${valor.padStart(valorW)}`;
    items.forEach((item, i) => {
      lines.push(fila(
        text(item.concepto).trim().substring(0, conceptoW2),
        recortarPalabras(text(item.categoria).trim() || "-", categoriaW),
        metodoCorto(item.metodo_pago, metodoW),
        valores[i]
      ));
      renderExpenseNotes(lines, item, ctx);
    });
    return;
  }
  const conceptoW = ctx.width - valorW - 1;
  items.forEach((item, i) => {
    lines.push(`${text(item.concepto).trim().substring(0, conceptoW).padEnd(conceptoW)} ${valores[i].padStart(valorW)}`);
    const metodo = labelMetodo(item.metodo_pago);
    const categoriaW = Math.max(6, ctx.width - 5 - metodo.length);
    const categoria = recortarPalabras(text(item.categoria).trim() || "Sin categoria", categoriaW);
    lines.push(`  ${categoria} - ${metodo}`.substring(0, ctx.width));
    renderExpenseNotes(lines, item, ctx);
  });
}
function renderExpenseNotes(lines, item, ctx) {
  const proveedor = isRecord2(item.proveedor) ? item.proveedor : void 0;
  if (proveedor?.nombre) pushWrapped(lines, "Prov", proveedor.nombre, ctx);
  if (item.observacion) pushWrapped(lines, "Obs", item.observacion, ctx);
}
function metodoCorto(raw, width) {
  const label = labelMetodo(raw);
  if (label.length <= width) return label;
  if (label.toLowerCase() === "transferencia") return "Transf.";
  const primera = label.split(" ")[0];
  return primera.length <= width ? primera : `${label.substring(0, width - 1)}.`;
}
function recortarPalabras(value, width) {
  if (value.length <= width) return value;
  const corte = value.substring(0, width);
  const espacio = value.charAt(width) === " " ? width : corte.lastIndexOf(" ");
  const base = espacio >= Math.ceil(width / 2) ? corte.substring(0, espacio) : corte;
  return base.replace(/\s*\([^)]*$/, "").replace(/[\s/,;:(.-]+$/, "") || corte;
}
function renderExpenseSummary(lines, gastos, ctx) {
  if (!gastos || num(gastos.total) <= 0) return;
  lines.push(escBold(true) + "EGRESOS DEL TURNO" + escBold(false));
  lines.push(ctx.sep);
  for (const metodo of arr(gastos.por_metodo)) {
    lines.push(leftRight(`  ${labelMetodo(metodo.metodo)}:`, `-${money(metodo.total)}`, ctx.width));
  }
  lines.push(ctx.sep);
  lines.push(escBold(true) + leftRight("TOTAL EGRESOS:", `-${money(gastos.total)}`, ctx.width) + escBold(false));
  lines.push("");
}
function renderCashIncomeSummary(lines, ingresosCaja, ctx) {
  if (!ingresosCaja || num(ingresosCaja.total_efectivo) <= 0) return;
  lines.push(escBold(true) + "INGRESOS DE CAJA" + escBold(false));
  lines.push(ctx.sep);
  for (const ingreso of arr(ingresosCaja.items)) {
    lines.push(leftRight(`  ${text(ingreso.concepto || "Ingreso").substring(0, 28)}:`, money(ingreso.monto), ctx.width));
  }
  lines.push(ctx.sep);
  lines.push(escBold(true) + leftRight("TOTAL INGRESOS:", money(ingresosCaja.total_efectivo), ctx.width) + escBold(false));
  lines.push("");
}
function renderRetirosCaja(retiros, columns) {
  if (!isRecord2(retiros) || num(retiros.total_efectivo) <= 0) return [];
  const width = clampColumns(columns);
  const label = "- Retiros de caja:";
  const total = `-${money(retiros.total_efectivo)}`;
  const lines = label.length + total.length < width ? [leftRight(label, total, width)] : [label, rightPadMoney(total, width)];
  for (const retiro of arr(retiros.items)) {
    if (retiro.estado === "reversado" || num(retiro.monto) <= 0) continue;
    const amount = money(retiro.monto);
    const concepto = text(retiro.concepto).replace(/\s+/g, " ").trim() || "Retiro";
    const espacioConcepto = width - amount.length - 3;
    if (espacioConcepto < 4) {
      for (const line of wrapWords(concepto, width - 2)) lines.push(`  ${line}`);
      lines.push(rightPadMoney(amount, width));
      continue;
    }
    const [first, ...rest] = wrapWords(concepto, espacioConcepto);
    lines.push(leftRight(`  ${first}`, amount, width));
    for (const line of rest) lines.push(`    ${line}`);
  }
  return lines;
}
function renderCarteraSummary(lines, cartera, ctx) {
  if (!cartera || num(cartera.total) <= 0) return;
  lines.push(escBold(true) + "RECAUDO DE CARTERA" + escBold(false));
  lines.push(ctx.sep);
  for (const metodo of arr(cartera.por_metodo)) {
    if (num(metodo.total) > 0) lines.push(leftRight(`  ${labelMetodo(text(metodo.metodo))}:`, money(metodo.total), ctx.width));
  }
  lines.push(ctx.sep);
  const abonos = num(cartera.num_abonos);
  lines.push(escBold(true) + leftRight(abonos > 0 ? `TOTAL ABONOS (${abonos}):` : "TOTAL ABONOS:", money(cartera.total), ctx.width) + escBold(false));
  lines.push("");
}
function renderCashSummary(lines, data, metodos, gastos, ingresosCaja, domicilios, ctx) {
  const efectivo = metodos.length ? metodos.find((m) => text(m.clave) === "efectivo") : void 0;
  const ventaEf = efectivo ? num(efectivo.venta) : num(data.total_efectivo);
  const servicioEf = efectivo ? num(efectivo.servicio) : num(data.propina_efectivo);
  const gastosEf = arr(gastos?.por_metodo).find((m) => text(m.metodo) === "efectivo");
  lines.push(ctx.sep2);
  lines.push(escBold(true) + "RESUMEN EFECTIVO" + escBold(false));
  lines.push(ctx.sep);
  lines.push(leftRight("Inicial:", money(data.efectivo_inicial), ctx.width));
  lines.push(leftRight("+ Ventas:", money(ventaEf), ctx.width));
  lines.push(leftRight("+ Propinas:", money(servicioEf), ctx.width));
  if (num(ingresosCaja?.total_efectivo) > 0) lines.push(leftRight("+ Ingresos caja:", money(ingresosCaja?.total_efectivo), ctx.width));
  const cartera = isRecord2(data.cartera) ? data.cartera : void 0;
  if (num(cartera?.efectivo) > 0) lines.push(leftRight("+ Abonos cartera:", money(cartera?.efectivo), ctx.width));
  if (num(gastosEf?.total) > 0) lines.push(leftRight("- Egresos:", `-${money(gastosEf?.total)}`, ctx.width));
  if (num(domicilios?.recaudado_efectivo) > 0) lines.push(leftRight("+ Domicilio:", money(domicilios?.recaudado_efectivo), ctx.width));
  if (num(domicilios?.liquidado_efectivo) > 0) lines.push(leftRight("- Liq. domicilio:", `-${money(domicilios?.liquidado_efectivo)}`, ctx.width));
  lines.push(...renderRetirosCaja(data.retiros_caja, ctx.width));
  lines.push(ctx.sep);
  lines.push(escBold(true) + leftRight("Esperado:", money(data.efectivo_esperado), ctx.width) + escBold(false));
  lines.push(leftRight("Contado:", money(data.efectivo_contado), ctx.width));
  const diff = num(data.diferencia);
  lines.push(escBold(true) + leftRight("DIFERENCIA:", `${diff >= 0 ? "+" : "-"}${money(Math.abs(diff))} ${diff === 0 ? "OK" : diff > 0 ? "(sobrante)" : "(faltante)"}`, ctx.width) + escBold(false));
  lines.push(ctx.sep2);
  lines.push("");
}
function renderOrderSummary(lines, data, ctx) {
  lines.push(escBold(true) + "RESUMEN DE PEDIDOS" + escBold(false));
  lines.push(ctx.sep);
  lines.push(leftRight("Pedidos cobrados:", data.num_facturas_cerradas || data.num_facturas || 0, ctx.width));
  if (num(data.num_facturas_anuladas) > 0) lines.push(leftRight("Pedidos anulados:", data.num_facturas_anuladas, ctx.width));
  if (num(data.num_notas_credito) > 0) lines.push(leftRight("Notas de ajuste:", data.num_notas_credito, ctx.width));
  if (num(data.num_facturas_total) > 0) lines.push(leftRight("Total consecutivos:", data.num_facturas_total, ctx.width));
}
function renderDeliverySummary(lines, dom, ctx) {
  if (!dom || num(dom.total_recaudado) <= 0) return;
  lines.push(ctx.sep2);
  lines.push(escBold(true) + "DOMICILIOS" + escBold(false));
  lines.push(ctx.sep);
  lines.push(leftRight("Pedidos:", dom.num_pedidos || 0, ctx.width));
  lines.push(leftRight("Recaudado:", money(dom.total_recaudado), ctx.width));
  if (num(dom.total_liquidado) > 0) lines.push(leftRight("Liquidado:", `-${money(dom.total_liquidado)}`, ctx.width));
  lines.push(ctx.sep);
  lines.push(escBold(true) + leftRight("PENDIENTE:", money(dom.pendiente), ctx.width) + escBold(false));
  const liquidaciones = arr(dom.liquidaciones);
  if (liquidaciones.length) {
    lines.push("");
    for (const liq of liquidaciones) {
      lines.push(leftRight(`  ${text(liq.nombre)}`, money(liq.monto), ctx.width));
      lines.push(`  (${text(liq.metodo_salida)})`);
    }
  }
}
function renderActaEntrega(lines, data, relevo, ctx) {
  lines.push(ctx.sep2);
  lines.push(escBold(true) + center("ACTA DE ENTREGA DE CAJA", ctx.width) + escBold(false));
  lines.push(ctx.sep);
  pushLabelValue(lines, "Entrega:", data.cajero, ctx);
  pushLabelValue(lines, "Recibe:", relevo.recibido_por_nombre, ctx);
  lines.push(leftRight("Efectivo contado:", money(data.efectivo_contado), ctx.width));
  if (num(relevo.retiro_monto) > 0) {
    lines.push(leftRight("- Retiro:", `-${money(relevo.retiro_monto)}`, ctx.width));
    const concepto = text(relevo.retiro_concepto).replace(/\s+/g, " ").trim();
    if (concepto) {
      const partes = wrapWords(concepto, ctx.width - 4);
      partes.forEach((parte, i) => {
        lines.push(`${i === 0 ? "  (" : "   "}${parte}${i === partes.length - 1 ? ")" : ""}`);
      });
    }
  }
  lines.push(ctx.sep);
  lines.push(escBold(true) + leftRight("EFECTIVO ENTREGADO:", money(relevo.efectivo_entregado), ctx.width) + escBold(false));
  pushFirmas(lines, ctx);
}
function pushLabelValue(lines, label, value, ctx) {
  const limpio2 = text(value).replace(/\s+/g, " ").trim();
  if (label.length + 1 + limpio2.length <= ctx.width) {
    lines.push(leftRight(label, limpio2, ctx.width));
    return;
  }
  lines.push(label);
  for (const parte of wrapWords(limpio2, ctx.width - 2)) lines.push(`  ${parte}`);
}
function pushFirmas(lines, ctx) {
  const ancho = Math.floor((ctx.width - 6) / 2);
  const [entrega, recibe] = ancho >= 13 ? ["Firma entrega", "Firma recibe"] : ["Entrega", "Recibe"];
  const centrar = (rotulo) => (" ".repeat(Math.max(0, Math.floor((ancho - rotulo.length) / 2))) + rotulo).padEnd(ancho);
  lines.push("", "", "");
  lines.push(`  ${"_".repeat(ancho)}  ${"_".repeat(ancho)}`);
  lines.push(`  ${centrar(entrega)}  ${centrar(recibe)}`.trimEnd());
}
function header(data, title, ctx) {
  const lines = [];
  if (data.tenant_nombre) lines.push(center(text(data.tenant_nombre).toUpperCase(), ctx.width));
  if (data.nit) lines.push(center(`NIT: ${text(data.nit)}`, ctx.width));
  lines.push(...receiptContactLines(data.telefono, data.direccion, ctx.width));
  lines.push(ctx.sep2);
  lines.push(escBold(true) + center(title, ctx.width) + escBold(false));
  lines.push(ctx.sep2);
  return lines;
}
function renderReason2(lines, reason) {
  if (reason) lines.push(`      Motivo: ${text(reason)}`);
}
function renderCorrectionPayments(lines, pagos, ctx) {
  if (!pagos.length) {
    lines.push("    Sin pagos");
    return;
  }
  for (const pago of pagos) {
    const metodo = labelMetodo(pago.metodo_pago || pago.metodo);
    const total = num(pago.monto) + num(pago.propina);
    lines.push(leftRight(`    ${metodo}:`, money(total), ctx.width));
    if (num(pago.monto) > 0) lines.push(leftRight("      Base:", money(pago.monto), ctx.width));
    if (num(pago.propina) > 0) lines.push(leftRight("      Servicio:", money(pago.propina), ctx.width));
  }
}
function pushDateTime(lines, ctx) {
  if (ctx.width >= 42) {
    lines.push(`Fecha: ${formatDate(ctx.now, ctx.timezone)}        Hora: ${formatTime(ctx.now, ctx.timezone)}`);
    return;
  }
  lines.push(`Fecha: ${formatDate(ctx.now, ctx.timezone)}`);
  lines.push(`Hora:  ${formatTime(ctx.now, ctx.timezone)}`);
}
function context(options) {
  const width = clampColumns(options.columns);
  return {
    width,
    sep: "-".repeat(width),
    sep2: "=".repeat(width),
    now: options.now || /* @__PURE__ */ new Date(),
    timezone: options.timezone || "America/Bogota"
  };
}
function dateTime(value, ctx) {
  const date = value instanceof Date ? value : new Date(String(value || Date.now()));
  return `${formatDate(date, ctx.timezone)}, ${formatTime(date, ctx.timezone)}`;
}
function money(value) {
  return `$${formatMoney(value)}`;
}
function text(value) {
  return sanitizeText(value);
}
function num(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}
function formatQty(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "0";
  return Number.isInteger(numeric) ? String(numeric) : String(Math.round(numeric * 100) / 100);
}
function numOrDefault(value, fallback) {
  if (value === void 0 || value === null || value === "") return fallback;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}
function arr(value) {
  return Array.isArray(value) ? value.filter(isRecord2) : [];
}
function isRecord2(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  COMANDA_FONT_SIZES,
  DEFAULT_LOGO_SCALE,
  ESC,
  FOODLY_FOOTER_PDF_WIDTH,
  FOODLY_FOOTER_PNG,
  LOGO_SCALES,
  MAX_LOGO_HEIGHT,
  MAX_LOGO_WIDTH_BYTES,
  center,
  escBeep,
  escBold,
  escCashDrawerPulse,
  escCut,
  escFontSize,
  escLeftMargin,
  formatDate,
  formatMoney,
  formatTime,
  isFoodlyFooterLine,
  labelMetodo,
  leftRight,
  qrFilaMarker,
  qrMarker,
  renderCierreCaja,
  renderComanda,
  renderComandaAnulacion,
  renderCompra,
  renderCorreccion,
  renderDatosCliente,
  renderFactura,
  renderFacturasTurno,
  renderGastosTurno,
  renderNotaCredito,
  renderPrecuenta,
  renderReciboAbono,
  renderReporteVentas,
  renderReservasDia,
  renderRetirosCaja,
  renderStickerEntrega,
  renderStickerPrueba,
  renderTomaInventario,
  renderVentasPLU,
  sanitizeText,
  stickerBitmapDesdeRgba,
  textToEscPosBytes,
  tsplBeep
});
//# sourceMappingURL=index.cjs.map

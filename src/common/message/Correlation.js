"use strict";

function _instanceof(left, right) {
  if (
    right != null &&
    typeof Symbol !== "undefined" &&
    right[Symbol.hasInstance]
  ) {
    return !!right[Symbol.hasInstance](left);
  } else {
    return left instanceof right;
  }
}

function _classCallCheck(instance, Constructor) {
  if (!_instanceof(instance, Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var Correlation = function Correlation(
  parentTime,
  childTime,
  initialError,
  errorGrowthRate
) {
  _classCallCheck(this, Correlation);

  this.parentTime = parentTime;
  this.childTime = childTime;

  if (typeof initialError !== "undefined" || initialError !== null) {
    this.initialError = initialError;
  }

  if (typeof errorGrowthRate !== "undefined" || errorGrowthRate !== null) {
    this.errorGrowthRate = errorGrowthRate;
  }
};

module.exports = Correlation;
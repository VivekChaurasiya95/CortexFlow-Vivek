// CortexFlow — EWMA Tracker
// Computes Exponentially Weighted Moving Average

class EWMATracker {
  constructor(alpha = 0.2) {
    this.alpha = alpha;
    this.ewma = null;
  }

  /**
   * Update the moving average with a new value.
   * @param {number} value The new measurement
   * @returns {number} The updated EWMA
   */
  update(value) {
    if (this.ewma === null) {
      this.ewma = value;
    } else {
      this.ewma = this.alpha * value + (1 - this.alpha) * this.ewma;
    }
    return this.ewma;
  }

  /**
   * Get the current EWMA.
   * @returns {number|null} Current EWMA or null if no data
   */
  get() {
    return this.ewma;
  }
}

module.exports = EWMATracker;

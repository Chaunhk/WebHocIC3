/**
 * ════════════════════════════════════════════════════════════
 * AUTO-SCROLL MODULE (Enhanced)
 * Standalone module with edge boundary checks
 * ════════════════════════════════════════════════════════════
 */

const AutoScroll = {
  // Configuration
  config: {
    SCROLL_ZONE: 80, // pixels from top/bottom edge to trigger scroll
    SCROLL_SPEED: 15, // pixels per frame
    INTERVAL_DURATION: 30, // milliseconds between scroll updates
  },

  // State
  scrollInterval: null,
  isScrolling: false,

  /**
   * Initialize with custom config
   * @param {Object} options - Configuration options
   */
  init(options = {}) {
    this.config = { ...this.config, ...options };
    console.log("AutoScroll initialized:", this.config);
  },

  /**
   * Check if page can scroll up
   * @returns {boolean}
   */
  canScrollUp() {
    return window.scrollY > 0;
  },

  /**
   * Check if page can scroll down
   * @returns {boolean}
   */
  canScrollDown() {
    const maxScroll =
      document.documentElement.scrollHeight - window.innerHeight;
    return window.scrollY < maxScroll;
  },

  /**
   * Start scrolling up (with boundary check)
   */
  scrollUp() {
    if (!this.canScrollUp()) {
      this.stop();
      return;
    }

    this.stop();
    this.isScrolling = true;
    this.scrollInterval = setInterval(() => {
      if (this.canScrollUp()) {
        window.scrollBy(0, -this.config.SCROLL_SPEED);
      } else {
        this.stop();
      }
    }, this.config.INTERVAL_DURATION);
  },

  /**
   * Start scrolling down (with boundary check)
   */
  scrollDown() {
    if (!this.canScrollDown()) {
      this.stop();
      return;
    }

    this.stop();
    this.isScrolling = true;
    this.scrollInterval = setInterval(() => {
      if (this.canScrollDown()) {
        window.scrollBy(0, this.config.SCROLL_SPEED);
      } else {
        this.stop();
      }
    }, this.config.INTERVAL_DURATION);
  },

  /**
   * Stop scrolling
   */
  stop() {
    if (this.scrollInterval) {
      clearInterval(this.scrollInterval);
      this.scrollInterval = null;
    }
    this.isScrolling = false;
  },

  /**
   * Check if position should trigger scroll and handle it
   * @param {number} touchY - Y position of touch/mouse
   * @param {number} windowHeight - Height of window
   * @returns {string} - 'up', 'down', 'none'
   */
  handleScroll(touchY, windowHeight) {
    // Near top - scroll up (if possible)
    if (touchY < this.config.SCROLL_ZONE) {
      if (this.canScrollUp()) {
        this.scrollUp();
        return "up";
      } else {
        this.stop();
        return "none";
      }
    }
    // Near bottom - scroll down (if possible)
    else if (touchY > windowHeight - this.config.SCROLL_ZONE) {
      if (this.canScrollDown()) {
        this.scrollDown();
        return "down";
      } else {
        this.stop();
        return "none";
      }
    }
    // In middle zone - stop scrolling
    else {
      this.stop();
      return "none";
    }
  },

  /**
   * Get scroll direction without doing anything
   * @param {number} touchY - Y position of touch/mouse
   * @param {number} windowHeight - Height of window
   * @returns {string} - 'up', 'down', 'none'
   */
  getScrollDirection(touchY, windowHeight) {
    if (touchY < this.config.SCROLL_ZONE && this.canScrollUp()) {
      return "up";
    } else if (
      touchY > windowHeight - this.config.SCROLL_ZONE &&
      this.canScrollDown()
    ) {
      return "down";
    }
    return "none";
  },

  /**
   * Get current scroll position
   * @returns {number}
   */
  getScrollY() {
    return window.scrollY || window.pageYOffset;
  },

  /**
   * Get maximum scroll position
   * @returns {number}
   */
  getMaxScroll() {
    return document.documentElement.scrollHeight - window.innerHeight;
  },

  /**
   * Get current scroll percentage (0-100)
   * @returns {number}
   */
  getScrollPercent() {
    const scrolled = this.getScrollY();
    const maxScroll = this.getMaxScroll();
    return maxScroll > 0 ? (scrolled / maxScroll) * 100 : 0;
  },
};

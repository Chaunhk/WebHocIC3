/**
 * ════════════════════════════════════════════════════════════
 * FORM STATE MANAGER
 * Preserves form state across browser navigation (back/forward)
 * Will use later if needed, currently not integrated into the main app
 * Author: Gemini (OpenAI)
 * ════════════════════════════════════════════════════════════
 */

const FormStateManager = {
  // Configuration
  config: {
    storageKey: "formState", // Key for sessionStorage
    autoSave: true, // Auto-save on change
    autoRestore: true, // Auto-restore on load
    debug: true, // Log to console
  },

  /**
   * Initialize the form state manager
   * @param {Object} options - Configuration options
   */
  init(options = {}) {
    this.config = { ...this.config, ...options };

    if (this.config.debug) {
      console.log("✓ FormStateManager initialized:", this.config);
    }

    // Restore form state when page loads
    if (this.config.autoRestore) {
      window.addEventListener("load", () => this.restore());
      window.addEventListener("popstate", () => this.restore());
    }

    // Save form state before leaving page
    if (this.config.autoSave) {
      window.addEventListener("beforeunload", () => this.save());
    }
  },

  /**
   * Save all form fields to sessionStorage
   */
  save() {
    const formData = {};

    // Save all text inputs
    document.querySelectorAll('input[type="text"]').forEach((input) => {
      if (input.id) {
        formData[input.id] = {
          type: "text",
          value: input.value,
        };
      }
    });

    // Save all password inputs
    document.querySelectorAll('input[type="password"]').forEach((input) => {
      if (input.id) {
        formData[input.id] = {
          type: "password",
          value: input.value,
        };
      }
    });

    // Save all number inputs
    document.querySelectorAll('input[type="number"]').forEach((input) => {
      if (input.id) {
        formData[input.id] = {
          type: "number",
          value: input.value,
        };
      }
    });

    // Save all email inputs
    document.querySelectorAll('input[type="email"]').forEach((input) => {
      if (input.id) {
        formData[input.id] = {
          type: "email",
          value: input.value,
        };
      }
    });

    // Save all textareas
    document.querySelectorAll("textarea").forEach((textarea) => {
      if (textarea.id) {
        formData[textarea.id] = {
          type: "textarea",
          value: textarea.value,
        };
      }
    });

    // Save all select dropdowns
    document.querySelectorAll("select").forEach((select) => {
      if (select.id) {
        formData[select.id] = {
          type: "select",
          value: select.value,
        };
      }
    });

    // Save all checkboxes
    document.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
      if (checkbox.id) {
        formData[checkbox.id] = {
          type: "checkbox",
          checked: checkbox.checked,
        };
      }
    });

    // Save all radio buttons
    document.querySelectorAll('input[type="radio"]').forEach((radio) => {
      if (radio.id) {
        formData[radio.id] = {
          type: "radio",
          checked: radio.checked,
        };
      }
    });

    // Store in sessionStorage
    sessionStorage.setItem(this.config.storageKey, JSON.stringify(formData));

    if (this.config.debug) {
      console.log(
        "✓ Form state saved:",
        Object.keys(formData).length,
        "fields",
      );
    }
  },

  /**
   * Restore form state from sessionStorage
   */
  restore() {
    const saved = sessionStorage.getItem(this.config.storageKey);

    if (!saved) {
      if (this.config.debug) {
        console.log("ℹ No saved form state found");
      }
      return;
    }

    try {
      const formData = JSON.parse(saved);
      let restored = 0;

      // Restore each field
      Object.keys(formData).forEach((fieldId) => {
        const field = document.getElementById(fieldId);
        if (!field) return;

        const data = formData[fieldId];

        // Restore text inputs
        if (
          data.type === "text" ||
          data.type === "password" ||
          data.type === "email" ||
          data.type === "number"
        ) {
          field.value = data.value;
          restored++;
        }

        // Restore textareas
        if (data.type === "textarea") {
          field.value = data.value;
          restored++;
        }

        // Restore select
        if (data.type === "select") {
          field.value = data.value;
          restored++;

          // Trigger change event
          field.dispatchEvent(new Event("change", { bubbles: true }));
        }

        // Restore checkbox
        if (data.type === "checkbox") {
          field.checked = data.checked;
          restored++;
        }

        // Restore radio
        if (data.type === "radio") {
          field.checked = data.checked;
          restored++;
        }
      });

      if (this.config.debug) {
        console.log("✓ Form state restored:", restored, "fields");
      }
    } catch (error) {
      console.error("✗ Error restoring form state:", error);
    }
  },

  /**
   * Save a specific field
   * @param {string} fieldId - ID of the field
   */
  saveField(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return;

    const saved = JSON.parse(
      sessionStorage.getItem(this.config.storageKey) || "{}",
    );

    if (field.type === "checkbox" || field.type === "radio") {
      saved[fieldId] = {
        type: field.type,
        checked: field.checked,
      };
    } else if (field.tagName === "SELECT") {
      saved[fieldId] = {
        type: "select",
        value: field.value,
      };
    } else if (field.tagName === "TEXTAREA") {
      saved[fieldId] = {
        type: "textarea",
        value: field.value,
      };
    } else {
      saved[fieldId] = {
        type: field.type,
        value: field.value,
      };
    }

    sessionStorage.setItem(this.config.storageKey, JSON.stringify(saved));

    if (this.config.debug) {
      console.log(`✓ Field saved: ${fieldId}`);
    }
  },

  /**
   * Clear all saved form state
   */
  clear() {
    sessionStorage.removeItem(this.config.storageKey);
    if (this.config.debug) {
      console.log("✓ Form state cleared");
    }
  },

  /**
   * Get all saved form state
   * @returns {Object} - Saved form data
   */
  getState() {
    const saved = sessionStorage.getItem(this.config.storageKey);
    return saved ? JSON.parse(saved) : {};
  },

  /**
   * Set up auto-save listeners on specific elements
   * @param {string} selector - CSS selector for elements
   */
  watchElements(selector = "input, select, textarea") {
    document.querySelectorAll(selector).forEach((element) => {
      if (!element.id) {
        console.warn(
          "Element without ID found, skipping auto-save setup:",
          element,
        );
        return;
      }

      // Save on input change
      element.addEventListener("change", () => {
        this.saveField(element.id);
      });

      // Save on blur
      element.addEventListener("blur", () => {
        this.saveField(element.id);
      });
    });

    if (this.config.debug) {
      console.log(`✓ Watching ${selector} elements for changes`);
    }
  },
};

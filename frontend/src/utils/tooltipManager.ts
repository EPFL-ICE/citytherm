// Simple singleton to manage open tooltips
class TooltipManager {
  private openTooltip: (() => void) | null = null

  // Register a tooltip as open and close any previously open tooltip
  registerOpen(closeFunction: () => void): void {
    // Close any previously open tooltip
    if (this.openTooltip && this.openTooltip !== closeFunction) {
      this.openTooltip()
    }
    
    // Register this tooltip as the open one
    this.openTooltip = closeFunction
  }

  // Unregister a tooltip (when it's closed or destroyed)
  unregister(closeFunction: () => void): void {
    if (this.openTooltip === closeFunction) {
      this.openTooltip = null
    }
  }
}

// Export singleton instance
export const tooltipManager = new TooltipManager()

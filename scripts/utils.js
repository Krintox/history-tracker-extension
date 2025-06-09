// Helper function to calculate focus score
export function calculateFocusScore(tabSwitches, totalTime) {
  if (!totalTime || !tabSwitches) return 0;
  
  // Max expected switches (1 per 5 minutes is considered focused)
  const maxExpected = totalTime / 300;
  const excessSwitches = Math.max(0, tabSwitches - maxExpected);
  
  // Score from 0-100 with deductions for excess switches
  const score = 100 - Math.min(100, excessSwitches * 10);
  return Math.round(score);
}

// Helper function to extract domain from URL
export function extractDomain(url) {
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    return domain;
  } catch {
    return null;
  }
}
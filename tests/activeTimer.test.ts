import { describe, it, expect } from 'vitest';

describe('Active Duration Visibility Logic', () => {
  it('increments active timer only when tab is visible', () => {
    let activeSeconds = 0;

    // Simulate 3 ticks when visible
    const simulateTick = (visibilityState: 'visible' | 'hidden') => {
      if (visibilityState === 'visible') {
        activeSeconds += 1;
      }
    };

    simulateTick('visible');
    simulateTick('visible');
    expect(activeSeconds).toBe(2);

    // Simulate 3 ticks when user switched tab or minimized window (hidden)
    simulateTick('hidden');
    simulateTick('hidden');
    simulateTick('hidden');
    expect(activeSeconds).toBe(2); // must remain paused!

    // User returns to tab
    simulateTick('visible');
    expect(activeSeconds).toBe(3);
  });
});

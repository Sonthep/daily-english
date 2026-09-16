import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { AppShell } from '../src/components/layout/AppShell';
import { Button } from '../src/components/ui/Button';

afterEach(cleanup);

describe('responsive navigation', () => {
  it.each([375, 768, 1023, 1440])('keeps all destinations accessible at %ipx', (width) => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
    const onNavigate = vi.fn();
    render(<AppShell currentRoute={{ path: 'today' }} onNavigate={onNavigate} profile={null}><p>Content</p></AppShell>);
    expect(screen.getByRole('navigation')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'วันนี้' }).getAttribute('aria-current')).toBe('page');
    fireEvent.click(screen.getByRole('button', { name: 'บทเรียน' }));
    expect(onNavigate).toHaveBeenCalledWith({ path: 'practice' });
    expect(screen.getByRole('button', { name: 'คลังวลี' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'สื่อฝึก' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'ความก้าวหน้า' })).toBeTruthy();
  });
});

it('preserves button layout and touch target when callers customize styles', () => {
  render(<Button style={{ justifyContent: 'space-between' }}>Start</Button>);
  const button = screen.getByRole('button', { name: 'Start' });
  expect(button.style.display).toBe('inline-flex');
  expect(button.style.minHeight).toBe('var(--touch-target-min)');
  expect(button.style.justifyContent).toBe('space-between');
});

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Modal } from '../src/components/ui/Modal';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('Modal accessibility', () => {
  it('labels the dialog, moves focus inside, and closes with Escape', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();

    render(
      <Modal isOpen onClose={onClose} title="ตั้งค่า" description="แก้ไขข้อมูลส่วนตัว">
        <button type="button">บันทึก</button>
      </Modal>,
    );

    vi.runAllTimers();
    const dialog = screen.getByRole('dialog', { name: 'ตั้งค่า' });
    expect(dialog.getAttribute('aria-describedby')).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'ปิดหน้าต่าง' }));

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps Tab navigation inside the dialog', () => {
    vi.useFakeTimers();
    render(
      <Modal isOpen onClose={() => undefined} title="ทดสอบ">
        <button type="button">บันทึก</button>
      </Modal>,
    );

    vi.runAllTimers();
    const dialog = screen.getByRole('dialog');
    const focusable = Array.from(dialog.querySelectorAll<HTMLButtonElement>('button'));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    last.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(first);

    first.focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);
  });
});

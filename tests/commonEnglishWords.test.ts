import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createElement } from 'react';
import wordBank from '../src/data/commonEnglishWords.json';
import { CommonWordBank } from '../src/features/phrases/CommonWordBank';

afterEach(cleanup);

describe('common English word bank', () => {
  it('contains 3,000 unique learner-readable words with attribution', () => {
    expect(wordBank.words).toHaveLength(3000);
    expect(new Set(wordBank.words).size).toBe(3000);
    expect(wordBank.words.every((word) => /^[a-z]+(?:[.'][a-z]+)*$/.test(word))).toBe(true);
    expect(wordBank.license).toBe('CC BY-SA 4.0');
    expect(wordBank.author).toBe('Robyn Speer');
  });

  it('searches the ranked list and sends a selected word to the flashcard form', () => {
    const onChooseWord = vi.fn();
    render(createElement(CommonWordBank, { existingWords: new Set<string>(), onChooseWord, onGenerateLesson: vi.fn() }));

    fireEvent.change(screen.getByRole('searchbox', { name: 'ค้นหาคำศัพท์ที่พบบ่อย' }), {
      target: { value: 'apple' },
    });

    expect(screen.getByRole('status').textContent).toBe('พบ 1 คำ');
    fireEvent.click(screen.getByRole('button', { name: 'เพิ่ม apple เป็นบัตร' }));
    expect(onChooseWord).toHaveBeenCalledWith('apple');
  });

  it('paginates the list and disables words already in the phrase library', () => {
    render(createElement(CommonWordBank, { existingWords: new Set(['the']), onChooseWord: vi.fn(), onGenerateLesson: vi.fn() }));

    expect(screen.getByRole('button', { name: 'the อยู่ในคลังแล้ว' }).hasAttribute('disabled')).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'หน้าถัดไป' }));
    expect(screen.getByText('49.')).toBeTruthy();
  });

  it('lets learners select three words and launch lesson creation', () => {
    const onGenerateLesson = vi.fn();
    render(createElement(CommonWordBank, {
      existingWords: new Set<string>(),
      onChooseWord: vi.fn(),
      onGenerateLesson,
    }));

    for (const word of ['the', 'to', 'and']) {
      fireEvent.click(screen.getByRole('button', { name: `เลือก ${word} สำหรับบทเรียน` }));
    }
    fireEvent.click(screen.getByRole('button', { name: 'สร้างบทเรียน (3)' }));

    expect(onGenerateLesson).toHaveBeenCalledWith(['the', 'to', 'and']);
  });
});
import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Search, Plus, Check, Square, CheckSquare, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import wordBank from '../../data/commonEnglishWords.json';

const PAGE_SIZE = 48;

export interface CommonWordBankProps {
  existingWords: Set<string>;
  onChooseWord: (word: string) => void;
  onGenerateLesson: (words: string[]) => void;
}

export const CommonWordBank: React.FC<CommonWordBankProps> = ({ existingWords, onChooseWord, onGenerateLesson }) => {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredWords = wordBank.words
    .map((word, index) => ({ word, rank: index + 1 }))
    .filter(({ word }) => word.includes(normalizedQuery));
  const pageCount = Math.ceil(filteredWords.length / PAGE_SIZE);
  const currentPage = Math.min(page, Math.max(0, pageCount - 1));
  const visibleWords = filteredWords.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      <Card padding="md" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        <div style={{ position: 'relative' }}>
          <Search
            size={18}
            color="var(--color-text-muted)"
            style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="search"
            aria-label="ค้นหาคำศัพท์ที่พบบ่อย"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(0);
            }}
            placeholder="ค้นหาคำภาษาอังกฤษ..."
            style={{
              width: '100%',
              padding: '12px 14px 12px 42px',
              borderRadius: 'var(--radius-control)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
          <span className="muted" role="status">พบ {filteredWords.length.toLocaleString('th-TH')} คำ</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
              เลือก 3–5 คำเพื่อสร้างบทเรียน หรือเพิ่มเป็นบัตรแล้วเติมคำแปล
            </span>
            <Button
              size="sm"
              disabled={selectedWords.length < 3 || selectedWords.length > 5}
              onClick={() => onGenerateLesson(selectedWords)}
            >
              <Sparkles size={15} /> สร้างบทเรียน ({selectedWords.length})
            </Button>
          </div>
        </div>
      </Card>

      {visibleWords.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))', gap: 'var(--space-sm)' }}>
          {visibleWords.map(({ word, rank }) => {
            const alreadyAdded = existingWords.has(word.toLowerCase());
            const isSelected = selectedWords.includes(word);
            return (
              <Card key={word} padding="sm" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', minWidth: 0 }}>
                <span style={{ minWidth: '42px', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>
                  {rank.toLocaleString('en-US')}.
                </span>
                <strong style={{ flex: 1, minWidth: 0 }}>{word}</strong>
                <Button
                  variant={isSelected ? 'secondary' : 'ghost'}
                  size="sm"
                  disabled={!isSelected && selectedWords.length >= 5}
                  aria-pressed={isSelected}
                  aria-label={isSelected ? `นำ ${word} ออกจากบทเรียน` : `เลือก ${word} สำหรับบทเรียน`}
                  onClick={() => setSelectedWords((current) =>
                    isSelected ? current.filter((selected) => selected !== word) : [...current, word]
                  )}
                  style={{ padding: '6px 8px' }}
                >
                  {isSelected ? <CheckSquare size={15} /> : <Square size={15} />}
                  <span>{isSelected ? 'เลือกแล้ว' : 'เลือก'}</span>
                </Button>
                <Button
                  variant={alreadyAdded ? 'ghost' : 'outline'}
                  size="sm"
                  disabled={alreadyAdded}
                  onClick={() => onChooseWord(word)}
                  aria-label={alreadyAdded ? `${word} อยู่ในคลังแล้ว` : `เพิ่ม ${word} เป็นบัตร`}
                  title={alreadyAdded ? 'อยู่ในคลังแล้ว' : 'เพิ่มเป็นบัตรทบทวน'}
                  style={{ padding: '6px 9px' }}
                >
                  {alreadyAdded ? <Check size={15} /> : <Plus size={15} />}
                  <span>{alreadyAdded ? 'มีแล้ว' : 'เพิ่มบัตร'}</span>
                </Button>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card padding="lg" style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
          ไม่พบคำที่ตรงกับการค้นหา
        </Card>
      )}

      {pageCount > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-base)' }}>
          <Button variant="outline" size="sm" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)} aria-label="หน้าก่อนหน้า">
            <ChevronLeft size={17} /> ก่อนหน้า
          </Button>
          <span className="muted">หน้า {currentPage + 1} / {pageCount}</span>
          <Button variant="outline" size="sm" disabled={currentPage + 1 >= pageCount} onClick={() => setPage(currentPage + 1)} aria-label="หน้าถัดไป">
            ถัดไป <ChevronRight size={17} />
          </Button>
        </div>
      )}

      <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', lineHeight: 1.6 }}>
        แหล่งข้อมูล: <a href={wordBank.repository} target="_blank" rel="noreferrer">wordfreq โดย Robyn Speer</a> ·{' '}
        <a href={wordBank.licenseUrl} target="_blank" rel="noreferrer">CC BY-SA 4.0</a>. อันดับมาจากหลาย corpus และไม่รับประกันสัดส่วน 80% สำหรับทุกบริบท
      </p>
    </div>
  );
};
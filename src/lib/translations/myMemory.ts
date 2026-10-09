const MY_MEMORY_URL = 'https://api.mymemory.translated.net/get';
const MAX_QUERY_BYTES = 500;

interface MyMemoryResponse {
  responseStatus?: number;
  responseDetails?: string;
  responseData?: {
    translatedText?: string;
  };
}

export async function translateEnglishToThai(text: string): Promise<string> {
  const query = text.trim();
  if (!query) throw new Error('กรอกคำหรือวลีก่อนแปล');
  if (new TextEncoder().encode(query).byteLength > MAX_QUERY_BYTES) {
    throw new Error('ข้อความยาวเกิน 500 ไบต์ กรุณาแปลทีละคำหรือวลีสั้น ๆ');
  }

  const params = new URLSearchParams({ q: query, langpair: 'en|th' });
  const response = await fetch(`${MY_MEMORY_URL}?${params}`);
  if (!response.ok) throw new Error(`บริการแปลไม่พร้อมใช้งาน (${response.status})`);

  const result = await response.json() as MyMemoryResponse;
  const translatedText = result.responseData?.translatedText?.trim();
  if (result.responseStatus !== 200 || !translatedText) {
    throw new Error(result.responseDetails || 'ไม่พบคำแปล ลองกรอกคำแปลเองได้');
  }
  return translatedText;
}
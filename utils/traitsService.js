const fetch = require('node-fetch');

const TRAITS_API_URL = process.env.TRAITS_API_URL || 'http://54.180.2.201/traits';

// Traits API에서 내려주는 레이블과 동일한 기본 레이블 세트
const TRAIT_FALLBACK_LABELS = [
  '열정 에너지 예술 중독',
  '예민 직감 영적 불안',
  '감정기복 갈등 오해 고독',
  '강함 용감 충동 변화',
  '책임감 의리 완벽 자존심 인내',
  '충돌 자유 고집',
  '카리스마 승부욕 용감 외로움',
  '의지 솔직 직설 개성 고집 독립심'
];

const normalizeGenderForTraits = (value) => {
  if (!value) return 'M';
  const lower = String(value).trim().toLowerCase();
  if (['m', 'male', '남', '남자'].includes(lower)) return 'M';
  if (['f', 'female', '여', '여자'].includes(lower)) return 'F';
  return 'M';
};

const buildFallbackTraits = (seed = Date.now()) => {
  if (!TRAIT_FALLBACK_LABELS.length) {
    return ['무난'];
  }

  const available = [...TRAIT_FALLBACK_LABELS];
  const results = [];
  let currentSeed = Number(seed) || Date.now();

  const targetCount = Math.min(4, available.length);
  for (let i = 0; i < targetCount; i += 1) {
    currentSeed += i + 1;
    const randomIndex = Math.floor(Math.abs(Math.sin(currentSeed)) * available.length);
    results.push(available.splice(randomIndex, 1)[0]);
  }

  return results.length > 0 ? results : ['무난'];
};

const fetchTraitsFromAPI = async ({ gender, year, month, day, useLunar = false, debug = false }) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(TRAITS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        p: {
          gender: normalizeGenderForTraits(gender),
          year,
          month,
          day
        },
        useLunar,
        debug
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Traits API 오류: HTTP ${response.status}`);
    }

    const data = await response.json();
    const strings = data?.traits?.strings;

    if (Array.isArray(strings)) {
      const normalized = strings
        .map(item => (typeof item === 'string' ? item.trim() : ''))
        .filter(Boolean);
      if (normalized.length > 0) {
        return normalized;
      }
    }

    if (Array.isArray(data?.traits)) {
      const normalized = data.traits
        .map(item => (typeof item === 'string' ? item.trim() : ''))
        .filter(Boolean);
      if (normalized.length > 0) {
        return normalized;
      }
    }

    if (typeof data?.traits === 'string') {
      const trimmed = data.traits.trim();
      if (trimmed) {
        return [trimmed];
      }
    }

    return null;
  } catch (error) {
    console.error('traits API 호출 실패:', error.message);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
};

module.exports = {
  fetchTraitsFromAPI,
  buildFallbackTraits,
  normalizeGenderForTraits
};







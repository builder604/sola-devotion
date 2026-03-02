/**
 * Bible Text Service
 *
 * Supports multiple translation sources:
 * - bible-api.com (free, no key): KJV, ASV, WEB, BBE, YLT, DARBY
 * - api.esv.org (free with key): ESV
 * - scripture.api.bible (free with key): NASB, NIV, NKJV, CSB, and many more
 */

const BIBLE_API_TRANSLATIONS = {
  kjv: { id: 'kjv', name: 'King James Version', source: 'bible-api' },
  asv: { id: 'asv', name: 'American Standard Version', source: 'bible-api' },
  web: { id: 'web', name: 'World English Bible', source: 'bible-api' },
  bbe: { id: 'bbe', name: 'Bible in Basic English', source: 'bible-api' },
  ylt: { id: 'ylt', name: "Young's Literal Translation", source: 'bible-api' },
  darby: { id: 'darby', name: 'Darby Translation', source: 'bible-api' },
};

const ESV_TRANSLATION = {
  esv: { id: 'esv', name: 'English Standard Version', source: 'esv-api' },
};

// API.Bible translation IDs (from scripture.api.bible)
const API_BIBLE_TRANSLATIONS = {
  nasb: { id: 'c315fa9f71d4af3a-01', name: 'New American Standard Bible', source: 'api-bible' },
  niv: { id: '78a9f6124f344018-01', name: 'New International Version', source: 'api-bible' },
  nkjv: { id: 'de4e12af7f28f599-02', name: 'New King James Version', source: 'api-bible' },
  csb: { id: 'a556c5305ee15c3f-01', name: 'Christian Standard Bible', source: 'api-bible' },
};

function getAvailableTranslations() {
  const translations = { ...BIBLE_API_TRANSLATIONS };

  if (process.env.ESV_API_KEY) {
    Object.assign(translations, ESV_TRANSLATION);
  }
  if (process.env.API_BIBLE_KEY) {
    Object.assign(translations, API_BIBLE_TRANSLATIONS);
  }

  return translations;
}

async function fetchPassage(passage, translationKey) {
  const translations = getAvailableTranslations();
  const translation = translations[translationKey];

  if (!translation) {
    // Fall back to KJV if requested translation isn't available
    return fetchFromBibleApi(passage, 'kjv');
  }

  switch (translation.source) {
    case 'bible-api':
      return fetchFromBibleApi(passage, translationKey);
    case 'esv-api':
      return fetchFromEsvApi(passage);
    case 'api-bible':
      return fetchFromApiBible(passage, translation.id);
    default:
      return fetchFromBibleApi(passage, 'kjv');
  }
}

async function fetchFromBibleApi(passage, translation) {
  const encoded = encodeURIComponent(passage);
  const url = `https://bible-api.com/${encoded}?translation=${translation}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Bible API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();

  if (data.error) {
    throw new Error(`Bible API: ${data.error}`);
  }

  return {
    reference: data.reference,
    text: data.text.trim(),
    translation: translation.toUpperCase(),
    verses: (data.verses || []).map(v => ({
      book: v.book_name,
      chapter: v.chapter,
      verse: v.verse,
      text: v.text.trim(),
    })),
  };
}

async function fetchFromEsvApi(passage) {
  const encoded = encodeURIComponent(passage);
  const url = `https://api.esv.org/v3/passage/text/?q=${encoded}&include-headings=false&include-footnotes=false&include-verse-numbers=true&include-short-copyright=false&include-passage-references=false`;

  const res = await fetch(url, {
    headers: { Authorization: `Token ${process.env.ESV_API_KEY}` },
  });

  if (!res.ok) {
    throw new Error(`ESV API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();

  return {
    reference: data.canonical,
    text: (data.passages || []).join('\n').trim(),
    translation: 'ESV',
    verses: [],
  };
}

async function fetchFromApiBible(passage, bibleId) {
  // API.Bible requires a specific passage format. We'll search for the passage.
  const encoded = encodeURIComponent(passage);
  const url = `https://api.scripture.api.bible/v1/bibles/${bibleId}/search?query=${encoded}&limit=1`;

  const res = await fetch(url, {
    headers: { 'api-key': process.env.API_BIBLE_KEY },
  });

  if (!res.ok) {
    throw new Error(`API.Bible error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();

  if (!data.data || !data.data.passages || data.data.passages.length === 0) {
    throw new Error('Passage not found in API.Bible');
  }

  const p = data.data.passages[0];
  // Strip HTML tags from content
  const text = p.content.replace(/<[^>]*>/g, '').trim();

  return {
    reference: p.reference,
    text,
    translation: p.bibleId,
    verses: [],
  };
}

module.exports = { fetchPassage, getAvailableTranslations };

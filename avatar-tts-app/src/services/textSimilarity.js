function normalize(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[.,!?;:()"'’“”\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function levenshtein(a, b) {
  a = normalize(a);
  b = normalize(b);
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;

  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      if (a[i - 1] === b[j - 1]) {
        dp[j] = prev;
      } else {
        dp[j] = Math.min(prev + 1, dp[j] + 1, dp[j - 1] + 1);
      }
      prev = tmp;
    }
  }
  return dp[n];
}

export function similarityPercent(referenceText, hypothesisText) {
  const a = normalize(referenceText);
  const b = normalize(hypothesisText);
  if (!a && !b) return 100;
  const distance = levenshtein(a, b);
  const maxLen = Math.max(a.length, b.length) || 1;
  const similarity = 1 - distance / maxLen;
  return Math.max(0, Math.min(1, similarity)) * 100;
}

// Improved word comparison using dynamic programming (similar to Levenshtein)
function findBestAlignment(refWords, transWords) {
  const m = refWords.length;
  const n = transWords.length;
  
  // DP table: dp[i][j] = best alignment score for refWords[0..i-1] and transWords[0..j-1]
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  const path = Array(m + 1).fill(null).map(() => Array(n + 1).fill(null));
  
  // Initialize base cases
  for (let i = 0; i <= m; i++) {
    dp[i][0] = i;
    path[i][0] = i > 0 ? { type: 'delete', i: i - 1, j: 0 } : null;
  }
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
    path[0][j] = j > 0 ? { type: 'insert', i: 0, j: j - 1 } : null;
  }
  
  // Fill DP table
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const match = refWords[i - 1] === transWords[j - 1] ? 0 : 1;
      const costs = [
        dp[i - 1][j - 1] + match,      // match/substitute
        dp[i - 1][j] + 1,               // delete from ref
        dp[i][j - 1] + 1,               // insert in trans
      ];
      const minCost = Math.min(...costs);
      dp[i][j] = minCost;
      
      // Track path
      if (minCost === costs[0]) {
        path[i][j] = { type: match === 0 ? 'match' : 'substitute', i: i - 1, j: j - 1 };
      } else if (minCost === costs[1]) {
        path[i][j] = { type: 'delete', i: i - 1, j };
      } else {
        path[i][j] = { type: 'insert', i, j: j - 1 };
      }
    }
  }
  
  // Backtrack to find alignment
  const alignment = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    const step = path[i][j];
    if (!step) break;
    
    if (step.type === 'match') {
      alignment.unshift({ refIdx: i - 1, transIdx: j - 1, isCorrect: true });
      i = step.i;
      j = step.j;
    } else if (step.type === 'substitute') {
      alignment.unshift({ refIdx: i - 1, transIdx: j - 1, isCorrect: false });
      i = step.i;
      j = step.j;
    } else if (step.type === 'insert') {
      alignment.unshift({ refIdx: -1, transIdx: j - 1, isCorrect: false });
      j = step.j;
    } else { // delete
      alignment.unshift({ refIdx: i - 1, transIdx: -1, isCorrect: false });
      i = step.i;
    }
  }
  
  return alignment;
}

// Compare transcribed words with reference text to identify incorrect words
export function compareWords(referenceText, transcribedWords) {
  // Normalize reference text and split into words
  const refWords = normalize(referenceText)
    .split(/\s+/)
    .filter(w => w.length > 0);
  
  // Extract words from transcribed data
  const transWords = transcribedWords.map(w => normalize(w.word)).filter(w => w.length > 0);
  
  if (transWords.length === 0) {
    return transcribedWords.map(wordObj => ({
      word: wordObj.word,
      isCorrect: false,
      confidence: wordObj.confidence || 0,
    }));
  }
  
  // Use improved alignment algorithm
  const alignment = findBestAlignment(refWords, transWords);
  
  // Create result array
  const result = transcribedWords.map((wordObj, idx) => {
    const aligned = alignment.find(a => a.transIdx === idx);
    
    if (!aligned) {
      // Word not aligned (extra word)
      return {
        word: wordObj.word,
        isCorrect: false,
        confidence: wordObj.confidence || 0,
      };
    }
    
    return {
      word: wordObj.word,
      isCorrect: aligned.isCorrect,
      confidence: wordObj.confidence || 0,
    };
  });
  
  return result;
}

export default {
  levenshtein,
  similarityPercent,
  compareWords,
};









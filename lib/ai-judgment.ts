import type { AIJudgmentConfig } from './types'

/**
 * AI判定結果の型
 */
export interface JudgmentResult {
  isCorrect: boolean
  confidence: number // 0-100
  feedback?: string
}

/**
 * 回答を判定する
 * 現時点では 'exact' 判定のみ実装。'flexible' と 'ai' は将来の拡張用
 */
export async function judgeAnswer(
  studentAnswer: string,
  correctAnswer: string,
  config: AIJudgmentConfig
): Promise<JudgmentResult> {
  const normalizedStudent = normalizeAnswer(studentAnswer)
  const normalizedCorrect = normalizeAnswer(correctAnswer)
  
  switch (config.type) {
    case 'exact':
      return judgeExact(normalizedStudent, normalizedCorrect)
    
    case 'flexible':
      return judgeFlexible(normalizedStudent, normalizedCorrect, config)
    
    case 'ai':
      // AI判定は将来実装予定
      // 現時点では flexible にフォールバック
      return judgeFlexible(normalizedStudent, normalizedCorrect, config)
    
    default:
      return judgeExact(normalizedStudent, normalizedCorrect)
  }
}

/**
 * 回答を正規化（スペース、大文字小文字など）
 */
function normalizeAnswer(answer: string): string {
  return answer
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[　]/g, ' ') // 全角スペースを半角に
}

/**
 * 完全一致判定
 */
function judgeExact(
  studentAnswer: string,
  correctAnswer: string
): JudgmentResult {
  const isCorrect = studentAnswer === correctAnswer
  return {
    isCorrect,
    confidence: 100,
    feedback: isCorrect ? undefined : '正解と一致しません'
  }
}

/**
 * 柔軟判定（類似度ベース）
 */
function judgeFlexible(
  studentAnswer: string,
  correctAnswer: string,
  config: AIJudgmentConfig
): JudgmentResult {
  // 完全一致チェック
  if (studentAnswer === correctAnswer) {
    return { isCorrect: true, confidence: 100 }
  }
  
  // キーワードチェック
  if (config.keywords && config.keywords.length > 0) {
    const matchedKeywords = config.keywords.filter(kw => 
      studentAnswer.includes(kw.toLowerCase())
    )
    if (matchedKeywords.length === config.keywords.length) {
      return { 
        isCorrect: true, 
        confidence: 90,
        feedback: 'キーワードが含まれています'
      }
    }
  }
  
  // 類似度計算（レーベンシュタイン距離ベース）
  const similarity = calculateSimilarity(studentAnswer, correctAnswer)
  const threshold = config.acceptableSimilarity ?? 80
  
  return {
    isCorrect: similarity >= threshold,
    confidence: similarity,
    feedback: similarity >= threshold 
      ? '類似度が高いため正解とみなします'
      : `類似度: ${similarity}%（必要: ${threshold}%）`
  }
}

/**
 * 文字列類似度を計算（0-100）
 */
function calculateSimilarity(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length)
  if (maxLen === 0) return 100
  
  const distance = levenshteinDistance(str1, str2)
  return Math.round((1 - distance / maxLen) * 100)
}

/**
 * レーベンシュタイン距離を計算
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length
  const n = str2.length
  
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0))
  
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,     // 削除
          dp[i][j - 1] + 1,     // 挿入
          dp[i - 1][j - 1] + 1  // 置換
        )
      }
    }
  }
  
  return dp[m][n]
}

/**
 * 将来のAI API接続用プレースホルダー
 * Vercel AI SDK等を使用して実装予定
 */
export async function judgeWithAI(
  studentAnswer: string,
  correctAnswer: string,
  _config: AIJudgmentConfig
): Promise<JudgmentResult> {
  // TODO: AI APIを接続
  // 例: Vercel AI SDKを使用
  // const response = await generateText({
  //   model: 'openai/gpt-4',
  //   prompt: `...`
  // })
  
  // 現時点ではフォールバック
  console.warn('AI judgment is not yet implemented, falling back to flexible judgment')
  return judgeFlexible(
    normalizeAnswer(studentAnswer),
    normalizeAnswer(correctAnswer),
    _config
  )
}

// 빌드 시 실행하여 lib/data/mediaAssets.generated.ts 생성
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import Database from 'better-sqlite3'

// ES 모듈에서 __dirname 구하기
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbPath = path.join(__dirname, '..', 'data', 'demo.db')
const outputPath = path.join(__dirname, '..', 'lib', 'data', 'mediaAssets.generated.ts')

try {
  const db = new Database(dbPath, { readonly: true })
  const assets = db.prepare(`
    SELECT id, type, title, description, file_path as filePath, script
    FROM media_assets
    ORDER BY id ASC
  `).all()
  
  db.close()

  const output = `// 자동 생성된 파일 - 수정하지 마세요
// 이 파일은 빌드 시 scripts/generate-media-assets.ts에 의해 생성됩니다

import type { MediaAsset } from '@/lib/types/media'

export const mediaAssets: MediaAsset[] = ${JSON.stringify(assets, null, 2)} as const
`

  fs.writeFileSync(outputPath, output, 'utf-8')
  console.log(`✓ Media assets generated: ${assets.length} items`)
} catch (error) {
  console.error('Failed to generate media assets:', error)
  process.exit(1)
}

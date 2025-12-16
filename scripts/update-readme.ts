import fs from 'node:fs/promises'
import prettier from 'prettier'
import { allFeatures } from '../src/all-features.ts'

await main()

async function main() {
  const readmePath = new URL('../README.md', import.meta.url)
  const readmeContent = await fs.readFile(readmePath, 'utf-8')

  const featuresTable = generateFeaturesTable()
  const formattedTable = await prettier.format(featuresTable, {
    parser: 'markdown',
  })

  const newReadmeContent = readmeContent.replace(
    /(<!-- features-table-start -->)([\s\S]*?)(<!-- features-table-end -->)/,
    `$1\n\n${formattedTable}\n$3`,
  )

  await fs.writeFile(readmePath, newReadmeContent, 'utf-8')
}

function generateFeaturesTable() {
  const lines = [
    // (force break lines)
    '| Feature | Description |',
    '| - | - |',
  ]

  for (const [name, feature] of Object.entries(allFeatures)) {
    lines.push(`| \`${name}\` | ${feature.description.trim().replace(/\n/g, ' ')} |`)
  }

  return lines.join('\n')
}

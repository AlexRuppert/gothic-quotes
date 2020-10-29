//@ts-ignore
import yargs from 'yargs'
import globby from 'globby'
import { promises as fs } from 'fs'
//@ts-ignore
import re from 're.js'
import path from 'path'

const distDir = './dist'
const speechDir = path.join(distDir, 'speech')
const gothics = [
  {
    name: 'g1',
    texts: [
      '/**/scripts/content/Story/MISSIONS/*.d',
      '/**/scripts/content/Story/**/svm.d',
    ],
    speech: '/**/sound/SPEECH',
  },
  {
    name: 'g2',
    texts: ['/**/Dialoge/*', '/**/SVM.d'],
    speech: '/**/sound/speech',
  },
  {
    name: 'g3',
    texts: ['/**/stringtable.ini'],
    speech: '/**/sound/SPEECH',
  },
]
const tryMkdir = async (dir: string) => {
  try {
    await fs.mkdir(dir)
  } catch {}
}

interface Quote {
  gothic: string
  speech: string
  text: string
  voice: number
  fileName: string
}
;(async () => {
  await tryMkdir(distDir)
  await tryMkdir(speechDir)
  await Promise.allSettled(
    gothics.map(async g => fs.mkdir(path.join(speechDir, g.name)))
  )
  const quotes = (
    await Promise.allSettled(
      gothics.map(async g =>
        extract(g.name, yargs.argv[g.name].replace(/\\/g, '/'), g.texts)
      )
    )
  )
    .filter(p => 'value' in p)
    .map(p => (p as PromiseFulfilledResult<Quote[]>).value)
    .flat()

  await fs.writeFile(
    path.join(distDir, 'quotes.ts'),
    `export default ${JSON.stringify(unique(quotes))}`
  )

  gothics.forEach(g =>
    console.log(
      `${quotes.filter(q => q.gothic == g.name).length} ${
        g.name
      } quotes extracted`
    )
  )

  if (yargs.boolean('copysound').argv.copysound) {
    let speechPaths = (
      await Promise.allSettled(
        gothics.map(async g => ({
          name: g.name,
          path: (
            await globby(
              path.posix.join(yargs.argv[g.name], g.speech).replace(/\\/g, '/'),
              {
                onlyFiles: false,
                caseSensitiveMatch: false,
              }
            )
          )[0] as string,
        }))
      )
    )

      .map(
        p => (p as PromiseFulfilledResult<{ name: string; path: string }>).value
      )
      .flat()

    await Promise.allSettled(
      quotes.map(async q => {
        const meta = gothics.find(g => g.name == q.gothic)
        const speechPath = speechPaths.find(g => g.name == q.gothic)!.path
        const src = path.join(speechPath, q.speech + '.WAV')
        const dest = path.join(speechDir, meta!.name, q.speech + '.WAV')

        return fs.copyFile(src, dest)
      })
    )
  }
})()

async function extract(
  gothic: string,
  rootPath: string,
  textsPath: string[]
): Promise<Quote[]> {
  if (rootPath) {
    const paths = await globby(
      textsPath.map((el: string) => rootPath + el),
      { caseSensitiveMatch: false }
    )
    return (await Promise.all(paths.map(p => getText(gothic, p)))).flat()
  }
  return []
}

function unique(array: any[]) {
  return [...new Set(array)]
}
async function getText(gothic: string, filePath: string) {
  let lines: Quote[]
  if (gothic === 'g1' || gothic === 'g2') {
    const file = await fs.readFile(filePath, 'latin1')
    const fileName = path.basename(filePath)
    const mapper = matches => {
      let voice = 0
      let text = ''
      let speech = matches[1].trim().toUpperCase()
      if (matches[3]) {
        voice = +matches[2].trim()
        text = matches[3].trim()
      } else {
        text = matches[2].trim()
      }
      return {
        gothic,
        speech,
        text,
        voice,
        fileName,
      }
    }
    lines = re(/AI_Output.*"(.*_(\d\d)_.*)".*\/\/(.*)/i).map(file, mapper)

    if (filePath.toLowerCase().includes('svm.d')) {
      lines = lines.concat(
        re(/=\s*"(.*_(\d+)_.*)"\s*;\/\/(.*)/i).map(file, mapper)
      )
    }
  } else {
    const file = await fs.readFile(filePath, 'utf16le')
    const mapper = matches => {
      return matches[2].trim()
    }

    lines = re(/INFO_.*=([^;]*;){6}([^;]*)/i).map(file, mapper)
  }
  return lines
}

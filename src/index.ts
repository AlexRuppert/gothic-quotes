import copy from 'copy-text-to-clipboard'
import leven from 'leven'
import debounce from 'lodash.debounce'
import * as wavefile from 'wavefile'
import { default as quotesRaw } from '../dist/quotes'

interface Quote {
  text: string
  speech: string
}

const searchInput = document.querySelector('#search') as HTMLInputElement
const voiceG1Input = document.querySelector('#voiceG1') as HTMLInputElement
const voiceG2Input = document.querySelector('#voiceG2') as HTMLInputElement
const copyModeInput = document.querySelector('#copyMode') as HTMLSelectElement
const container = document.querySelector('#results') as HTMLElement
const clearButton = document.querySelector('#clear') as HTMLButtonElement

let quotes = indexQuotes(quotesRaw)

searchInput.focus()
let audio: HTMLAudioElement = new Audio()
let trackUpdate

audio.addEventListener('playing', event => {
  let element = event.target as HTMLAudioElement

  trackUpdate = setInterval(() => {
    const percent = element.currentTime / element.duration
    // console.log(percent)
  }, 100)
})
audio.addEventListener('pause', event => {
  window.clearInterval(trackUpdate)
})

searchInput.addEventListener('input', () => {
  update()
})
voiceG1Input.addEventListener('input', () => {
  update()
})
voiceG2Input.addEventListener('input', () => {
  update()
})
container.addEventListener('click', async e => {
  let element = e.target as HTMLElement

  if (element.nodeName === 'I') {
    element = element.parentNode as HTMLElement
  }
  const quoteId = +(element.dataset.id ?? 0)
  const quote = quotes[quoteId]

  if (copyModeInput.value === 'text') {
    copy(quote.text)
  } else {
    copy(quote.speech)
  }

  audio?.pause()
  try {
    let blob = await fetch(
      `./speech/${quote.gothic}/${quote.speech}.WAV`
    ).then(r => r.blob())
    let buffer = await blob.arrayBuffer()

    var wav = new wavefile.WaveFile(new Uint8Array(buffer))
    wav.fromIMAADPCM()
    var wavDataURI = wav.toDataURI()

    audio.src = wavDataURI
    audio.load()
    audio.play()
  } catch (error) {}

  //console.log(quote.speech)
})
clearButton.addEventListener('click', () => {
  searchInput.value = ''
  searchInput.focus()
  update()
})

const update = debounce(function () {
  const query = searchInput.value
  filter(quotes, query)
}, 250)

function filter(quotes, query) {
  if (query.length <= 2) {
    generateResultList(query, [])
    return
  }
  query = query.toLowerCase()
  let queryParts = []
  if (query.length >= 5) {
    queryParts = query.split(/\s/g).filter(q => q.length > 0)
  }
  let results: Quote[] = []
  quotes.forEach(t => {
    if (t.lowerText.includes(query)) {
      results.push(t)
    }
  })

  generateResultList(query, [...results])
  if (queryParts.length > 0) {
    quotes.forEach(quote => {
      if (
        queryParts.every((part: string) =>
          quote.words.some(
            word =>
              Math.abs(part.length - word.length) < 4 &&
              leven(part, word) <= Math.ceil(word.length / 5)
          )
        )
      ) {
        results.push(quote)
      }
    })
  }
  generateResultList(query, [...results])
}
function indexQuotes(quotes) {
  return quotes.map((q, i) => {
    const text = q.text
    const lowerText = q.text.toLowerCase()
    const words = unique(
      lowerText.split(/\s|\.|\,|\;|\!|\"|\?/g).filter(s => s.length > 3)
    )
    return {
      id: i,
      text,
      words,
      lowerText,
      ...q,
      gothic: q.gothic.toUpperCase(),
    }
  })
}

function generateResultList(query, results) {
  container.innerHTML = ''
  const queryPartsRegex = query
    .split(/\s/g)
    .filter(q => q.length > 0)
    .map(q => new RegExp('(' + escapeRegExp(q) + ')(?!<)', 'ig'))

  const cardTemplate = document.createElement('div')

  const c = document.createDocumentFragment()

  const uniqueTracker = new Set<string>()
  const uniques: Quote[] = []

  for (const line of results) {
    if (!uniqueTracker.has(line.speech)) {
      uniques.push(line)
      uniqueTracker.add(line.speech)
    }
  }
  results = uniques

  if (voiceG1Input.value.length > 0) {
    const voices = voiceG1Input.value.split(',').map(v => +v.trim())

    results = results.filter(
      r => r.gothic !== 'G1' || voices.some(v => v === +r.voice)
    )
  }
  if (voiceG2Input.value.length > 0) {
    const voices = voiceG2Input.value.split(',').map(v => +v.trim())

    results = results.filter(
      r => r.gothic !== 'G2' || voices.some(v => v === +r.voice)
    )
  }
  results.forEach(quote => {
    const card = cardTemplate.cloneNode() as HTMLElement
    let replacedSentence = quote.text
    queryPartsRegex.forEach(r => {
      replacedSentence = replacedSentence.replace(r, '<i>$1</i>')
    })
    card.innerHTML = `<span class="gothic">${quote.gothic}</span><span class="voice">${quote.voice}</span>${replacedSentence}`

    card.dataset.id = quote.id
    c.appendChild(card)
  })
  container.appendChild(c)
}

function unique(array) {
  return [...new Set(array)]
}

function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&')
}

update()

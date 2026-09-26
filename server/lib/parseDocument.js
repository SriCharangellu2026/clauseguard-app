import fs from 'node:fs/promises'
import path from 'node:path'
import mammoth from 'mammoth'
import { createWorker } from 'tesseract.js'
import { SAMPLE_TXT } from '../config.js'

const SECTION_RE =
  /(?:^|\n)\s*(?:Section|SECTION|§)?\s*(\d+(?:\.\d+)*)\s*[.:)\-–]?\s+([^\n]{3,90})\n([\s\S]*?)(?=(?:\n\s*(?:Section|SECTION|§)?\s*\d+(?:\.\d+)*\s*[.:)\-–]?)|$)/g

export function splitSections(fullText) {
  const text = String(fullText || '').replace(/\r\n/g, '\n')
  const sections = []
  let match
  const re = new RegExp(SECTION_RE.source, 'g')
  while ((match = re.exec(text))) {
    const body = match[3].trim()
    if (!body) continue
    sections.push({
      id: `sec-${match[1].replaceAll('.', '-')}`,
      number: match[1],
      title: match[2].trim().replace(/\s+/g, ' '),
      heading: `${match[1]} ${match[2].trim()}`,
      text: body,
      startOffset: match.index,
      endOffset: match.index + match[0].length,
    })
  }
  if (sections.length === 0) {
    const paragraphs = text.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean)
    paragraphs.forEach((block, index) => {
      sections.push({
        id: `p-${index + 1}`,
        number: String(index + 1),
        title: block.slice(0, 48),
        heading: `Paragraph ${index + 1}`,
        text: block,
        startOffset: text.indexOf(block),
        endOffset: text.indexOf(block) + block.length,
      })
    })
  }
  return { text, sections }
}

async function extractPdf(buffer) {
  try {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
    const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer), disableWorker: true, isEvalSupported: false })
    const doc = await loadingTask.promise
    const pages = []
    for (let i = 1; i <= doc.numPages; i += 1) {
      const page = await doc.getPage(i)
      const content = await page.getTextContent()
      pages.push(content.items.map((item) => ('str' in item ? item.str : '')).join(' '))
    }
    return pages.join('\n')
  } catch (error) {
    console.warn('PDF text extract failed', error.message)
    return ''
  }
}

async function ocrBuffer(buffer) {
  const worker = await createWorker('eng')
  try {
    const result = await worker.recognize(buffer)
    return result.data.text || ''
  } finally {
    await worker.terminate()
  }
}

export async function parseUpload({ buffer, filename, mimeType }) {
  const name = String(filename || 'document').toLowerCase()
  let text = ''
  let ocrUsed = false
  if (name.endsWith('.docx') || mimeType?.includes('wordprocessingml')) {
    const result = await mammoth.extractRawText({ buffer })
    text = result.value || ''
  } else if (name.endsWith('.pdf') || mimeType === 'application/pdf') {
    try {
      text = await extractPdf(buffer)
    } catch {
      text = ''
    }
    if (text.replace(/\s+/g, '').length < 80) {
      ocrUsed = true
      text = (await ocrBuffer(buffer)) || text
    }
  } else if (/\.(png|jpe?g|webp|tif{1,2})$/.test(name) || mimeType?.startsWith('image/')) {
    ocrUsed = true
    text = await ocrBuffer(buffer)
  } else {
    text = buffer.toString('utf8')
  }
  const split = splitSections(text)
  return { ...split, ocrUsed, filename: path.basename(filename || 'document') }
}

export async function loadSampleAgreement() {
  const text = await fs.readFile(SAMPLE_TXT, 'utf8')
  return { ...splitSections(text), ocrUsed: false, filename: 'MSA-2026-441.txt' }
}

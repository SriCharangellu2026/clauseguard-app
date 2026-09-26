import JSZip from 'jszip'
import { MODEL_VERSION, POLICY_VERSION } from '../config.js'

function xmlEscape(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function runsFromClause(clause, now) {
  const original = clause.original || ''
  const proposed = clause.proposed || original
  if (clause.disposition !== 'accepted' || original === proposed) {
    return `<w:r><w:t xml:space="preserve">${xmlEscape(original)}</w:t></w:r>`
  }
  return [
    `<w:del w:author="LegalLens AI" w:date="${now}"><w:r><w:delText xml:space="preserve">${xmlEscape(original)}</w:delText></w:r></w:del>`,
    `<w:ins w:author="LegalLens AI" w:date="${now}"><w:r><w:t xml:space="preserve">${xmlEscape(proposed)}</w:t></w:r></w:ins>`,
  ].join('')
}

function paragraph(inner) {
  return `<w:p>${inner}</w:p>`
}

export async function buildTrackedDocx({ documentName, clauses, user }) {
  const now = new Date().toISOString()
  const body = [
    paragraph(`<w:r><w:rPr><w:b/></w:rPr><w:t>ClauseGuard redline — ${xmlEscape(documentName || 'Agreement')}</w:t></w:r>`),
    paragraph(
      `<w:r><w:t xml:space="preserve">${xmlEscape(
        `${POLICY_VERSION} · ${MODEL_VERSION} · prepared by ${user?.email || 'reviewer'}`,
      )}</w:t></w:r>`,
    ),
    ...clauses.flatMap((clause) => [
      paragraph(
        `<w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">${xmlEscape(
          `§${clause.section} ${clause.title} [${clause.severity}/${clause.disposition}]`,
        )}</w:t></w:r>`,
      ),
      paragraph(runsFromClause(clause, now)),
    ]),
  ].join('')

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>${body}<w:sectPr/></w:body>
</w:document>`

  const settingsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:trackRevisions w:val="true"/>
</w:settings>`

  const types = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
</Types>`

  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`

  const docRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>
</Relationships>`

  const zip = new JSZip()
  zip.file('[Content_Types].xml', types)
  zip.folder('_rels').file('.rels', rels)
  zip.folder('word').file('document.xml', documentXml).file('settings.xml', settingsXml)
  zip.folder('word/_rels').file('document.xml.rels', docRels)
  return zip.generateAsync({ type: 'nodebuffer' })
}

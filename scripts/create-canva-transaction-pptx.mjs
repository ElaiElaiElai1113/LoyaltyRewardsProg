import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const outDir = 'tmp-canva-transaction-pptx'

const slides = [
  {
    title: 'Business Transactions Training',
    subtitle: 'How to process normal sales and gift-card sales in Medellin Rewards.',
    bullets: [
      'Staff use the Transactions page.',
      'Staff can process a sale with or without a gift card.',
      'The system calculates customer total, points, and commission.',
    ],
    visual: 'Screenshot: /business/redemptions',
  },
  {
    title: 'Before You Start',
    subtitle: 'Have these details ready before processing a sale.',
    bullets: [
      'Customer Member QR.',
      'Receipt or bill number.',
      'Bill before tax and service charge.',
      'Optional gift card QR, link, or code.',
    ],
    visual: 'Visual: QR, receipt, bill amount, gift card.',
  },
  {
    title: 'Open the Transactions Page',
    subtitle: 'Route: /business/redemptions',
    bullets: [
      'Sign in to the Business Portal.',
      'Open Transactions.',
      'Use this page for normal transactions and gift-card transactions.',
    ],
    visual: 'Screenshot: business navigation with Transactions highlighted.',
  },
  {
    title: 'Step 1: Load the Customer',
    subtitle: 'Normal transaction flow',
    bullets: [
      'Scan the customer Member QR.',
      'Or paste the Member QR link/token.',
      'Click Load Member.',
      'Confirm the customer name appears.',
    ],
    visual: 'Callout: Member QR field and Load Member button.',
  },
  {
    title: 'Step 2: Enter Sale Details',
    subtitle: 'Use the base purchase amount.',
    bullets: [
      'Enter the bill before tax and service charge.',
      'Enter the receipt or bill number.',
      'Example: if the food bill is 230, enter 230.',
    ],
    visual: 'Screenshot: bill amount and receipt fields.',
  },
  {
    title: 'Step 3: Review the Calculation',
    subtitle: 'Check the preview before processing.',
    bullets: [
      'Reward rate, reward value, and points awarded.',
      'Tax added, if enabled.',
      'Service charge, if enabled.',
      'Customer total and commission.',
      'Rule: points are based on the bill before tax and service charge.',
    ],
    visual: 'Screenshot: Reward Calculation preview.',
  },
  {
    title: 'Step 4: Process Without Gift Card',
    subtitle: 'Use this when the customer is making a normal purchase.',
    bullets: [
      'Check the customer and receipt.',
      'Check the reward preview.',
      'Click Process Without Gift Card.',
      'Wait for success.',
      'Click New Transaction for the next customer.',
    ],
    visual: 'Circle: Process Without Gift Card and New Transaction.',
  },
  {
    title: 'Gift Card Sale: Add the Gift Card',
    subtitle: 'Only use this when the customer pays with a gift card.',
    bullets: [
      'Load the customer.',
      'Enter bill amount.',
      'Enter receipt number.',
      'Scan, upload, paste, or type the gift card QR/link/code.',
    ],
    visual: 'Screenshot: optional gift card section.',
  },
  {
    title: 'Validate the Gift Card',
    subtitle: 'Confirm the gift card can be used.',
    bullets: [
      'Click Validate Gift Card.',
      'Confirm status says Active.',
      'Confirm it belongs to this business.',
      'If not active, do not process the gift card.',
    ],
    visual: 'Circle: Validate Gift Card button and Active badge.',
  },
  {
    title: 'How Gift Card Math Works',
    subtitle: 'Simple rule for staff',
    bullets: [
      'Gift card reduces the customer total.',
      'Points are still based on the bill before tax and service charge.',
      'Tax and service charge do not create reward points.',
      'Example: 230 bill + 12.6% tax - 230 gift card = 28.98 customer total.',
      'Reward rate 20% means 46 points awarded.',
    ],
    visual: 'Visual: simple math graphic or Reward Calculation preview.',
  },
  {
    title: 'Process With Gift Card',
    subtitle: 'After validation, process the gift-card transaction.',
    bullets: [
      'Confirm gift card is Active.',
      'Check gift card discount.',
      'Check customer total.',
      'Check points awarded.',
      'Click Process With Gift Card.',
      'Click New Transaction for the next customer.',
    ],
    visual: 'Circle: Process With Gift Card button.',
  },
  {
    title: 'Review Transaction History',
    subtitle: 'Use history for review and audit.',
    bullets: [
      'Receipt number, date, and customer.',
      'Total, gift card discount, and final price.',
      'Points, gift card code, and status.',
      'Use this to confirm points and review gift card use.',
    ],
    visual: 'Callouts: receipt/customer, money summary, points/gift-card code.',
  },
]

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function textShape(id, name, x, y, cx, cy, text, size, color = '2c1a12', bold = false) {
  return `
    <p:sp>
      <p:nvSpPr><p:cNvPr id="${id}" name="${esc(name)}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
      <p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></p:spPr>
      <p:txBody><a:bodyPr wrap="square"/><a:lstStyle/><a:p><a:r><a:rPr lang="en-US" sz="${size}"${bold ? ' b="1"' : ''}><a:solidFill><a:srgbClr val="${color}"/></a:solidFill></a:rPr><a:t>${esc(text)}</a:t></a:r><a:endParaRPr lang="en-US" sz="${size}"/></a:p></p:txBody>
    </p:sp>`
}

function bulletShape(id, x, y, cx, cy, bullets) {
  const paragraphs = bullets.map((bullet) => `
    <a:p>
      <a:pPr marL="342900" indent="-171450"><a:buChar char="•"/></a:pPr>
      <a:r><a:rPr lang="en-US" sz="2100"><a:solidFill><a:srgbClr val="2c1a12"/></a:solidFill></a:rPr><a:t>${esc(bullet)}</a:t></a:r>
    </a:p>`).join('')

  return `
    <p:sp>
      <p:nvSpPr><p:cNvPr id="${id}" name="Main points"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
      <p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></p:spPr>
      <p:txBody><a:bodyPr wrap="square"/><a:lstStyle/>${paragraphs}</p:txBody>
    </p:sp>`
}

function roundedBox(id, x, y, cx, cy, fill, line = 'c89a62') {
  return `
    <p:sp>
      <p:nvSpPr><p:cNvPr id="${id}" name="Visual placeholder"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
      <p:spPr>
        <a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>
        <a:prstGeom prst="roundRect"><a:avLst/></a:prstGeom>
        <a:solidFill><a:srgbClr val="${fill}"/></a:solidFill>
        <a:ln w="19050"><a:solidFill><a:srgbClr val="${line}"/></a:solidFill></a:ln>
      </p:spPr>
    </p:sp>`
}

function slideXml(slide, index) {
  const slideNo = index + 1
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:bg><p:bgPr><a:solidFill><a:srgbClr val="fff6eb"/></a:solidFill><a:effectLst/></p:bgPr></p:bg>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
      ${roundedBox(2, 0, 0, 12192000, 685800, '5a351d', '5a351d')}
      ${textShape(3, 'Deck label', 457200, 198120, 5486400, 304800, 'Medellin Rewards Staff Guide', 1600, 'fff6eb', true)}
      ${textShape(4, 'Slide number', 10668000, 198120, 914400, 304800, `${slideNo}/12`, 1400, 'fff6eb', true)}
      ${textShape(5, 'Title', 609600, 914400, 7620000, 914400, slide.title, 3600, '6b3b18', true)}
      ${textShape(6, 'Subtitle', 609600, 1676400, 7620000, 457200, slide.subtitle, 1700, '7f654f')}
      ${bulletShape(7, 731520, 2438400, 5334000, 2743200, slide.bullets)}
      ${roundedBox(8, 6461760, 2209800, 4724400, 3002280, 'f4dfc8')}
      ${textShape(9, 'Visual label', 6797040, 2468880, 3962400, 457200, 'Visual / Screenshot Placeholder', 1700, '6b3b18', true)}
      ${textShape(10, 'Visual instruction', 6797040, 3154680, 3962400, 1371600, slide.visual, 1800, '2c1a12')}
      ${roundedBox(11, 609600, 5943600, 10972800, 304800, 'c89a62', 'c89a62')}
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>`
}

function slideRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
</Relationships>`
}

rmSync(outDir, { force: true, recursive: true })
for (const dir of [
  '_rels',
  'docProps',
  'ppt/_rels',
  'ppt/slides/_rels',
  'ppt/slides',
  'ppt/slideLayouts/_rels',
  'ppt/slideLayouts',
  'ppt/slideMasters/_rels',
  'ppt/slideMasters',
  'ppt/theme',
]) {
  mkdirSync(join(outDir, dir), { recursive: true })
}

writeFileSync(join(outDir, '[Content_Types].xml'), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
  ${slides.map((_, index) => `<Override PartName="/ppt/slides/slide${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`).join('\n  ')}
</Types>`)

writeFileSync(join(outDir, '_rels/.rels'), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`)

writeFileSync(join(outDir, 'docProps/core.xml'), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>Business Transactions and Gift Cards Training</dc:title>
  <dc:creator>Medellin Rewards</dc:creator>
  <cp:lastModifiedBy>Medellin Rewards</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">2026-07-02T00:00:00Z</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">2026-07-02T00:00:00Z</dcterms:modified>
</cp:coreProperties>`)

writeFileSync(join(outDir, 'docProps/app.xml'), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Medellin Rewards</Application><PresentationFormat>Widescreen</PresentationFormat><Slides>${slides.length}</Slides>
</Properties>`)

writeFileSync(join(outDir, 'ppt/presentation.xml'), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>
  <p:sldIdLst>
    ${slides.map((_, index) => `<p:sldId id="${256 + index}" r:id="rId${index + 2}"/>`).join('\n    ')}
  </p:sldIdLst>
  <p:sldSz cx="12192000" cy="6858000" type="wide"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>`)

writeFileSync(join(outDir, 'ppt/_rels/presentation.xml.rels'), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
  ${slides.map((_, index) => `<Relationship Id="rId${index + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${index + 1}.xml"/>`).join('\n  ')}
</Relationships>`)

writeFileSync(join(outDir, 'ppt/slideMasters/slideMaster1.xml'), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld>
  <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
  <p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>
</p:sldMaster>`)

writeFileSync(join(outDir, 'ppt/slideMasters/_rels/slideMaster1.xml.rels'), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
</Relationships>`)

writeFileSync(join(outDir, 'ppt/slideLayouts/slideLayout1.xml'), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank">
  <p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sldLayout>`)

writeFileSync(join(outDir, 'ppt/slideLayouts/_rels/slideLayout1.xml.rels'), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>`)

writeFileSync(join(outDir, 'ppt/theme/theme1.xml'), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Medellin Rewards">
  <a:themeElements><a:clrScheme name="Medellin Rewards"><a:dk1><a:srgbClr val="2c1a12"/></a:dk1><a:lt1><a:srgbClr val="fff6eb"/></a:lt1><a:dk2><a:srgbClr val="5a351d"/></a:dk2><a:lt2><a:srgbClr val="f4dfc8"/></a:lt2><a:accent1><a:srgbClr val="a96719"/></a:accent1><a:accent2><a:srgbClr val="c89a62"/></a:accent2><a:accent3><a:srgbClr val="2f6f4e"/></a:accent3><a:accent4><a:srgbClr val="f2c66d"/></a:accent4><a:accent5><a:srgbClr val="7f654f"/></a:accent5><a:accent6><a:srgbClr val="efe1d1"/></a:accent6><a:hlink><a:srgbClr val="a96719"/></a:hlink><a:folHlink><a:srgbClr val="7f654f"/></a:folHlink></a:clrScheme><a:fontScheme name="Office"><a:majorFont><a:latin typeface="Aptos Display"/></a:majorFont><a:minorFont><a:latin typeface="Aptos"/></a:minorFont></a:fontScheme><a:fmtScheme name="Office"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements>
</a:theme>`)

slides.forEach((slide, index) => {
  writeFileSync(join(outDir, `ppt/slides/slide${index + 1}.xml`), slideXml(slide, index))
  writeFileSync(join(outDir, `ppt/slides/_rels/slide${index + 1}.xml.rels`), slideRelsXml())
})

console.log(outDir)

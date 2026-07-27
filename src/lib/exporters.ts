// 기록을 엑셀(.xlsx) / 워드(.docx) 파일로 내려받는 도구입니다.
// 무료 오픈소스 라이브러리(xlsx, docx)만 사용합니다.
// - 엑셀: 통계 화면 전용 (월간요약 + 수입/지출/일기 기록, 모든 기록에 날짜 포함)
// - 워드: 기록 화면 전용 (일기 기록만)
import * as XLSX from 'xlsx'
import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  TextRun,
  ImageRun,
  AlignmentType,
} from 'docx'
import type { Diary } from './diaries'
import type { Transaction } from './transactions'
import { getPhotosByDate } from './photos'
import { formatEntryDate } from './today'

export type ExportData = {
  month: string // "YYYY-MM"
  diaries: Diary[]
  transactions: Transaction[]
}

// 그 달 데이터만 골라내고 합계를 계산합니다. (날짜 오름차순 정렬)
function prepare({ month, diaries, transactions }: ExportData) {
  const monthDiaries = diaries
    .filter((d) => d.entry_date.startsWith(month))
    .sort((a, b) => a.entry_date.localeCompare(b.entry_date))
  const monthTx = transactions
    .filter((t) => t.tx_date.startsWith(month))
    .sort((a, b) => a.tx_date.localeCompare(b.tx_date))
  const incomeTx = monthTx.filter((t) => t.type === 'income')
  const expenseTx = monthTx.filter((t) => t.type === 'expense')
  const income = incomeTx.reduce((s, t) => s + Number(t.amount), 0)
  const expense = expenseTx.reduce((s, t) => s + Number(t.amount), 0)
  return {
    monthDiaries,
    incomeTx,
    expenseTx,
    income,
    expense,
    balance: income - expense,
  }
}

// 브라우저에서 파일 다운로드를 시작합니다.
function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// ── 엑셀(.xlsx) 내보내기 (통계 화면 전용) ─────────
// 시트 순서: 수입 기록 → 지출 기록 → 월간 요약 (일기 기록은 넣지 않음)
export function exportStatsXlsx(data: ExportData): void {
  const { incomeTx, expenseTx, income, expense, balance } = prepare(data)
  const wb = XLSX.utils.book_new()

  // 1) 수입 기록 (날짜 · 카테고리 · 금액 · 메모)
  const incomeRows = [
    ['날짜', '카테고리', '금액', '메모'],
    ...incomeTx.map((t) => [
      t.tx_date, // YYYY-MM-DD
      t.category ?? '',
      Number(t.amount),
      t.memo ?? '',
    ]),
  ]
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(incomeRows),
    '수입 기록',
  )

  // 2) 지출 기록 (날짜 · 카테고리 · 금액 · 메모)
  const expenseRows = [
    ['날짜', '카테고리', '금액', '메모'],
    ...expenseTx.map((t) => [
      t.tx_date,
      t.category ?? '',
      Number(t.amount),
      t.memo ?? '',
    ]),
  ]
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(expenseRows),
    '지출 기록',
  )

  // 3) 월간 요약
  const summary = [
    ['기준 월', data.month],
    ['총 수입', income],
    ['총 지출', expense],
    ['남은 금액', balance],
  ]
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(summary),
    '월간 요약',
  )

  const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
  download(
    new Blob([out], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    `soso-diary-통계-${data.month}.xlsx`,
  )
}

// ── 워드(.docx) 내보내기 (일기 — 제목/날짜 + 본문 + 사진 포함) ──

// 워드 문서 안에서 이미지의 최대 가로 너비(px). A4/Letter 여백(약 2.5cm)을 뺀 값에 맞춥니다.
const DOC_IMG_MAX_W = 480

type DocImage = {
  data: Uint8Array
  width: number
  height: number
  type: 'jpg' | 'png' | 'gif' | 'bmp'
}

// 이미지 주소(서명 URL 또는 base64 Data URL)를 워드에 넣을 형태로 가져옵니다.
// - 원본 크기를 읽어 문서 폭(DOC_IMG_MAX_W)에 맞게 비율을 유지하며 줄입니다.
// - 실패하면 null (그 사진만 건너뜀)
async function fetchImageForDoc(url: string): Promise<DocImage | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const blob = await res.blob()
    const buf = await blob.arrayBuffer()

    let w = DOC_IMG_MAX_W
    let h = Math.round(DOC_IMG_MAX_W * 0.66)
    try {
      const bmp = await createImageBitmap(blob)
      const scale = Math.min(1, DOC_IMG_MAX_W / bmp.width)
      w = Math.max(1, Math.round(bmp.width * scale))
      h = Math.max(1, Math.round(bmp.height * scale))
      bmp.close()
    } catch {
      // 크기를 못 읽으면 기본 비율로 둡니다.
    }

    const type: DocImage['type'] = blob.type.includes('png') ? 'png' : 'jpg'
    return { data: new Uint8Array(buf), width: w, height: h, type }
  } catch {
    return null
  }
}

// 일기 한 편을 문서 문단들로 변환합니다. (제목/날짜 → 본문 여러 줄 → 사진들)
async function diaryToParagraphs(d: Diary): Promise<Paragraph[]> {
  const out: Paragraph[] = []

  // 제목 + 날짜 (기분 이모지 포함)
  out.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 240, after: 60 },
      children: [
        new TextRun({
          text: `${d.mood ? d.mood + ' ' : ''}${formatEntryDate(d.entry_date)}`,
          bold: true,
        }),
      ],
    }),
  )

  // 본문 — 줄바꿈(\n)을 문단으로 나눠 그대로 유지 (이모지도 텍스트로 보존)
  const lines = (d.content ?? '').split('\n')
  for (const line of lines) {
    out.push(new Paragraph({ children: [new TextRun({ text: line })] }))
  }

  // 첨부 사진 — 서버(Storage)에서 불러와 문서에 삽입
  try {
    const photos = await getPhotosByDate(d.entry_date)
    for (const p of photos) {
      const img = await fetchImageForDoc(p.url)
      if (!img) continue
      out.push(
        new Paragraph({
          spacing: { before: 80, after: 80 },
          children: [
            new ImageRun({
              type: img.type,
              data: img.data,
              transformation: { width: img.width, height: img.height },
            }),
          ],
        }),
      )
    }
  } catch {
    // 사진을 못 불러와도 본문은 그대로 내보냅니다.
  }

  return out
}

// 여러 일기를 하나의 워드 문서로 만들어 내려받습니다. (날짜 오름차순)
// filename 을 주지 않으면 날짜 범위로 "일기_시작_끝.docx" 를 자동 생성합니다.
export async function exportDiariesDocx(
  diaries: Diary[],
  filename?: string,
): Promise<void> {
  const sorted = [...diaries].sort((a, b) =>
    a.entry_date.localeCompare(b.entry_date),
  )

  const children: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: 'Soso Diary 일기', bold: true, size: 36 }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      children: [
        new TextRun({
          text:
            sorted.length > 0
              ? `${formatEntryDate(sorted[0].entry_date)} ~ ${formatEntryDate(sorted[sorted.length - 1].entry_date)} · 총 ${sorted.length}편`
              : '일기가 없어요.',
          size: 24,
          color: '3FA535',
        }),
      ],
    }),
  ]

  for (const d of sorted) {
    const paras = await diaryToParagraphs(d)
    children.push(...paras)
  }

  const doc = new Document({ sections: [{ children }] })
  const blob = await Packer.toBlob(doc)

  const name =
    filename ??
    (sorted.length > 0
      ? sorted.length === 1
        ? `일기_${sorted[0].entry_date}.docx`
        : `일기_${sorted[0].entry_date}_${sorted[sorted.length - 1].entry_date}.docx`
      : `일기_${new Date().toISOString().slice(0, 10)}.docx`)
  download(blob, name)
}

// 일기 한 편만 워드로 내려받습니다. 파일명: "일기_YYYY-MM-DD.docx"
export async function exportSingleDiaryDocx(diary: Diary): Promise<void> {
  await exportDiariesDocx([diary], `일기_${diary.entry_date}.docx`)
}

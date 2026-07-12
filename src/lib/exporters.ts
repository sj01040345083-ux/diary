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
  AlignmentType,
} from 'docx'
import type { Diary } from './diaries'
import type { Transaction } from './transactions'
import { formatEntryDate } from './today'

// "2026-07" → "2026년 7월"
function monthTitle(month: string): string {
  const [y, m] = month.split('-')
  return `${y}년 ${Number(m)}월`
}

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

// ── 워드(.docx) 내보내기 (기록 화면 전용, 일기만) ──
export async function exportDiaryDocx(data: ExportData): Promise<void> {
  const { monthDiaries } = prepare(data)

  const children: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: 'Soso Diary 일기 기록', bold: true, size: 36 }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      children: [
        new TextRun({
          text: `기준 월: ${monthTitle(data.month)}`,
          size: 24,
          color: '3FA535',
        }),
      ],
    }),
  ]

  if (monthDiaries.length === 0) {
    children.push(new Paragraph({ text: '이 달의 일기가 없어요.' }))
  } else {
    for (const d of monthDiaries) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 220, after: 40 },
          children: [
            new TextRun({
              text: `${d.mood ? d.mood + ' ' : ''}${formatEntryDate(d.entry_date)}`,
              bold: true,
            }),
          ],
        }),
        new Paragraph({ text: d.content }),
      )
    }
  }

  const doc = new Document({ sections: [{ children }] })
  const blob = await Packer.toBlob(doc)
  download(blob, `soso-diary-일기-${data.month}.docx`)
}

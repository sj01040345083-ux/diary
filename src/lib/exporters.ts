// 기록과 월간 통계를 엑셀(.xlsx) / 워드(.docx) 파일로 내려받는 도구입니다.
// 무료 오픈소스 라이브러리(xlsx, docx)만 사용합니다.
import * as XLSX from 'xlsx'
import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
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

function won(n: number): string {
  return n.toLocaleString('ko-KR')
}

export type ExportData = {
  month: string // "YYYY-MM"
  diaries: Diary[]
  transactions: Transaction[]
}

// 그 달 데이터만 골라내고 합계를 계산합니다.
function prepare({ month, diaries, transactions }: ExportData) {
  const monthDiaries = diaries
    .filter((d) => d.entry_date.startsWith(month))
    .sort((a, b) => a.entry_date.localeCompare(b.entry_date))
  const monthTx = transactions
    .filter((t) => t.tx_date.startsWith(month))
    .sort((a, b) => a.tx_date.localeCompare(b.tx_date))
  const income = monthTx
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + Number(t.amount), 0)
  const expense = monthTx
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + Number(t.amount), 0)
  return { monthDiaries, monthTx, income, expense, balance: income - expense }
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
  // 잠시 후 메모리 정리
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// ── 엑셀(.xlsx) 내보내기 ─────────────────────────
export function exportRecordsXlsx(data: ExportData): void {
  const { monthDiaries, monthTx, income, expense, balance } = prepare(data)
  const wb = XLSX.utils.book_new()

  // 1) 월간 요약 시트
  const summary = [
    ['항목', '금액(원)'],
    ['총 수입', income],
    ['총 지출', expense],
    ['잔액', balance],
  ]
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(summary),
    '월간요약',
  )

  // 2) 일기 시트
  const diaryRows = [
    ['날짜', '기분', '내용'],
    ...monthDiaries.map((d) => [d.entry_date, d.mood ?? '', d.content]),
  ]
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(diaryRows),
    '일기',
  )

  // 3) 소비·수입 시트
  const txRows = [
    ['날짜', '구분', '카테고리', '금액(원)', '메모'],
    ...monthTx.map((t) => [
      t.tx_date,
      t.type === 'income' ? '수입' : '지출',
      t.category ?? '',
      Number(t.amount),
      t.memo ?? '',
    ]),
  ]
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(txRows),
    '소비수입',
  )

  const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
  download(
    new Blob([out], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    `soso-diary-records-${data.month}.xlsx`,
  )
}

// ── 워드(.docx) 내보내기 ─────────────────────────
function cell(text: string, bold = false, align: 'left' | 'right' = 'left') {
  return new TableCell({
    width: { size: 33, type: WidthType.PERCENTAGE },
    children: [
      new Paragraph({
        alignment:
          align === 'right' ? AlignmentType.RIGHT : AlignmentType.LEFT,
        children: [new TextRun({ text, bold })],
      }),
    ],
  })
}

export async function exportReportDocx(data: ExportData): Promise<void> {
  const { monthDiaries, monthTx, income, expense, balance } = prepare(data)

  const summaryTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [cell('항목', true), cell('금액(원)', true, 'right')],
      }),
      new TableRow({
        children: [cell('총 수입'), cell(`${won(income)}원`, false, 'right')],
      }),
      new TableRow({
        children: [cell('총 지출'), cell(`${won(expense)}원`, false, 'right')],
      }),
      new TableRow({
        children: [
          cell('잔액', true),
          cell(`${won(balance)}원`, true, 'right'),
        ],
      }),
    ],
  })

  const children: (Paragraph | Table)[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: 'Soso Diary', bold: true, size: 40 }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      children: [
        new TextRun({
          text: `${monthTitle(data.month)} 기록 리포트`,
          size: 26,
          color: '3FA535',
        }),
      ],
    }),
    new Paragraph({ text: '월간 요약', heading: HeadingLevel.HEADING_2 }),
    summaryTable,
    new Paragraph({
      text: '일기',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 400 },
    }),
  ]

  if (monthDiaries.length === 0) {
    children.push(new Paragraph({ text: '이 달의 일기가 없어요.' }))
  } else {
    for (const d of monthDiaries) {
      children.push(
        new Paragraph({
          spacing: { before: 160 },
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

  children.push(
    new Paragraph({
      text: '소비 · 수입',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 400 },
    }),
  )
  if (monthTx.length === 0) {
    children.push(new Paragraph({ text: '이 달의 소비·수입 기록이 없어요.' }))
  } else {
    for (const t of monthTx) {
      const sign = t.type === 'income' ? '+' : '-'
      children.push(
        new Paragraph({
          spacing: { before: 80 },
          children: [
            new TextRun({
              text: `${t.tx_date}  ·  ${t.category ?? '기타'}  ·  ${sign}${won(Number(t.amount))}원${t.memo ? '  ·  ' + t.memo : ''}`,
            }),
          ],
        }),
      )
    }
  }

  const doc = new Document({ sections: [{ children }] })
  const blob = await Packer.toBlob(doc)
  download(blob, `soso-diary-report-${data.month}.docx`)
}

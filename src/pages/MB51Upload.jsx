
import { useState } from 'react'
import * as XLSX from 'xlsx'

const REQUIRED_COLUMNS = [
  '過帳日期',
  '異動類型',
  '物料',
  '以輸入單位表示的數量',
]

// 將日期統一轉成 YYYY-MM-DD
function formatDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return [
      value.getFullYear(),
      String(value.getMonth() + 1).padStart(2, '0'),
      String(value.getDate()).padStart(2, '0'),
    ].join('-')
  }

  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value)

    if (!date) return null

    return [
      date.y,
      String(date.m).padStart(2, '0'),
      String(date.d).padStart(2, '0'),
    ].join('-')
  }

  if (typeof value === 'string' && value.trim()) {
    const text = value.trim()
    const normalized = text.replace(/[./]/g, '-')
    const match = normalized.match(
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/
    )

    if (match) {
      const [, year, month, day] = match

      const date = new Date(
        Number(year),
        Number(month) - 1,
        Number(day)
      )

      if (
        date.getFullYear() === Number(year) &&
        date.getMonth() === Number(month) - 1 &&
        date.getDate() === Number(day)
      ) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      }
    }
  }

  return null
}

// 檢查每一筆資料
function validateRow(row, index) {
  const errors = []
  const rowNumber = index + 2

  const date = formatDate(row['過帳日期'])
  const material = String(row['物料'] ?? '').trim()
  const movement = String(row['異動類型'] ?? '').trim()

  const rawQuantity = row['以輸入單位表示的數量']

  const quantityText =
    typeof rawQuantity === 'string'
      ? rawQuantity.replace(/,/g, '').trim()
      : rawQuantity

  const quantity =
    quantityText === '' ||
    quantityText === null ||
    quantityText === undefined
      ? NaN
      : Number(quantityText)

  if (!date) {
    errors.push(`第 ${rowNumber} 列：過帳日期格式錯誤`)
  }

  if (!material) {
    errors.push(`第 ${rowNumber} 列：物料不可空白`)
  }

  if (!/^\d{3}$/.test(movement)) {
    errors.push(`第 ${rowNumber} 列：異動類型應為三位數代碼`)
  }

  if (!Number.isFinite(quantity)) {
    errors.push(`第 ${rowNumber} 列：數量不是有效數字`)
  }

  return {
    valid: errors.length === 0,
    errors,
    data: {
      過帳日期: date,
      異動類型: movement,
      物料: material,
      以輸入單位表示的數量: quantity,
    },
  }
}

export default function MB51Upload({ onImport }) {
  const [fileName, setFileName] = useState('')
  const [rows, setRows] = useState([])
  const [errors, setErrors] = useState([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const [confirmed, setConfirmed] = useState(false)

  const validRows = rows.filter((row) => row.valid)
  const invalidRows = rows.filter((row) => !row.valid)

  // 選擇 Excel 檔案
  async function handleFileChange(event) {
    const file = event.target.files?.[0]

    if (!file) return

    // 允許再次選擇相同檔案
    event.target.value = ''

    setFileName(file.name)
    setRows([])
    setErrors([])
    setMessage('')
    setConfirmed(false)
    setLoading(true)

    try {
      const extension = file.name
        .split('.')
        .pop()
        .toLowerCase()

      if (!['xlsx', 'xls'].includes(extension)) {
        throw new Error(
          '請上傳 .xlsx 或 .xls 格式的 Excel 檔案。'
        )
      }

      const buffer = await file.arrayBuffer()

      const workbook = XLSX.read(buffer, {
        type: 'array',
        cellDates: true,
      })

      const sheetName = workbook.SheetNames[0]

      if (!sheetName) {
        throw new Error('Excel 檔案中沒有工作表。')
      }

      const worksheet = workbook.Sheets[sheetName]

      const data = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: '',
        raw: true,
        blankrows: false,
      })

      if (!data.length) {
        throw new Error('Excel 工作表沒有資料。')
      }

      const headers = data[0].map((value) =>
        String(value).trim()
      )

      // 檢查必要欄位
      const missingColumns = REQUIRED_COLUMNS.filter(
        (column) => !headers.includes(column)
      )

      if (missingColumns.length > 0) {
        throw new Error(
          `缺少必要欄位：${missingColumns.join('、')}。請確認 Excel 欄位名稱。`
        )
      }

      // 檢查重複欄位
      const duplicateColumns = REQUIRED_COLUMNS.filter(
        (column) =>
          headers.filter((header) => header === column).length > 1
      )

      if (duplicateColumns.length > 0) {
        throw new Error(
          `欄位名稱重複：${duplicateColumns.join('、')}。`
        )
      }

      const columnIndexes = REQUIRED_COLUMNS.map(
        (column) => headers.indexOf(column)
      )

      // 整理資料
      const records = data
        .slice(1)
        .filter((row) =>
          columnIndexes.some((columnIndex) => {
            const value = row[columnIndex]

            return (
              value !== '' &&
              value !== null &&
              value !== undefined
            )
          })
        )
        .map((row) => {
          const record = {}

          REQUIRED_COLUMNS.forEach((column, index) => {
            record[column] = row[columnIndexes[index]]
          })

          return record
        })

      if (records.length === 0) {
        throw new Error('找不到任何資料列。')
      }

      // 逐筆檢查
      const results = records.map((record, index) =>
        validateRow(record, index)
      )

      setRows(results)

      const allErrors = results.flatMap(
        (result) => result.errors
      )

      setErrors(allErrors)

      if (results.every((result) => result.valid)) {
        setMessage('資料檢查通過，可以確認匯入。')
      } else {
        setMessage('資料檢查未通過，請確認異常資料。')
      }

    } catch (error) {
      setMessage(
        error.message || 'Excel 讀取失敗，請確認檔案格式。'
      )
    } finally {
      setLoading(false)
    }
  }

  // 確認匯入
  function handleConfirm() {
    if (
      invalidRows.length > 0 ||
      validRows.length === 0 ||
      confirmed
    ) {
      return
    }

    const imported = validRows.map((row) => row.data)

    // 將資料傳給 App.jsx
    onImport?.(imported)

    setConfirmed(true)
    setMessage(
      `已確認 ${imported.length} 筆資料，並帶入物料耗用分析。`
    )
  }

  return (
    <div className="container-fluid py-4">

      {/* MB51 上傳標題 */}
      <div className="mb-4">
        <h4 className="fw-bold mb-1">
          MB51 資料上傳
        </h4>
      </div>

      
    {/* Excel 欄位提醒 */}
    <div className="card border-0 shadow-sm mb-4">
    <div className="card-body p-4 text-center">

        <div className="fw-semibold mb-3">
        <i className="bi bi-info-circle me-2 text-primary" />
        SAP MB51 匯出 Excel 僅需保留以下欄位：
        </div>

              <div className="d-flex flex-wrap justify-content-center gap-2">
        {REQUIRED_COLUMNS.map((column) => (
          <span
            key={column}
            className="badge bg-light text-danger border px-3 py-2"
          >
            {column}
          </span>
        ))}
      </div>

      {/* 納入計算的異動類型 */}
      <div className="mt-3">
        <div className="text-secondary small mb-2">
          目前納入計算的異動類型：
        </div>

        <div className="d-flex flex-wrap justify-content-center gap-2">
          {['261', '262', '543', '544', '685', '686'].map((type) => (
            <span
              key={type}
              className="badge bg-light text-primary border px-3 py-2"
            >
              {type}
            </span>
          ))}
        </div>
      </div>

    </div>
    </div>


      {/* Excel 上傳區 */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">

          <h6 className="fw-bold mb-3">
            上傳 MB51 Excel 檔案
          </h6>

          <label
            htmlFor="mb51-file-input"
            className="border border-2 border-dashed rounded-3 p-5 text-center d-block"
            style={{
              cursor: 'pointer',
              background: '#f8f9fa',
            }}
          >
            <i className="bi bi-cloud-arrow-up fs-1 text-primary" />

            <div className="fw-semibold mt-2">
              點擊選擇 Excel 檔案
            </div>

            <div className="text-secondary small mt-1">
              支援 .xlsx、.xls 格式
            </div>

            {fileName && (
              <div className="text-primary small mt-3">
                <i className="bi bi-file-earmark-excel me-2" />
                {fileName}
              </div>
            )}
          </label>

          <input
            id="mb51-file-input"
            type="file"
            accept=".xlsx,.xls"
            className="d-none"
            onChange={handleFileChange}
          />

          {loading && (
            <div className="text-primary mt-3 small">
              <span className="spinner-border spinner-border-sm me-2" />
              正在讀取及檢查 Excel...
            </div>
          )}

          {message && (
            <div
              className={`alert mt-3 mb-0 ${
                confirmed
                  ? 'alert-success'
                  : rows.length > 0
                    ? invalidRows.length > 0
                      ? 'alert-warning'
                      : 'alert-success'
                    : 'alert-danger'
              }`}
            >
              {message}
            </div>
          )}

        </div>
      </div>

      {/* 檢查結果 */}
      {rows.length > 0 && (
        <>
          <div className="row g-3 mb-4">

            {/* 資料總筆數 */}
            <div className="col-12 col-md-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="text-secondary small">
                    資料總筆數
                  </div>

                  <div className="fs-3 fw-bold">
                    {rows.length}
                  </div>
                </div>
              </div>
            </div>

            {/* 檢查結果 */}
            <div className="col-12 col-md-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="text-secondary small">
                    檢查是否通過
                  </div>

                  <div
                    className={`fs-3 fw-bold ${
                      invalidRows.length === 0
                        ? 'text-success'
                        : 'text-danger'
                    }`}
                  >
                    {invalidRows.length === 0
                      ? '通過'
                      : '未通過'}
                  </div>
                </div>
              </div>
            </div>

            {/* 異常筆數 */}
            <div className="col-12 col-md-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="text-secondary small">
                    異常筆數
                  </div>

                  <div className="fs-3 fw-bold text-danger">
                    {invalidRows.length}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* 異常原因：只有發生異常時才顯示 */}
          {errors.length > 0 && (
            <div className="alert alert-warning mb-4">
              <div className="fw-semibold mb-2">
                <i className="bi bi-exclamation-triangle me-2" />
                異常資料原因
              </div>

              <ul className="mb-0 small">
                {errors.slice(0, 50).map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>

              {errors.length > 50 && (
                <div className="small mt-2">
                  另有 {errors.length - 50} 筆異常未顯示。
                </div>
              )}
            </div>
          )}

          {/* 確認匯入 */}
          <div className="d-flex justify-content-end">
            <button
              type="button"
              className="btn btn-primary px-4 py-2"
              onClick={handleConfirm}
              disabled={
                invalidRows.length > 0 ||
                validRows.length === 0 ||
                confirmed
              }
            >
              <i className="bi bi-check-circle me-2" />
              {confirmed ? '已確認匯入' : '確認匯入資料'}
            </button>
          </div>

        </>
      )}

    </div>
  )
}

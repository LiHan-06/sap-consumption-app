
import { useState } from 'react'
import * as XLSX from 'xlsx'

const REQUIRED_COLUMNS = [
  '過帳日期',
  '異動類型',
  '物料',
  '以輸入單位表示的數量',
]

const MAX_PREVIEW_ROWS = 20

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
    const match = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)

    if (match) {
      const [, year, month, day] = match
      const date = new Date(Number(year), Number(month) - 1, Number(day))

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
    quantityText === '' || quantityText === null || quantityText === undefined
      ? NaN
      : Number(quantityText)

  if (!date) errors.push(`第 ${rowNumber} 列：過帳日期格式錯誤`)
  if (!material) errors.push(`第 ${rowNumber} 列：物料不可空白`)
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

export default function MB51Upload() {
  const [fileName, setFileName] = useState('')
  const [rows, setRows] = useState([])
  const [errors, setErrors] = useState([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const validRows = rows.filter((row) => row.valid)
  const invalidRows = rows.filter((row) => !row.valid)

  async function handleFileChange(event) {
    const file = event.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setRows([])
    setErrors([])
    setMessage('')
    setConfirmed(false)
    setLoading(true)

    try {
      const extension = file.name.split('.').pop().toLowerCase()

      if (!['xlsx', 'xls'].includes(extension)) {
        throw new Error('請上傳 .xlsx 或 .xls 格式的 Excel 檔案。')
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

      const headers = data[0].map((value) => String(value).trim())

      const missingColumns = REQUIRED_COLUMNS.filter(
        (column) => !headers.includes(column)
      )

      if (missingColumns.length > 0) {
        throw new Error(
          `缺少必要欄位：${missingColumns.join('、')}。請確認欄位名稱與 SAP 匯出格式一致。`
        )
      }

      const duplicateColumns = REQUIRED_COLUMNS.filter(
        (column) => headers.filter((header) => header === column).length > 1
      )

      if (duplicateColumns.length > 0) {
        throw new Error(
          `欄位名稱重複：${duplicateColumns.join('、')}。請先整理 Excel 欄位。`
        )
      }

      const columnIndexes = REQUIRED_COLUMNS.map((column) =>
        headers.indexOf(column)
      )

      const records = data.slice(1)
        .filter((row) =>
          columnIndexes.some((columnIndex) => {
            const value = row[columnIndex]
            return value !== '' && value !== null && value !== undefined
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
        throw new Error('找不到任何有效資料列。')
      }

      const results = records.map((record, index) =>
        validateRow(record, index)
      )

      setRows(results)
      setErrors(results.flatMap((result) => result.errors))

      if (results.every((result) => result.valid)) {
        setMessage('欄位及資料格式檢查完成，可以確認匯入。')
      } else {
        setMessage('資料檢查完成，但有部分資料需要修正。')
      }
    } catch (error) {
      setMessage(error.message || 'Excel 讀取失敗，請確認檔案格式。')
    } finally {
      setLoading(false)
    }
  }

  function handleConfirm() {
    if (invalidRows.length > 0 || validRows.length === 0) return

    // 目前僅保留在此頁面的記憶體中，尚未寫入資料庫
    setConfirmed(true)
    setMessage(`已完成 ${validRows.length} 筆資料的本頁匯入確認。`)
  }

  function handleReset() {
    setFileName('')
    setRows([])
    setErrors([])
    setMessage('')
    setConfirmed(false)

    const input = document.getElementById('mb51-file-input')
    if (input) input.value = ''
  }

  return (
    <div className="container-fluid py-4">
      {/* 頁面標題 */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">MB51 資料上傳</h4>
          <div className="text-secondary small">
            匯入 SAP 物料異動資料，作為後續物料耗用分析來源
          </div>
        </div>
        <span className="badge bg-primary-subtle text-primary px-3 py-2">
          資料匯入
        </span>
      </div>

      {/* 匯入流程 */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <h6 className="fw-bold mb-3">
            <i className="bi bi-info-circle me-2 text-primary" />
            SAP MB51 匯出資料準備
          </h6>

          <div className="row g-3">
            {[
              ['01', 'SAP 執行 MB51', '依需求設定查詢條件並匯出 Excel'],
              ['02', '整理 Excel 欄位', '只保留下方指定的四個必要欄位'],
              ['03', '上傳 Excel', '選擇整理完成的 Excel 檔案'],
              ['04', '檢查及預覽', '系統檢查欄位與資料格式'],
            ].map(([number, title, description]) => (
              <div className="col-12 col-md-6 col-xl-3" key={number}>
                <div className="d-flex gap-3">
                  <div
                    className="rounded-circle bg-primary-subtle text-primary fw-bold d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: 38, height: 38 }}
                  >
                    {number}
                  </div>
                  <div>
                    <div className="fw-semibold">{title}</div>
                    <div className="text-secondary small">{description}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <hr className="my-4" />

          <div className="fw-semibold mb-2">Excel 必要欄位（欄位名稱不可修改）</div>
          <div className="d-flex flex-wrap gap-2">
            {REQUIRED_COLUMNS.map((column) => (
              <span
                key={column}
                className="badge bg-light text-dark border px-3 py-2"
              >
                {column}
              </span>
            ))}
          </div>

          <div className="alert alert-warning mt-3 mb-0 small">
            <i className="bi bi-exclamation-triangle me-2" />
            物料編號請以文字格式保留，避免前導 0 遺失。數量會保留 SAP
            原始正負號，後續分析再處理 261／262 的耗用與沖銷。
          </div>
        </div>
      </div>

      {/* 上傳區 */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <h6 className="fw-bold mb-3">上傳 MB51 Excel 檔案</h6>

          <label
            htmlFor="mb51-file-input"
            className="border border-2 border-dashed rounded-3 p-5 text-center d-block"
            style={{ cursor: 'pointer', background: '#f8f9fa' }}
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

          <div className="d-flex flex-wrap gap-2 mt-3">
            <button
              className="btn btn-outline-secondary"
              onClick={handleReset}
              disabled={loading}
            >
              <i className="bi bi-arrow-counterclockwise me-2" />
              清除資料
            </button>
          </div>

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
                  : errors.length > 0
                    ? 'alert-warning'
                    : rows.length > 0
                      ? 'alert-info'
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
            <div className="col-12 col-md-4">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <div className="text-secondary small">資料總筆數</div>
                  <div className="fs-3 fw-bold">{rows.length}</div>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <div className="text-secondary small">檢查通過</div>
                  <div className="fs-3 fw-bold text-success">
                    {validRows.length}
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <div className="text-secondary small">異常筆數</div>
                  <div className="fs-3 fw-bold text-danger">
                    {invalidRows.length}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 異常訊息 */}
          {errors.length > 0 && (
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body p-4">
                <h6 className="fw-bold text-danger mb-3">
                  <i className="bi bi-exclamation-circle me-2" />
                  資料異常明細
                </h6>
                <ul className="mb-0 small text-danger">
                  {errors.slice(0, 50).map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
                {errors.length > 50 && (
                  <div className="small text-secondary mt-2">
                    另有 {errors.length - 50} 筆異常未顯示。
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 資料預覽 */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold mb-0">資料預覽</h6>
                <span className="text-secondary small">
                  顯示前 {Math.min(rows.length, MAX_PREVIEW_ROWS)} 筆
                </span>
              </div>

              <div className="table-responsive">
                <table className="table table-hover table-bordered align-middle small">
                  <thead className="table-light">
                    <tr>
                      <th>檢查結果</th>
                      {REQUIRED_COLUMNS.map((column) => (
                        <th key={column}>{column}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, MAX_PREVIEW_ROWS).map((row, index) => (
                      <tr key={index}>
                        <td>
                          {row.valid ? (
                            <span className="badge bg-success">通過</span>
                          ) : (
                            <span className="badge bg-danger">異常</span>
                          )}
                        </td>
                        {REQUIRED_COLUMNS.map((column) => (
                          <td key={column}>
                            {row.data[column] ?? '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {rows.length > MAX_PREVIEW_ROWS && (
                <div className="text-secondary small">
                  尚有 {rows.length - MAX_PREVIEW_ROWS} 筆資料未顯示於預覽。
                </div>
              )}

              <div className="d-flex justify-content-end mt-3">
                <button
                  className="btn btn-primary px-4"
                  onClick={handleConfirm}
                  disabled={
                    invalidRows.length > 0 ||
                    validRows.length === 0 ||
                    confirmed
                  }
                >
                  <i className="bi bi-check-circle me-2" />
                  {confirmed ? '已確認' : '確認匯入資料'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

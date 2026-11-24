
import { useMemo, useState } from 'react'

const numberFormat = new Intl.NumberFormat('zh-TW', {
  maximumFractionDigits: 3,
})

// 數字格式
function formatNumber(value) {
  return numberFormat.format(value)
}

// 日期統一轉換為 YYYY-MM-DD
function normalizeDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getFullYear()
    const month = String(value.getMonth() + 1).padStart(2, '0')
    const day = String(value.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  }

  const text = String(value ?? '').trim()
  const match = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/)

  if (!match) return ''

  const [, year, month, day] = match

  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

// 產生日期區間內的月份
function generateMonths(startDate, endDate, availableDates) {
  const dates = availableDates
    .filter(Boolean)
    .sort()

  if (!dates.length) return []

  const start = startDate || dates[0]
  const end = endDate || dates[dates.length - 1]

  if (start > end) return []

  const startMonth = start.slice(0, 7)
  const endMonth = end.slice(0, 7)

  const months = []
  let current = startMonth

  while (current <= endMonth) {
    months.push(current)

    const [year, month] = current.split('-').map(Number)
    const next = new Date(year, month, 1)

    current = [
      next.getFullYear(),
      String(next.getMonth() + 1).padStart(2, '0'),
    ].join('-')
  }

  return months
}

function getMaxConsecutiveMonthIssue(monthlyData, periodLength) {
  const availableMonths = monthlyData.filter((item) => item.count > 0).length
  const effectivePeriodLength = Math.min(periodLength, availableMonths)

  if (effectivePeriodLength === 0 || monthlyData.length < effectivePeriodLength) {
    return null
  }

  let maxTotal = -Infinity
  let maxPeriod = null

  for (let index = 0; index <= monthlyData.length - effectivePeriodLength; index += 1) {
    const period = monthlyData.slice(index, index + effectivePeriodLength)
    const total = period.reduce((sum, item) => sum + item.issue, 0)

    if (total > maxTotal) {
      maxTotal = total
      maxPeriod = {
        label: `${period[0].month} ～ ${period[period.length - 1].month}`,
        months: period.map((item) => item.month),
        monthCount: effectivePeriodLength,
      }
    }
  }

  return {
    total: maxTotal,
    average: maxTotal / periodLength,
    averageDivisor: periodLength,
    isInsufficient: availableMonths < periodLength,
    availableMonths,
    ...maxPeriod,
  }
}

// 月耗用趨勢圖
function ConsumptionChart({ data }) {
  const width = Math.max(720, data.length * 90)
  const height = 240

  const paddingLeft = 55
  const paddingRight = 25
  const paddingTop = 25
  const paddingBottom = 45

  const chartWidth = width - paddingLeft - paddingRight
  const chartHeight = height - paddingTop - paddingBottom

  const values = data.map((item) => item.net)

  const minValue = Math.min(0, ...values)
  const maxValue = Math.max(0, ...values)

  const range = maxValue - minValue || 1
  const extra = range * 0.15

  const yMin = minValue - extra
  const yMax = maxValue + extra

  const getX = (index) => {
    if (data.length <= 1) {
      return paddingLeft + chartWidth / 2
    }

    return paddingLeft + (index / (data.length - 1)) * chartWidth
  }

  const getY = (value) => {
    return paddingTop +
      ((yMax - value) / (yMax - yMin)) * chartHeight
  }

  const points = data
    .map((item, index) => `${getX(index)},${getY(item.net)}`)
    .join(' ')

  const zeroY = getY(0)

  return (
    <div className="border rounded p-2">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 px-2 pt-2">
        <strong className="small">每月淨耗用趨勢</strong>

        <span className="small text-secondary">
          正數＝淨耗用；負數＝淨退料
        </span>
      </div>

      <div className="table-responsive">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{
            width: '100%',
            minWidth: `${width}px`,
            display: 'block',
          }}
          role="img"
          aria-label="每月淨耗用趨勢圖"
        >
          <line
            x1={paddingLeft}
            y1={zeroY}
            x2={width - paddingRight}
            y2={zeroY}
            stroke="#adb5bd"
            strokeDasharray="5 4"
            strokeWidth="1.5"
          />

          {data.length > 1 && (
            <polyline
              points={points}
              fill="none"
              stroke="#2878bd"
              strokeWidth="3"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}

          {data.map((item, index) => (
            <g key={item.month}>
              <circle
                cx={getX(index)}
                cy={getY(item.net)}
                r="5"
                fill="#2878bd"
                stroke="#ffffff"
                strokeWidth="2"
              />

              <text
                x={getX(index)}
                y={getY(item.net) - 12}
                textAnchor="middle"
                fontSize="12"
                fill="currentColor"
              >
                {formatNumber(item.net)}
              </text>

              <text
                x={getX(index)}
                y={height - 15}
                textAnchor="middle"
                fontSize="12"
                fill="currentColor"
              >
                {item.month}
              </text>
            </g>
          ))}

          <text
            x="8"
            y={zeroY - 5}
            fontSize="11"
            fill="#6c757d"
          >
            0
          </text>
        </svg>
      </div>
    </div>
  )
}

// 單一物料分析內容
function MaterialResult({ item, months }) {
  return (
    <>
      <div className="row g-3 mb-4">

        <div className="col-12 col-md-6 col-xl-3">
          <div className="bg-light rounded p-3 h-100">
            <div className="small text-secondary mb-1">
              區間 | 耗用量
            </div>
            <div className="fs-4 fw-bold">
              {formatNumber(item.totalIssue)}
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-xl-3">
          <div className="bg-light rounded p-3 h-100">
            <div className="small text-secondary mb-1">
              區間 | 退料量
            </div>
            <div className="fs-4 fw-bold">
              {formatNumber(item.totalReturned)}
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-xl-3">
          <div className="bg-light rounded p-3 h-100">
            <div className="small text-secondary mb-1">
              區間 | 淨耗用量
            </div>
            <div className="fs-4 fw-bold">
              {formatNumber(item.totalNet)}
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-xl-3">
          <div className="bg-primary-subtle rounded p-3 h-100">
            <div className="small text-primary mb-1">
              平均 | 月淨耗用量
            </div>
            <div className="fs-4 fw-bold text-primary">
              {formatNumber(item.averageMonthly)}
            </div>

            <div className="small text-secondary mt-1">
              {formatNumber(item.totalNet)} ÷ {months.length} 個月
            </div>
          </div>
        </div>

      </div>

      {/* 趨勢圖 */}
      <div className="mb-4">
        <ConsumptionChart data={item.monthlyData} />
      </div>

      {/* 每月明細 */}
      <h6 className="fw-bold mb-2">
        每月耗用明細
      </h6>

      <div className="table-responsive">
        <table className="table table-bordered table-hover align-middle mb-0 text-center">
          <thead className="table-light">
            <tr>
              <th>過帳年月</th>
              <th>耗用量</th>
              <th>退料量</th>
              <th>淨耗用量</th>
            </tr>
          </thead>

            <tbody>
                {item.monthlyData
                  .filter((monthItem) => monthItem.count > 0)
                  .map((monthItem) => (
                    <tr key={monthItem.month}>
                      <td className="fw-semibold" style={{ backgroundColor: '#eaf3ff', color: '#212529' }}>
                        {monthItem.month}
                      </td>

                      <td>
                        {formatNumber(monthItem.issue)}
                      </td>

                      <td>
                        {formatNumber(monthItem.returned)}
                      </td>

                      <td className="fw-semibold"  style={{ backgroundColor: '#eaf5ec', color: '#212529' }}>
                        {formatNumber(monthItem.net)}
                      </td>

                    </tr>
                  ))}
              </tbody>
        </table>
      </div>
    </>
  )
}

export default function MaterialAnalysis({ rows, onGoUpload }) {
  // 查詢欄位
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [materialKeyword, setMaterialKeyword] = useState('')
  const [activeView, setActiveView] = useState('consumption')
  const [safetyStockMonths, setSafetyStockMonths] = useState(3)
  const [safetyStockCalculation, setSafetyStockCalculation] = useState('sum')
  const [isSafetyStockStrategyOpen, setIsSafetyStockStrategyOpen] = useState(false)

  // 已送出的查詢條件
  const [appliedFilters, setAppliedFilters] = useState(null)

  const invalidDateRange =
    startDate && endDate && startDate > endDate

  // 整理 MB51 原始資料
  const normalizedRows = useMemo(() => {
    return rows.map((row) => ({
      ...row,
      dateKey: normalizeDate(row.過帳日期),
      material: String(row.物料 ?? '').trim(),
      movement: String(row.異動類型 ?? '').trim(),
      quantity: Math.abs(
        Number(row.以輸入單位表示的數量) || 0
      ),
    }))
  }, [rows])

  // 從匯入資料取得不重複的物料編號
const materialOptions = useMemo(() => {
  return [...new Set(
    normalizedRows
      .map((row) => row.material)
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, 'zh-TW'))
}, [normalizedRows])

  // 尚未匯入資料
 
if (!rows.length) {
  return (
    <div className="content-card">
      <div
        className="section-heading"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ textAlign: 'left' }}>
          <h5 className="text-start">物料耗用分析</h5>
          <p className="text-start">
            請先匯入並確認 MB51 Excel 資料。
          </p>
        </div>

        <span className="status-badge status-pending">
          尚無資料
        </span>
      </div>

      <div className="empty-state">
        <i className="bi bi-bar-chart-line" />

        <h6>目前沒有可分析的資料</h6>

        <button
          type="button"
          className="btn btn-primary"
          onClick={onGoUpload}
        >
          <i className="bi bi-upload me-2" />
          前往 MB51 資料上傳
        </button>
      </div>
    </div>
  )
}


  // 產生月份區間
  const months = useMemo(() => {
    if (!appliedFilters) return []

    return generateMonths(
      appliedFilters.startDate,
      appliedFilters.endDate,
      normalizedRows.map((row) => row.dateKey)
    )
  }, [appliedFilters, normalizedRows])

  // 篩選資料：只有送出查詢後才開始分析
  const filteredRows = useMemo(() => {
    if (!appliedFilters) return []

    const {
      startDate: queryStart,
      endDate: queryEnd,
      materialKeyword: queryMaterial,
    } = appliedFilters

    return normalizedRows.filter((row) => {
      const matchesDate =
        row.dateKey &&
        (!queryStart || row.dateKey >= queryStart) &&
        (!queryEnd || row.dateKey <= queryEnd)

      const matchesMaterial =
        !queryMaterial ||
        row.material
          .toLowerCase()
          .includes(queryMaterial.trim().toLowerCase())

      const matchesMovement =
        ['261', '262','543','544','685', '686'].includes(row.movement)

      return (
        matchesDate &&
        matchesMaterial &&
        matchesMovement
      )
    })
  }, [normalizedRows, appliedFilters])

  // 依物料及月份分別計算
  const monthlySummary = useMemo(() => {
    if (!appliedFilters) return []

    const grouped = new Map()

    filteredRows.forEach((row) => {
      const material = row.material
      const month = row.dateKey.slice(0, 7)

      if (!grouped.has(material)) {
        grouped.set(material, new Map())
      }

      const materialMonths = grouped.get(material)

      if (!materialMonths.has(month)) {
        materialMonths.set(month, {
          issue: 0,
          returned: 0,
          net: 0,
          count: 0,
        })
      }

      const item = materialMonths.get(month)

      if (['261', '543', '685'].includes(row.movement)) {
        item.issue += row.quantity
      }

      if (['262', '544','686'].includes(row.movement)) {
        item.returned += row.quantity
      }

      item.net = item.issue - item.returned
      item.count += 1
    })

    return [...grouped.entries()]
      .sort(([a], [b]) => a.localeCompare(b, 'zh-TW'))
      .map(([material, materialMonths]) => {
        const monthlyData = months.map((month) => {
          const item = materialMonths.get(month) || {
            issue: 0,
            returned: 0,
            net: 0,
            count: 0,
          }

          return {
            month,
            ...item,
          }
        })

        const totalIssue = monthlyData.reduce(
          (sum, item) => sum + item.issue,
          0
        )

        const totalReturned = monthlyData.reduce(
          (sum, item) => sum + item.returned,
          0
        )

        const totalNet = monthlyData.reduce(
          (sum, item) => sum + item.net,
          0
        )

        const averageMonthly = months.length > 0
          ? totalNet / months.length
          : 0

        return {
          material,
          monthlyData,
          totalIssue,
          totalReturned,
          totalNet,
          averageMonthly,
          maxConsecutiveMonthIssue: getMaxConsecutiveMonthIssue(
            monthlyData,
            safetyStockMonths
          ),
        }
      })
  }, [filteredRows, months, appliedFilters, safetyStockMonths])

  // 送出查詢
  const handleSearch = () => {
    if (invalidDateRange) return

    setAppliedFilters({
      startDate,
      endDate,
      materialKeyword: materialKeyword.trim(),
    })
  }

  // 清除條件
  const handleClear = () => {
    setStartDate('')
    setEndDate('')
    setMaterialKeyword('')
    setAppliedFilters(null)
  }

  // 回到最上方
  const handleBackToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  return (
    <div className="container-fluid py-4">
      {activeView === 'safetyStock' && (
        <div
          className="position-fixed"
          style={{
            top: '50%',
            right: '1rem',
            transform: 'translateY(-50%)',
            zIndex: 1050,
          }}
        >
          {isSafetyStockStrategyOpen && (
            <div
              id="safety-stock-strategy-menu"
              className="position-absolute bg-white border rounded shadow p-3"
              style={{
                top: '50%',
                right: 'calc(100% + 0.75rem)',
                transform: 'translateY(-50%)',
                width: 'min(320px, calc(100vw - 88px))',
                maxHeight: 'calc(100vh - 2rem)',
                overflowY: 'auto',
              }}
            >
              <div className="mb-3">
                <label htmlFor="safety-stock-months-floating" className="form-label small fw-semibold">
                  連續月份
                </label>
                <select
                  id="safety-stock-months-floating"
                  className="form-select"
                  value={safetyStockMonths}
                  onChange={(e) => setSafetyStockMonths(Number(e.target.value))}
                >
                  {[2, 3, 4, 5].map((monthCount) => (
                    <option key={monthCount} value={monthCount}>
                      {monthCount} 個月
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label htmlFor="safety-stock-calculation-floating" className="form-label small fw-semibold">
                  計算方式
                </label>
                <select
                  id="safety-stock-calculation-floating"
                  className="form-select"
                  value={safetyStockCalculation}
                  onChange={(e) => setSafetyStockCalculation(e.target.value)}
                >
                  <option value="sum">加總</option>
                  <option value="average">平均</option>
                </select>
              </div>

            </div>
          )}

          <button
            type="button"
            className="btn btn-primary shadow d-flex flex-column align-items-center"
            aria-expanded={isSafetyStockStrategyOpen}
            aria-controls={isSafetyStockStrategyOpen ? 'safety-stock-strategy-menu' : undefined}
            onClick={() => setIsSafetyStockStrategyOpen((isOpen) => !isOpen)}
          >
            <i className="bi bi-sliders mb-2" />
            <span style={{ writingMode: 'vertical-rl', textOrientation: 'upright' }}>
              策略調整
            </span>
          </button>
        </div>
      )}

      {/* 頁面標題 */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div className="btn-group" role="group" aria-label="分析模式">
          <button
            type="button"
            className={`btn ${activeView === 'consumption' ? 'btn-primary' : 'btn-outline-primary'}`}
            aria-pressed={activeView === 'consumption'}
            onClick={() => {
              setActiveView('consumption')
              setIsSafetyStockStrategyOpen(false)
            }}
          >
            物料耗用分析
          </button>
          <button
            type="button"
            className={`btn ${activeView === 'safetyStock' ? 'btn-primary' : 'btn-outline-primary'}`}
            aria-pressed={activeView === 'safetyStock'}
            onClick={() => {
              setActiveView('safetyStock')
              setIsSafetyStockStrategyOpen(false)
            }}
          >
            安庫分析
          </button>
        </div>

        <span className="badge bg-success-subtle text-success px-3 py-2">
          已載入 {rows.length} 筆資料
        </span>
      </div>

      {/* 查詢條件 */}
      <div className="row g-3 mb-4 align-items-stretch">
        <div className={activeView === 'safetyStock' ? 'col-12 col-xl-7' : 'col-12'}>
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <h6 className="fw-bold mb-3">
                <i className="bi bi-funnel me-2 text-primary" />
                選擇篩選條件
              </h6>

              <div className="row g-3">

            <div className="col-12 col-md-4">
              <label className="form-label small fw-semibold">
                起始過帳日期
              </label>

              <input
                type="date"
                className="form-control"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label small fw-semibold">
                結束過帳日期
              </label>

              <input
                type="date"
                className="form-control"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            
            <div className="col-12 col-md-4">
              <label className="form-label small fw-semibold">
                物料編號
              </label>

              <select
                className="form-select"
                value={materialKeyword}
                onChange={(e) => setMaterialKeyword(e.target.value)}
              >
                <option value="">全部物料</option>

                {materialOptions.map((material) => (
                  <option key={material} value={material}>
                    {material}
                  </option>
                ))}
              </select>
            </div>


          </div>

          {/* 日期錯誤提醒 */}
          {invalidDateRange && (
            <div className="alert alert-warning mt-3 mb-0">
              起始日期不可晚於結束日期。
            </div>
          )}

          {activeView === 'consumption' && (
            <div className="d-flex justify-content-center gap-3 mt-4">
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSearch}
                disabled={Boolean(invalidDateRange)}
              >
                <i className="bi bi-search me-2" />
                送出查詢
              </button>

              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={handleClear}
              >
                <i className="bi bi-arrow-counterclockwise me-1" />
                清除條件
              </button>
            </div>
          )}

            </div>
          </div>
        </div>

        {activeView === 'safetyStock' && (
          <div className="col-12 col-xl-5">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body p-4">
                <h6 className="fw-bold mb-3">
                  <i className="bi bi-sliders me-2 text-primary" />
                  安庫策略選擇
                </h6>

                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label htmlFor="safety-stock-months" className="form-label small fw-semibold">
                      連續月份
                    </label>
                    <select
                      id="safety-stock-months"
                      className="form-select"
                      value={safetyStockMonths}
                      onChange={(e) => setSafetyStockMonths(Number(e.target.value))}
                    >
                      {[2, 3, 4, 5].map((monthCount) => (
                        <option key={monthCount} value={monthCount}>
                          {monthCount} 個月
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-12 col-md-6">
                    <label htmlFor="safety-stock-calculation" className="form-label small fw-semibold">
                      計算方式
                    </label>
                    <select
                      id="safety-stock-calculation"
                      className="form-select"
                      value={safetyStockCalculation}
                      onChange={(e) => setSafetyStockCalculation(e.target.value)}
                    >
                      <option value="sum">加總</option>
                      <option value="average">平均</option>
                    </select>
                  </div>
                </div>

                <div className="d-flex justify-content-center gap-3 mt-4">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSearch}
                    disabled={Boolean(invalidDateRange)}
                  >
                    <i className="bi bi-search me-2" />
                    送出查詢
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={handleClear}
                  >
                    <i className="bi bi-arrow-counterclockwise me-1" />
                    清除條件
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* 分析結果：送出查詢後才顯示 */}
      {appliedFilters && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body p-4">

            <div
              className="d-flex justify-content-start align-items-center flex-wrap gap-2 mb-3"
            >
              <div className="text-start">
                <h6 className="fw-bold mb-1">
                  {activeView === 'safetyStock' ? '安庫分析結果' : '物料耗用分析結果'}
                </h6>

                <div className="text-secondary small">
                  異動資料：{filteredRows.length} 筆
                  ／ 物料：{monthlySummary.length} 種
                  ／ 統計期間：{months.length > 0
                    ? `${months[0]} ～ ${months[months.length - 1]}`
                    : '無資料'} 共 {months.length} 個月
                </div>

              </div>
            </div>

            {monthlySummary.length > 0 ? (

              activeView === 'safetyStock' ? (

                /* 安庫分析：顯示各物料最高連續月份耗用量 */
                <div className="d-flex flex-column gap-3">
                  {monthlySummary.map((item, index) => (
                    <details
                      key={item.material}
                      className="border rounded"
                      open={index === 0}
                    >
                      <summary
                        className="p-3 fw-bold bg-light"
                        style={{ cursor: 'pointer' }}
                      >
                        <i className="bi bi-box-seam text-primary me-2" />
                        物料編號：{item.material}
                        <span className="badge bg-primary-subtle text-primary ms-2">
                          安庫建議：
                          {item.maxConsecutiveMonthIssue
                            ? `${formatNumber(safetyStockCalculation === 'sum'
                              ? item.maxConsecutiveMonthIssue.total
                              : item.maxConsecutiveMonthIssue.average)}（${item.maxConsecutiveMonthIssue.label}）`
                            : '無可用資料'}
                        </span>
                        {item.maxConsecutiveMonthIssue?.isInsufficient && (
                          <span className="badge bg-warning-subtle text-warning-emphasis ms-2">
                            資料不足：僅有 {item.maxConsecutiveMonthIssue.availableMonths} 個月資料
                          </span>
                        )}
                      </summary>

                      <div className="p-3">
                        {item.maxConsecutiveMonthIssue ? (
                          <>
                            <p className="small text-secondary mb-2">
                              建議數值依 {item.maxConsecutiveMonthIssue.label} 的連續 {item.maxConsecutiveMonthIssue.monthCount} 個月耗用量
                              {safetyStockCalculation === 'sum'
                                ? '加總'
                                : `平均（加總 ${formatNumber(item.maxConsecutiveMonthIssue.total)} ÷ ${item.maxConsecutiveMonthIssue.averageDivisor} 個月）`}。
                              {item.maxConsecutiveMonthIssue.isInsufficient && (
                                <span className="d-block text-warning-emphasis">
                                  資料不足，平均仍依所選的 {item.maxConsecutiveMonthIssue.averageDivisor} 個月計算；目前有 {item.maxConsecutiveMonthIssue.availableMonths} 個月資料。
                                </span>
                              )}
                            </p>
                            <div className="table-responsive">
                              <table className="table table-bordered align-middle mb-0 text-center">
                                <thead className="table-light">
                                  <tr>
                                    <th>過帳年月</th>
                                    <th>耗用量</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {item.monthlyData
                                    .filter((monthItem) => item.maxConsecutiveMonthIssue.months.includes(monthItem.month))
                                    .map((monthItem) => (
                                      <tr key={monthItem.month}>
                                        <td>{monthItem.month}</td>
                                        <td>{formatNumber(monthItem.issue)}</td>
                                      </tr>
                                    ))}
                                </tbody>
                              </table>
                            </div>
                          </>
                        ) : (
                          <p className="text-secondary mb-0">
                            查詢期間不足 {safetyStockMonths} 個月，無法計算安庫建議。
                          </p>
                        )}
                      </div>
                    </details>
                  ))}
                </div>

              ) : monthlySummary.length > 1 ? (

                /* 多筆物料：摺疊卡片 */
                <div className="d-flex flex-column gap-3">
                  {monthlySummary.map((item, index) => (
                    <details
                      key={item.material}
                      className="border rounded"
                      open={index === 0}
                    >
                      <summary className="p-3 fw-bold bg-light"
                        style={{ cursor: 'pointer' }}
                      >
                        <i className="bi bi-box-seam text-primary me-2" />
                        物料編號：{item.material}

                        <span className="text-secondary small fw-normal ms-2">
                          平均月淨耗用量：{formatNumber(item.averageMonthly)}
                        </span>
                      </summary>

                      <div className="p-3">
                        <MaterialResult
                          item={item}
                          months={months}
                        />
                      </div>
                    </details>
                  ))}
                </div>

              ) : (

                /* 單筆物料：直接顯示 */
                <div className="border rounded p-3">
                  <div className="d-flex align-items-center flex-wrap gap-2 mb-3">
                    <i className="bi bi-box-seam text-primary fs-5" />
                    <h6 className="fw-bold mb-0">
                      物料編號：{monthlySummary[0].material}
                    </h6>
                  </div>

                  <MaterialResult
                    item={monthlySummary[0]}
                    months={months}
                  />
                </div>

              )

            ) : (

              <div className="text-center text-secondary py-5">
                目前查詢條件沒有異動資料。
              </div>

            )}

          </div>
        </div>
      )}

      {/* 尚未查詢時的提示 */}
      {!appliedFilters && (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <i className="bi bi-search fs-1 text-secondary" />

            <h6 className="fw-bold mt-3">
              請設定查詢條件
            </h6>

            <p className="text-secondary small mb-0">
              選擇過帳日期區間或輸入物料編號，再按下「送出查詢」即可查看分析結果。
            </p>
          </div>
        </div>
      )}

      {/* 回到最上方 */}
      <button
        type="button"
        className="btn btn-primary rounded-circle shadow d-flex align-items-center justify-content-center p-0"
        onClick={handleBackToTop}
        title="回到最上方"
        aria-label="回到最上方"
        style={{
          position: 'fixed',
          right: '24px',
          bottom: '24px',
          width: '48px',
          height: '48px',
          zIndex: 1000,
        }}
      >
        <span className="fw-bold">TOP</span>
      </button>

    </div>
  )
}

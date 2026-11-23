
import { useState } from 'react'
import './App.css'
import MB51Upload from './pages/MB51Upload.jsx'
import MaterialAnalysis from './pages/MaterialAnalysis.jsx'

// 保留所有功能選單，方便未來重新開放
const menuItems = [
  { id: 'dashboard', label: '首頁總覽', icon: 'bi-grid-1x2' },
  { id: 'upload', label: 'MB51 資料上傳', icon: 'bi-file-earmark-arrow-up' },
  { id: 'analysis', label: '物料耗用分析', icon: 'bi-bar-chart-line' },
  { id: 'data', label: '資料管理', icon: 'bi-database' },
  { id: 'chat', label: '內部聊天室', icon: 'bi-chat-dots' },
]

const adminItems = [
  { id: 'users', label: '使用者管理', icon: 'bi-people' },
  { id: 'settings', label: '系統設定', icon: 'bi-gear' },
]

// 目前暫時開放的功能
const visibleMenuItems = menuItems.filter((item) =>
  ['upload', 'analysis'].includes(item.id)
)

function App() {
  // 預設進入 MB51 資料上傳
  const [activeMenu, setActiveMenu] = useState('upload')

  // 已確認匯入的資料由 App 統一保存
  const [importedRows, setImportedRows] = useState([])

  const activeItem = [...menuItems, ...adminItems].find(
    (item) => item.id === activeMenu
  )

  const handleImport = (rows) => {
    // 每次確認匯入以新批次取代舊批次
    // 目前只保存在網頁記憶體，不寫入資料庫
    setImportedRows(rows)
    setActiveMenu('analysis')
  }

  const renderPage = () => {
    switch (activeMenu) {
      case 'upload':
        return <MB51Upload onImport={handleImport} />

      case 'analysis':
        return (
          <MaterialAnalysis
            rows={importedRows}
            onGoUpload={() => setActiveMenu('upload')}
          />
        )

      // 以下功能保留，暫時不開放導覽入口
      case 'data':
      case 'chat':
      case 'users':
      case 'settings':
        return (
          <div className="content-card">
            <div className="section-heading">
              <div>
                <h5>{activeItem.label}</h5>
                <p>系統功能將於後續階段建置。</p>
              </div>
              <span className="status-badge status-pending">
                建置中
              </span>
            </div>

            <div className="empty-state">
              <i className={`bi ${activeItem.icon}`} />
              <h6>{activeItem.label}功能建置中</h6>
              <p>
                目前先完成 MB51 資料匯入及物料耗用分析。
              </p>
            </div>
          </div>
        )

      // 首頁總覽程式保留
      default:
        return (
          <Dashboard
            onNavigate={setActiveMenu}
            importedRows={importedRows}
          />
        )
    }
  }

  return (
    <div className="app-shell">

      {/* 頂部系統導覽 */}
      <header className="app-header">

        {/* 第一層：品牌及測試狀態 */}
        <div className="header-main">
          <div className="brand-area">
            <div className="brand-icon">
              <i className="bi bi-boxes" />
            </div>

            <div>
              <div className="brand-title">
                耗用分析
              </div>
            </div>
          </div>

          <div className="user-area">
            <div className="user-info">
              <span className="user-name">測試中</span>
            </div>

            <div className="user-avatar">T</div>
          </div>
        </div>

        {/* 第二層：目前開放的功能選單 */}
        <div className="header-navigation">
          <nav className="main-nav">
            {visibleMenuItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`nav-item ${
                  activeMenu === item.id ? 'active' : ''
                }`}
                onClick={() => setActiveMenu(item.id)}
              >
                <i className={`bi ${item.icon}`} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* 主要內容 */}
      <main className="main-content">

        {/* 頁面內容 */}
        {renderPage()}

      </main>
    </div>
  )
}

function Dashboard({ onNavigate, importedRows }) {
  const materialCount = new Set(
    importedRows.map((row) => row.物料)
  ).size

  return (
    <>
      {/* 統計卡片 */}
      <div className="stats-grid">

        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon blue">
              <i className="bi bi-cloud-upload" />
            </div>
            <span className="stat-label">IMPORTED ROWS</span>
          </div>

          <div className="stat-value">
            {importedRows.length}
          </div>

          <div className="stat-description">
            目前已確認匯入筆數
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon teal">
              <i className="bi bi-box-seam" />
            </div>
            <span className="stat-label">MATERIALS</span>
          </div>

          <div className="stat-value">
            {materialCount}
          </div>

          <div className="stat-description">
            目前匯入物料數量
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon green">
              <i className="bi bi-activity" />
            </div>
            <span className="stat-label">SYSTEM STATUS</span>
          </div>

          <div className="stat-value status-normal">
            正常
          </div>

          <div className="stat-description">
            <span className="status-dot" />
            系統介面運作正常
          </div>
        </div>

      </div>

      {/* 主要工作區 */}
      <div className="dashboard-grid">

        {/* MB51 上傳 */}
        <section className="content-card upload-card">
          <div className="section-heading">
            <div>
              <h5>MB51 資料匯入</h5>
              <p>
                匯入 SAP 物料異動資料，作為後續耗用分析基礎。
              </p>
            </div>

            <span className="section-icon">
              <i className="bi bi-file-earmark-spreadsheet" />
            </span>
          </div>

          <div className="upload-area">
            <div className="upload-icon">
              <i className="bi bi-cloud-arrow-up" />
            </div>

            <h6>匯入 MB51 Excel 檔案</h6>
            <p>
              請進入 MB51 資料上傳頁面選擇 Excel 檔案。
            </p>

            <button
              type="button"
              className="btn btn-primary px-4"
              onClick={() => onNavigate('upload')}
            >
              <i className="bi bi-upload me-2" />
              前往資料上傳
            </button>
          </div>
        </section>

        {/* 快速功能 */}
        <section className="content-card quick-card">
          <div className="section-heading">
            <div>
              <h5>快速功能</h5>
              <p>常用系統功能入口</p>
            </div>
          </div>

          <div className="quick-list">
            <button
              type="button"
              onClick={() => onNavigate('upload')}
            >
              <span className="quick-icon blue">
                <i className="bi bi-file-earmark-arrow-up" />
              </span>

              <span className="quick-text">
                <strong>MB51 資料上傳</strong>
                <small>匯入 SAP Excel 資料</small>
              </span>

              <i className="bi bi-chevron-right quick-arrow" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('analysis')}
            >
              <span className="quick-icon teal">
                <i className="bi bi-bar-chart-line" />
              </span>

              <span className="quick-text">
                <strong>物料耗用分析</strong>
                <small>查看耗用統計及排名</small>
              </span>

              <i className="bi bi-chevron-right quick-arrow" />
            </button>
          </div>
        </section>
      </div>

      {/* 系統功能狀態 */}
      <section className="content-card function-card">
        <div className="section-heading">
          <div>
            <h5>系統功能總覽</h5>
            <p>目前系統功能開發進度</p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table function-table align-middle mb-0">
            <thead>
              <tr>
                <th>系統功能</th>
                <th>功能說明</th>
                <th>開發狀態</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>MB51 資料上傳</td>
                <td>Excel 匯入及資料檢查</td>
                <td>
                  <span className="status-badge status-pending">
                    已可測試
                  </span>
                </td>
              </tr>

              <tr>
                <td>物料耗用分析</td>
                <td>依日期、物料彙總 261／262</td>
                <td>
                  <span className="status-badge status-pending">
                    初版完成
                  </span>
                </td>
              </tr>

              <tr>
                <td>耗用趨勢圖</td>
                <td>單一物料每月耗用趨勢</td>
                <td>
                  <span className="status-badge status-pending">
                    後續建置
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}

export default App

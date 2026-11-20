
import { useState } from 'react'
import './App.css'

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

function App() {
  const [activeMenu, setActiveMenu] = useState('dashboard')

  const activeItem = [...menuItems, ...adminItems].find(
    (item) => item.id === activeMenu
  )

  const renderPage = () => {
    switch (activeMenu) {
      case 'upload':
        return (
          <div className="content-card">
            <div className="section-heading">
              <div>
                <h5>MB51 資料上傳</h5>
                <p>匯入 SAP MB51 Excel，建立物料耗用分析資料。</p>
              </div>
              <span className="status-badge status-pending">建置中</span>
            </div>

            <div className="upload-area">
              <div className="upload-icon">
                <i className="bi bi-cloud-arrow-up" />
              </div>
              <h6>MB51 Excel 匯入區</h6>
              <p>後續將提供 Excel 上傳、欄位檢查及資料匯入功能。</p>
              <button className="btn btn-primary px-4" disabled>
                <i className="bi bi-upload me-2" />
                上傳功能建置中
              </button>
            </div>
          </div>
        )

      case 'analysis':
        return (
          <div className="content-card">
            <div className="section-heading">
              <div>
                <h5>物料耗用分析</h5>
                <p>集中查看物料耗用總表、月統計及物料排名。</p>
              </div>
              <span className="status-badge status-pending">建置中</span>
            </div>
            <div className="empty-state">
              <i className="bi bi-bar-chart-line" />
              <h6>耗用分析功能建置中</h6>
              <p>完成 MB51 資料匯入後，即可進行物料耗用分析。</p>
            </div>
          </div>
        )

      case 'data':
        return (
          <div className="content-card">
            <div className="section-heading">
              <div>
                <h5>資料管理</h5>
                <p>管理已匯入的 SAP 物料異動資料及分析批次。</p>
              </div>
              <span className="status-badge status-pending">建置中</span>
            </div>
            <div className="empty-state">
              <i className="bi bi-database" />
              <h6>資料管理功能建置中</h6>
              <p>後續提供資料查詢、批次管理及資料維護功能。</p>
            </div>
          </div>
        )

      case 'chat':
        return (
          <div className="content-card">
            <div className="section-heading">
              <div>
                <h5>內部聊天室</h5>
                <p>供內部人員交流分析結果及分享報表。</p>
              </div>
              <span className="status-badge status-pending">建置中</span>
            </div>
            <div className="empty-state">
              <i className="bi bi-chat-dots" />
              <h6>聊天室功能建置中</h6>
              <p>後續規劃訊息、@TAG 及報表連結分享功能。</p>
            </div>
          </div>
        )

      case 'users':
      case 'settings':
        return (
          <div className="content-card">
            <div className="section-heading">
              <div>
                <h5>{activeItem.label}</h5>
                <p>系統管理功能。</p>
              </div>
              <span className="status-badge status-pending">建置中</span>
            </div>
            <div className="empty-state">
              <i className={`bi ${activeItem.icon}`} />
              <h6>{activeItem.label}功能建置中</h6>
              <p>此功能將於後續階段開發。</p>
            </div>
          </div>
        )

      default:
        return <Dashboard onNavigate={setActiveMenu} />
    }
  }

  return (
    <div className="app-shell">

      {/* 頂部系統導覽 */}
      <header className="app-header">

        {/* 第一層：品牌及使用者 */}
        <div className="header-main">
          <div className="brand-area">
            <div className="brand-icon">
              <i className="bi bi-boxes" />
            </div>
            <div>
              <div className="brand-title">SAP 耗用分析系統</div>
              <div className="brand-subtitle">MATERIAL CONSUMPTION ANALYSIS</div>
            </div>
          </div>

          <div className="user-area">
            <div className="user-info">
              <span className="user-name">OWNER</span>
              <span className="user-role">系統管理者</span>
            </div>
            <div className="user-avatar">O</div>
          </div>
        </div>

        {/* 第二層：功能選單 */}
        <div className="header-navigation">
          <nav className="main-nav">
            {menuItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`nav-item ${activeMenu === item.id ? 'active' : ''}`}
                onClick={() => setActiveMenu(item.id)}
              >
                <i className={`bi ${item.icon}`} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="nav-separator" />

          <nav className="admin-nav">
            {adminItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`nav-item ${activeMenu === item.id ? 'active' : ''}`}
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

        {/* 頁面標題 */}
        <div className="page-heading">
          <div>
            <div className="breadcrumb-text">
              系統首頁 <i className="bi bi-chevron-right" /> {activeItem.label}
            </div>
            <h4>{activeMenu === 'dashboard' ? '營運總覽' : activeItem.label}</h4>
            <p>
              {activeMenu === 'dashboard'
                ? '掌握 SAP 物料耗用狀況與資料管理進度。'
                : `目前位置：${activeItem.label}`}
            </p>
          </div>

          <div className="page-date">
            <i className="bi bi-calendar3" />
            <span>物料耗用分析管理中心</span>
          </div>
        </div>

        {renderPage()}

        <footer className="app-footer">
          <span>SAP MATERIAL CONSUMPTION ANALYSIS SYSTEM</span>
          <span>Version 1.0</span>
        </footer>

      </main>
    </div>
  )
}

function Dashboard({ onNavigate }) {
  return (
    <>
      {/* 統計卡片 */}
      <div className="stats-grid">

        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon blue">
              <i className="bi bi-cloud-upload" />
            </div>
            <span className="stat-label">DATA BATCHES</span>
          </div>
          <div className="stat-value">0</div>
          <div className="stat-description">累積上傳資料批次</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon teal">
              <i className="bi bi-box-seam" />
            </div>
            <span className="stat-label">MATERIALS</span>
          </div>
          <div className="stat-value">0</div>
          <div className="stat-description">目前分析物料數量</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon green">
              <i className="bi bi-activity" />
            </div>
            <span className="stat-label">SYSTEM STATUS</span>
          </div>
          <div className="stat-value status-normal">正常</div>
          <div className="stat-description">
            <span className="status-dot" /> 系統介面運作正常
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
              <p>匯入 SAP 物料異動資料，作為後續耗用分析基礎。</p>
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
            <p>支援 Excel 格式，後續將提供欄位檢查及資料匯入。</p>
            <button className="btn btn-primary px-4" disabled>
              <i className="bi bi-upload me-2" />
              上傳功能建置中
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
            <button onClick={() => onNavigate('upload')}>
              <span className="quick-icon blue">
                <i className="bi bi-file-earmark-arrow-up" />
              </span>
              <span className="quick-text">
                <strong>MB51 資料上傳</strong>
                <small>匯入 SAP Excel 資料</small>
              </span>
              <i className="bi bi-chevron-right quick-arrow" />
            </button>

            <button onClick={() => onNavigate('analysis')}>
              <span className="quick-icon teal">
                <i className="bi bi-bar-chart-line" />
              </span>
              <span className="quick-text">
                <strong>物料耗用分析</strong>
                <small>查看耗用統計及排名</small>
              </span>
              <i className="bi bi-chevron-right quick-arrow" />
            </button>

            <button onClick={() => onNavigate('data')}>
              <span className="quick-icon purple">
                <i className="bi bi-database" />
              </span>
              <span className="quick-text">
                <strong>資料管理</strong>
                <small>管理匯入資料批次</small>
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
                <td><span className="status-badge status-pending">建置中</span></td>
              </tr>
              <tr>
                <td>物料耗用分析</td>
                <td>耗用總表、月統計及物料排名</td>
                <td><span className="status-badge status-pending">建置中</span></td>
              </tr>
              <tr>
                <td>耗用趨勢圖</td>
                <td>單一物料每月耗用趨勢</td>
                <td><span className="status-badge status-pending">建置中</span></td>
              </tr>
              <tr>
                <td>內部聊天室</td>
                <td>訊息、@TAG 及報表連結分享</td>
                <td><span className="status-badge status-pending">建置中</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}

export default App

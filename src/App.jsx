
import './App.css'

function App() {
  return (
    <div className="d-flex min-vh-100 bg-light">

      {/* 左側導覽列 */}
      <aside className="bg-dark text-white p-3" style={{ width: '250px' }}>
        <h5 className="fw-bold mb-4 mt-2">
          SAP 耗用分析系統
        </h5>

        <div className="text-secondary small mb-2">主選單</div>

        <nav className="nav flex-column gap-2">
          <a className="nav-link active bg-primary text-white rounded" href="#">
            <i className="bi bi-grid me-2"></i>
            首頁儀表板
          </a>

          <a className="nav-link text-white" href="#">
            <i className="bi bi-file-earmark-excel me-2"></i>
            MB51 資料上傳
          </a>

          <a className="nav-link text-white" href="#">
            <i className="bi bi-bar-chart me-2"></i>
            物料耗用分析
          </a>

          <a className="nav-link text-white" href="#">
            <i className="bi bi-database me-2"></i>
            資料管理
          </a>

          <a className="nav-link text-white" href="#">
            <i className="bi bi-chat-dots me-2"></i>
            內部聊天室
          </a>
        </nav>

        <hr className="border-secondary my-4" />

        <div className="text-secondary small mb-2">系統管理</div>

        <nav className="nav flex-column gap-2">
          <a className="nav-link text-white" href="#">
            <i className="bi bi-people me-2"></i>
            使用者管理
          </a>

          <a className="nav-link text-white" href="#">
            <i className="bi bi-gear me-2"></i>
            系統設定
          </a>
        </nav>

        <div className="position-absolute bottom-0 pb-3 text-secondary small">
          SAP Consumption Analysis
          <br />
          Version 1.0
        </div>
      </aside>

      {/* 右側主要內容 */}
      <main className="flex-grow-1">

        {/* 頂部工具列 */}
        <header className="bg-white border-bottom px-4 py-3 d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-0 fw-bold">首頁儀表板</h5>
            <small className="text-secondary">
              物料耗用分析管理中心
            </small>
          </div>

          <div className="d-flex align-items-center gap-3">
            <span className="text-secondary small">
              OWNER 管理者
            </span>
            <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
              style={{ width: 38, height: 38 }}>
              O
            </div>
          </div>
        </header>

        <div className="p-4">

          {/* 歡迎區塊 */}
          <div className="mb-4">
            <h4 className="fw-bold">歡迎使用物料耗用分析系統</h4>
            <p className="text-secondary mb-0">
              集中管理 SAP MB51 資料，快速掌握物料耗用狀況。
            </p>
          </div>

          {/* 統計卡片 */}
          <div className="row g-3 mb-4">

            <div className="col-md-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="text-secondary small">上傳資料批次</div>
                  <h3 className="fw-bold mt-2">0</h3>
                  <small className="text-secondary">目前累積上傳批次</small>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="text-secondary small">分析物料數量</div>
                  <h3 className="fw-bold mt-2">0</h3>
                  <small className="text-secondary">目前資料涵蓋物料</small>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="text-secondary small">資料管理狀態</div>
                  <h3 className="fw-bold mt-2 text-success">正常</h3>
                  <small className="text-secondary">介面展示階段</small>
                </div>
              </div>
            </div>

          </div>

          {/* MB51 上傳區塊 */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div>
                  <h5 className="fw-bold">MB51 資料上傳</h5>
                  <p className="text-secondary mb-0">
                    匯入 SAP MB51 Excel，建立物料耗用分析資料。
                  </p>
                </div>

                <button className="btn btn-primary px-4" disabled>
                  <i className="bi bi-upload me-2"></i>
                  上傳功能建置中
                </button>
              </div>

              <div className="border rounded p-4 mt-3 text-center bg-light">
                <i className="bi bi-file-earmark-spreadsheet fs-1 text-success"></i>
                <p className="fw-semibold mt-2 mb-1">
                  MB51 Excel 匯入區
                </p>
                <small className="text-secondary">
                  支援格式及資料檢查功能將於後續階段建置
                </small>
              </div>
            </div>
          </div>

          {/* 功能列表 */}
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-3">系統功能</h5>

              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>功能</th>
                      <th>說明</th>
                      <th>目前狀態</th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr>
                      <td>MB51 資料上傳</td>
                      <td>Excel 匯入及資料檢查</td>
                      <td><span className="badge bg-secondary">建置中</span></td>
                    </tr>
                    <tr>
                      <td>物料耗用分析</td>
                      <td>耗用總表、月統計及物料排名</td>
                      <td><span className="badge bg-secondary">建置中</span></td>
                    </tr>
                    <tr>
                      <td>耗用趨勢圖</td>
                      <td>單一物料每月耗用趨勢</td>
                      <td><span className="badge bg-secondary">建置中</span></td>
                    </tr>
                    <tr>
                      <td>內部聊天室</td>
                      <td>訊息、@TAG 及報表連結分享</td>
                      <td><span className="badge bg-secondary">建置中</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <footer className="text-center text-secondary small mt-4">
            SAP Material Consumption Analysis System
          </footer>

        </div>
      </main>
    </div>
  )
}

export default App

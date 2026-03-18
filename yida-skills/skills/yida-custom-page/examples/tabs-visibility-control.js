// ============================================================
// 示例：下拉选项控制选项卡（Tabs）表格页显示/隐藏
// 场景：根据下拉选择框的值动态控制选项卡中表格页的显示/隐藏
// ============================================================

const _customState = {
  selectedType: 'all', // 下拉框初始值：all/typeA/typeB/typeC
  activeTab: 'tableA', // 当前激活的 Tab
};

export function getCustomState(key) {
  if (key) {
    return _customState[key];
  }
  return { ..._customState };
}

export function setCustomState(newState) {
  Object.keys(newState).forEach(function(key) {
    _customState[key] = newState[key];
  });
  this.forceUpdate();
}

export function forceUpdate() {
  this.setState({ timestamp: new Date().getTime() });
}

export function didMount() {
  // 初始化逻辑
}

export function didUnmount() {
  // 清理逻辑
}

/**
 * 下拉选项变更处理
 */
export function handleTypeChange(value) {
  this.setCustomState({ selectedType: value });
}

export function renderJsx() {
  const { timestamp } = this.state;
  const selectedType = _customState.selectedType;

  // 根据下拉值决定各 Tab 页是否可见
  // 规则：选择"全部"时显示所有，选择具体类型时只显示对应 Tab
  var showTableA = selectedType === 'all' || selectedType === 'typeA';
  var showTableB = selectedType === 'all' || selectedType === 'typeB';
  var showTableC = selectedType === 'all' || selectedType === 'typeC';

  var styles = {
    container: { padding: '16px' },
    toolbar: { marginBottom: '12px' },
    select: { padding: '6px 12px', borderRadius: '4px', border: '1px solid #d9d9d9', fontSize: '14px' },
    tabBar: { display: 'flex', borderBottom: '2px solid #e8e8e8', marginBottom: '16px' },
    tab: { padding: '8px 20px', cursor: 'pointer', fontSize: '14px', color: '#595959', borderBottom: '2px solid transparent', marginBottom: '-2px' },
    tabActive: { padding: '8px 20px', cursor: 'pointer', fontSize: '14px', color: '#1890ff', borderBottom: '2px solid #1890ff', marginBottom: '-2px', fontWeight: 'bold' },
    tablePanel: { minHeight: '200px' },
    hiddenPanel: { display: 'none' },
    placeholder: { padding: '40px', textAlign: 'center', color: '#bfbfbf', fontSize: '14px' },
  };

  // 当前激活的 Tab
  var activeTab = _customState.activeTab || 'tableA';

  // 计算可见 Tab 列表
  var visibleTabs = [];
  if (showTableA) visibleTabs.push('tableA');
  if (showTableB) visibleTabs.push('tableB');
  if (showTableC) visibleTabs.push('tableC');

  // 若当前激活的 Tab 被隐藏，自动切换到第一个可见 Tab
  var effectiveActiveTab = visibleTabs.indexOf(activeTab) >= 0 ? activeTab : (visibleTabs[0] || '');

  return (
    <div style={styles.container}>
      {/* 必须保留：用于触发重新渲染 */}
      <div style={{ display: 'none' }}>{timestamp}</div>

      {/* 下拉选择框 */}
      <div style={styles.toolbar}>
        <select
          style={styles.select}
          defaultValue={selectedType}
          onChange={(e) => { this.handleTypeChange(e.target.value); }}
        >
          <option value="all">全部</option>
          <option value="typeA">类型 A</option>
          <option value="typeB">类型 B</option>
          <option value="typeC">类型 C</option>
        </select>
      </div>

      {/* 选项卡标题栏：只渲染可见的 Tab */}
      <div style={styles.tabBar}>
        {showTableA && (
          <div
            style={effectiveActiveTab === 'tableA' ? styles.tabActive : styles.tab}
            onClick={() => { _customState.activeTab = 'tableA'; this.forceUpdate(); }}
          >
            表格 A
          </div>
        )}
        {showTableB && (
          <div
            style={effectiveActiveTab === 'tableB' ? styles.tabActive : styles.tab}
            onClick={() => { _customState.activeTab = 'tableB'; this.forceUpdate(); }}
          >
            表格 B
          </div>
        )}
        {showTableC && (
          <div
            style={effectiveActiveTab === 'tableC' ? styles.tabActive : styles.tab}
            onClick={() => { _customState.activeTab = 'tableC'; this.forceUpdate(); }}
          >
            表格 C
          </div>
        )}
      </div>

      {/* 选项卡内容区：通过 display:none 控制显隐，保留 DOM 避免重复加载 */}
      <div style={effectiveActiveTab === 'tableA' ? styles.tablePanel : styles.hiddenPanel}>
        {/* 嵌入表格 A，例如通过 iframe 加载宜搭数据管理页 */}
        <iframe
          src={'https://www.aliwork.com/' + window.pageConfig.appType + '/workbench/FORM-AAAA?iframe=true'}
          style={{ width: '100%', height: '500px', border: 'none' }}
        />
      </div>
      <div style={effectiveActiveTab === 'tableB' ? styles.tablePanel : styles.hiddenPanel}>
        <iframe
          src={'https://www.aliwork.com/' + window.pageConfig.appType + '/workbench/FORM-BBBB?iframe=true'}
          style={{ width: '100%', height: '500px', border: 'none' }}
        />
      </div>
      <div style={effectiveActiveTab === 'tableC' ? styles.tablePanel : styles.hiddenPanel}>
        <iframe
          src={'https://www.aliwork.com/' + window.pageConfig.appType + '/workbench/FORM-CCCC?iframe=true'}
          style={{ width: '100%', height: '500px', border: 'none' }}
        />
      </div>

      {/* 所有 Tab 均被隐藏时的兜底提示 */}
      {visibleTabs.length === 0 && (
        <div style={styles.placeholder}>暂无可显示的表格</div>
      )}
    </div>
  );
}

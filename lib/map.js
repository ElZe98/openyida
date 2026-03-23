'use strict';

const fs = require('fs');
const path = require('path');
const {
  findProjectRoot,
  getMapPath,
  loadMap,
  saveMap,
  makeNodeId,
  makeEdgeId,
  createEvent,
  upsertNode,
  upsertEdge,
  buildAuthRef,
  fetchAppNavigation,
  fetchFormSchema,
  getLabel,
  collectFieldsFromSchema,
  extractPageSource,
  collectOpsFromSource,
  scanLocalPageSources,
} = require('./map-common');

function printUsage() {
  console.error('用法:');
  console.error('  openyida map rebuild <appType>');
  console.error('  openyida map show <appType> [--json]');
  console.error('  openyida map visualize <appType> [outputHtml]');
  console.error('  openyida map link <appType> <fromNodeId> <toNodeId> --type <relationType> [--summary <text>] [--from-field-id <id>] [--from-field-label <label>] [--to-field-id <id>] [--to-field-label <label>] [--scope <internal|cross_app>] [--confidence <level>] [--source-app <appType>] [--target-app <appType>]');
  console.error('  openyida map unlink <appType> <fromNodeId> <toNodeId> --type <relationType>');
}

function hasFlag(args, flag) {
  return args.includes(flag);
}

function getOptionValue(args, flag) {
  const index = args.indexOf(flag);
  if (index >= 0 && index + 1 < args.length) {
    return args[index + 1];
  }
  return '';
}

function shouldSkipNavItem(navItem) {
  const formUuid = String((navItem && (navItem.formUuid || navItem.navUuid)) || '');
  const title = getLabel(navItem && navItem.title);
  if (formUuid.startsWith('NAV-SYSTEM-')) {
    return true;
  }
  return ['待我处理', '我已处理', '我创建的', '抄送我的'].includes(title);
}

function summarize(map) {
  const nodesByType = map.nodes.reduce((acc, node) => {
    acc[node.nodeType] = (acc[node.nodeType] || 0) + 1;
    return acc;
  }, {});
  return {
    appType: map.app.appType,
    appName: map.app.appName,
    nodeCount: map.nodes.length,
    edgeCount: map.edges.length,
    nodesByType,
    mapPath: getMapPath(findProjectRoot(), map.app.appType),
  };
}

function formatSummary(summary) {
  return [
    `应用: ${summary.appName} (${summary.appType})`,
    `节点: ${summary.nodeCount}`,
    `关系: ${summary.edgeCount}`,
    `页面: ${summary.nodesByType.page || 0}`,
    `表单: ${summary.nodesByType.form || 0}`,
    `流程: ${summary.nodesByType.process || 0}`,
    `自动化: ${summary.nodesByType.automation || 0}`,
    `规则: ${summary.nodesByType.rule || 0}`,
    `地图文件: ${summary.mapPath}`,
  ].join('\n');
}

async function rebuildMap(appType) {
  const projectRoot = findProjectRoot();
  const authRef = buildAuthRef();
  const navItems = await fetchAppNavigation(appType, authRef);
  const localPageSources = scanLocalPageSources(projectRoot, appType);
  const map = loadMap(projectRoot, appType, appType);
  const preservedDetails = map.details || { automations: {}, rules: {} };
  const preservedManualEdges = (map.edges || []).filter((edge) => {
    return Array.isArray(edge.evidence) && edge.evidence.some((item) => item && item.type === 'manual_link');
  });
  map.nodes = [];
  map.edges = [];
  map.details = preservedDetails;

  const appNodeId = makeNodeId('app', appType, appType);
  upsertNode(map, {
    nodeId: appNodeId,
    nodeType: 'app',
    appType,
    label: map.app.appName || appType,
  });

  for (const navItem of navItems) {
    if (shouldSkipNavItem(navItem)) {continue;}
    const formUuid = navItem.formUuid || navItem.navUuid;
    if (!formUuid) {continue;}
    const label = getLabel(navItem.title);
    const formType = navItem.formType || 'unknown';
    const schemaContent = await fetchFormSchema(appType, formUuid, authRef).catch(() => null);
    const fields = collectFieldsFromSchema(schemaContent);

    if (formType === 'display') {
      const pageNodeId = makeNodeId('page', appType, formUuid);
      const localPage = localPageSources[formUuid];
      const sourceCode = localPage && localPage.sourceCode ? localPage.sourceCode : extractPageSource(schemaContent);
      const ops = collectOpsFromSource(sourceCode);
      upsertNode(map, {
        nodeId: pageNodeId,
        nodeType: 'page',
        appType,
        pageId: formUuid,
        label,
        pageKind: 'custom',
        meta: {
          sourceFile: localPage && localPage.sourceFile ? localPage.sourceFile : '',
        },
        fields: [],
      });
      upsertEdge(map, {
        edgeId: makeEdgeId('contains', appNodeId, pageNodeId),
        fromNodeId: appNodeId,
        toNodeId: pageNodeId,
        sourceAppType: appType,
        targetAppType: appType,
        relationType: 'contains',
        summary: '应用包含自定义页面',
      });

      ops.reads.forEach((item) => {
        const targetNodeId = makeNodeId('form', appType, item.formUuid);
        upsertEdge(map, {
          edgeId: makeEdgeId(`reads:${item.operation}`, pageNodeId, targetNodeId),
          fromNodeId: pageNodeId,
          toNodeId: targetNodeId,
          sourceAppType: appType,
          targetAppType: appType,
          relationType: 'reads',
          summary: item.operation,
          evidence: [{ type: 'source_code', summary: item.operation }],
        });
      });

      ops.writes.forEach((item) => {
        const targetNodeId = makeNodeId('form', appType, item.formUuid);
        upsertEdge(map, {
          edgeId: makeEdgeId(`writes:${item.operation}`, pageNodeId, targetNodeId),
          fromNodeId: pageNodeId,
          toNodeId: targetNodeId,
          sourceAppType: appType,
          targetAppType: appType,
          relationType: 'writes',
          summary: item.operation,
          evidence: [{ type: 'source_code', summary: item.operation }],
        });
      });

      ops.jumps.forEach((item) => {
        const targetNodeId = makeNodeId('page', appType, item.pageId);
        upsertEdge(map, {
          edgeId: makeEdgeId('jumps_to', pageNodeId, targetNodeId),
          fromNodeId: pageNodeId,
          toNodeId: targetNodeId,
          sourceAppType: appType,
          targetAppType: appType,
          relationType: 'jumps_to',
          summary: '页面跳转',
        });
      });

      ops.processes.forEach((processCode) => {
        const processNodeId = makeNodeId('process', appType, processCode);
        upsertNode(map, {
          nodeId: processNodeId,
          nodeType: 'process',
          appType,
          processCode,
          label: processCode,
        });
        upsertEdge(map, {
          edgeId: makeEdgeId('uses_process', pageNodeId, processNodeId),
          fromNodeId: pageNodeId,
          toNodeId: processNodeId,
          sourceAppType: appType,
          targetAppType: appType,
          relationType: 'uses_process',
          summary: '页面引用流程',
        });
      });
      continue;
    }

    const formNodeId = makeNodeId('form', appType, formUuid);
    upsertNode(map, {
      nodeId: formNodeId,
      nodeType: 'form',
      appType,
      formUuid,
      label,
      formType,
      isProcessForm: formType === 'process',
      processCode: '',
      fields,
    });
    upsertEdge(map, {
      edgeId: makeEdgeId('contains', appNodeId, formNodeId),
      fromNodeId: appNodeId,
      toNodeId: formNodeId,
      sourceAppType: appType,
      targetAppType: appType,
      relationType: 'contains',
      summary: '应用包含表单',
    });
  }

  Object.keys(map.details.automations || {}).forEach((automationId) => {
    const automation = map.details.automations[automationId];
    const nodeId = makeNodeId('automation', appType, automationId);
    upsertNode(map, {
      nodeId,
      nodeType: 'automation',
      appType,
      automationId,
      label: automation.label || automationId,
      meta: {
        triggerSummary: automation.trigger && automation.trigger.sourceFieldLabel
          ? `${automation.trigger.sourceFieldLabel} ${automation.trigger.operator || ''} ${automation.trigger.value || ''}`.trim()
          : automation.triggerSummary || '',
      },
    });
    const trigger = automation.trigger || {};
    if (trigger.sourceFormUuid) {
      const fromNodeId = makeNodeId('form', trigger.sourceAppType || appType, trigger.sourceFormUuid);
      upsertEdge(map, {
        edgeId: makeEdgeId('triggers', fromNodeId, nodeId),
        fromNodeId,
        toNodeId: nodeId,
        sourceAppType: trigger.sourceAppType || appType,
        targetAppType: appType,
        relationType: 'triggers',
        relationScope: trigger.sourceAppType && trigger.sourceAppType !== appType ? 'cross_app' : 'internal',
        summary: `${trigger.sourceFieldLabel || '字段'} ${trigger.operator || ''} ${trigger.value || ''}`.trim(),
        fromFieldId: trigger.sourceFieldId || '',
        fromFieldLabel: trigger.sourceFieldLabel || '',
      });
    }
    (automation.nodes || []).filter((item) => item.nodeType === 'action').forEach((action) => {
      if (!action.targetFormUuid) {return;}
      const toNodeId = makeNodeId('form', action.targetAppType || appType, action.targetFormUuid);
      upsertEdge(map, {
        edgeId: makeEdgeId(`automation:${action.actionOrder || 0}:${action.operationType || 'action'}`, nodeId, toNodeId),
        fromNodeId: nodeId,
        toNodeId,
        sourceAppType: appType,
        targetAppType: action.targetAppType || appType,
        relationType: action.operationType === 'query' ? 'reads' : action.operationType === 'update' ? 'updates' : action.operationType === 'save' ? 'writes' : 'writes',
        relationScope: action.targetAppType && action.targetAppType !== appType ? 'cross_app' : 'internal',
        summary: action.summary || action.label || action.operationType,
        fromFieldId: action.matchFieldId || '',
        fromFieldLabel: action.matchFieldLabel || '',
        toFieldId: action.targetFieldId || '',
        toFieldLabel: action.targetFieldLabel || '',
      });
    });
  });

  Object.keys(map.details.rules || {}).forEach((ruleId) => {
    const rule = map.details.rules[ruleId];
    const nodeId = makeNodeId('rule', appType, ruleId);
    upsertNode(map, {
      nodeId,
      nodeType: 'rule',
      appType,
      ruleId,
      label: rule.label || ruleId,
      meta: {
        ownerPageId: rule.ownerPageId || '',
        triggerMoment: rule.triggerMoment || 'submit',
      },
    });
    if (rule.ownerPageId) {
      const pageNodeId = makeNodeId('page', appType, rule.ownerPageId);
      upsertEdge(map, {
        edgeId: makeEdgeId('submits', pageNodeId, nodeId),
        fromNodeId: pageNodeId,
        toNodeId: nodeId,
        sourceAppType: appType,
        targetAppType: appType,
        relationType: 'submits',
        summary: rule.triggerMoment || 'submit',
      });
    }
    (rule.nodes || []).filter((item) => item.nodeType === 'action').forEach((action) => {
      if (!action.targetFormUuid) {return;}
      const toNodeId = makeNodeId('form', action.targetAppType || appType, action.targetFormUuid);
      upsertEdge(map, {
        edgeId: makeEdgeId(`rule:${action.actionOrder || 0}:${action.operationType || 'action'}`, nodeId, toNodeId),
        fromNodeId: nodeId,
        toNodeId,
        sourceAppType: appType,
        targetAppType: action.targetAppType || appType,
        relationType: action.operationType === 'query' ? 'reads' : action.operationType === 'update' ? 'writes' : action.operationType === 'save' ? 'writes' : action.operationType === 'delete' ? 'writes' : 'writes',
        relationScope: action.targetAppType && action.targetAppType !== appType ? 'cross_app' : 'internal',
        summary: action.summary || action.label || action.operationType,
        fromFieldId: action.matchFieldId || '',
        fromFieldLabel: action.matchFieldLabel || '',
        toFieldId: action.targetFieldId || '',
        toFieldLabel: action.targetFieldLabel || '',
      });
    });
  });

  preservedManualEdges.forEach((edge) => {
    upsertEdge(map, edge);
  });

  map.events.push(createEvent('rebuild', `重建地图：${map.nodes.length} 个节点，${map.edges.length} 条关系`, {
    nodeCount: map.nodes.length,
    edgeCount: map.edges.length,
  }));
  saveMap(projectRoot, map);
  return summarize(map);
}

function linkMap(args) {
  const appType = args[1];
  const fromNodeId = args[2];
  const toNodeId = args[3];
  const relationType = getOptionValue(args, '--type') || 'relates_to';
  if (!appType || !fromNodeId || !toNodeId) {
    throw new Error('用法: openyida map link <appType> <fromNodeId> <toNodeId> --type <relationType> [--summary ...]');
  }
  const projectRoot = findProjectRoot();
  const map = loadMap(projectRoot, appType, appType);
  const edge = {
    edgeId: makeEdgeId(relationType, fromNodeId, toNodeId),
    fromNodeId,
    toNodeId,
    sourceAppType: getOptionValue(args, '--source-app') || appType,
    targetAppType: getOptionValue(args, '--target-app') || appType,
    relationType,
    relationScope: getOptionValue(args, '--scope') || 'internal',
    confidence: getOptionValue(args, '--confidence') || 'confirmed',
    summary: getOptionValue(args, '--summary') || relationType,
    fromFieldId: getOptionValue(args, '--from-field-id') || '',
    fromFieldLabel: getOptionValue(args, '--from-field-label') || '',
    toFieldId: getOptionValue(args, '--to-field-id') || '',
    toFieldLabel: getOptionValue(args, '--to-field-label') || '',
    evidence: [{ type: 'manual_link', summary: '通过 openyida map link 添加' }],
  };
  map.edges = map.edges || [];
  const index = map.edges.findIndex((item) => item.edgeId === edge.edgeId);
  if (index >= 0) {
    map.edges[index] = Object.assign({}, map.edges[index], edge);
  } else {
    map.edges.push(edge);
  }
  map.events = map.events || [];
  map.events.push(createEvent('manual_link', `手动建立关系：${fromNodeId} -> ${toNodeId}`, {
    relationType,
    fromNodeId,
    toNodeId,
  }));
  saveMap(projectRoot, map);
  return {
    success: true,
    appType,
    edgeId: edge.edgeId,
    mapPath: getMapPath(projectRoot, appType),
  };
}

function unlinkMap(args) {
  const appType = args[1];
  const fromNodeId = args[2];
  const toNodeId = args[3];
  const relationType = getOptionValue(args, '--type') || '';
  if (!appType || !fromNodeId || !toNodeId || !relationType) {
    throw new Error('用法: openyida map unlink <appType> <fromNodeId> <toNodeId> --type <relationType>');
  }
  const projectRoot = findProjectRoot();
  const map = loadMap(projectRoot, appType, appType);
  const edgeId = makeEdgeId(relationType, fromNodeId, toNodeId);
  const before = map.edges.length;
  map.edges = (map.edges || []).filter((edge) => edge.edgeId !== edgeId);
  if (map.edges.length === before) {
    return {
      success: false,
      appType,
      edgeId,
      message: '未找到匹配的关系边',
    };
  }
  map.events = map.events || [];
  map.events.push(createEvent('manual_unlink', `手动断开关系：${fromNodeId} -> ${toNodeId}`, {
    relationType,
    fromNodeId,
    toNodeId,
  }));
  saveMap(projectRoot, map);
  return {
    success: true,
    appType,
    edgeId,
    mapPath: getMapPath(projectRoot, appType),
  };
}

function buildVisualizationHtml(map) {
  const positions = {};
  const pages = map.nodes.filter((node) => node.nodeType === 'page');
  const forms = map.nodes.filter((node) => node.nodeType === 'form');
  const automations = map.nodes.filter((node) => node.nodeType === 'automation');
  const rules = map.nodes.filter((node) => node.nodeType === 'rule');
  const processes = map.nodes.filter((node) => node.nodeType === 'process');
  const pageOrderWeight = {
    '门户首页': 1,
    '订单管理列表页': 2,
    '业务下单页面': 3,
    '配件主数据列表页': 4,
    '建立配件页面': 5,
  };
  pages.sort((a, b) => {
    return (pageOrderWeight[a.label] || 99) - (pageOrderWeight[b.label] || 99) || String(a.label).localeCompare(String(b.label), 'zh-CN');
  });
  pages.forEach((node, index) => {
    positions[node.nodeId] = { x: 60, y: 70 + index * 180 };
  });

  const formScore = {};
  forms.forEach((node) => {
    const relatedPages = map.edges
      .filter((edge) => edge.relationType !== 'contains' && edge.toNodeId === node.nodeId)
      .map((edge) => pages.find((page) => page.nodeId === edge.fromNodeId))
      .filter(Boolean);
    if (!relatedPages.length) {
      formScore[node.nodeId] = 99999;
      return;
    }
    const avg = relatedPages.reduce((sum, page) => sum + (positions[page.nodeId] ? positions[page.nodeId].y : 0), 0) / relatedPages.length;
    formScore[node.nodeId] = avg;
  });
  forms.sort((a, b) => (formScore[a.nodeId] || 99999) - (formScore[b.nodeId] || 99999) || String(a.label).localeCompare(String(b.label), 'zh-CN'));
  forms.forEach((node, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    positions[node.nodeId] = { x: 500 + col * 310, y: 70 + row * 180 + (col === 1 ? 70 : 0) };
  });

  processes.forEach((node, index) => {
    positions[node.nodeId] = { x: 1160, y: 90 + index * 180 };
  });
  automations.forEach((node, index) => {
    positions[node.nodeId] = { x: 1160, y: 430 + index * 180 };
  });
  rules.forEach((node, index) => {
    positions[node.nodeId] = { x: 1160, y: 760 + index * 180 };
  });
  const relationTypes = Array.from(new Set(map.edges.filter((edge) => edge.relationType !== 'contains').map((edge) => edge.relationType))).sort();
  const payload = { map, positions, relationTypes };
  const relationTypeLabels = {
    reads: '读取',
    writes: '写入',
    relates_to: '表关联',
    jumps_to: '页面跳转',
    snapshot_to: '更新数据',
    triggers: '触发',
    updates: '更新',
    submits: '提交规则',
    uses_process: '流程引用',
    copies_to: '复制写入'
  };
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${map.app.appName} - yida-map</title>
  <style>
    * { box-sizing:border-box; }
    body { margin:0; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; background:#eef3ea; color:#1f2a1f; }
    .layout { display:grid; grid-template-columns:1fr 360px; min-height:100vh; }
    .canvas { position:relative; overflow:auto; background:linear-gradient(180deg,#f6f3ea 0%,#eef3ea 100%); }
    .board { position:relative; min-width:1600px; min-height:1200px; }
    .sidebar { border-left:1px solid #dbe3d7; background:#fffdf7; padding:18px; overflow:auto; }
    .hero { position:sticky; top:0; background:#fffdf7; padding-bottom:12px; border-bottom:1px solid #dbe3d7; margin-bottom:14px; }
    .hero h1 { margin:0 0 6px; font-size:20px; }
    .sub { color:#617064; font-size:12px; line-height:1.7; }
    .filters { margin-top:12px; padding-top:12px; border-top:1px dashed #dbe3d7; }
    .filter-tags { display:flex; flex-wrap:wrap; gap:8px; }
    .filter-tag { display:inline-flex; align-items:center; justify-content:center; padding:6px 10px; border-radius:999px; background:#edf3ee; color:#4b5d52; font-size:12px; font-weight:700; cursor:pointer; user-select:none; border:1px solid #dbe3d7; }
    .filter-tag.active { background:#2d6a4f; color:#fff; border-color:#2d6a4f; }
    .tabs { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:12px; }
    .tab-btn { border:none; background:#edf3ee; color:#4b5d52; padding:6px 10px; border-radius:999px; font-size:12px; font-weight:700; cursor:pointer; }
    .tab-btn.active { background:#2d6a4f; color:#fff; }
    .tab-panel { display:none; }
    .tab-panel.active { display:block; }
    .node { position:absolute; width:220px; border-radius:18px; border:1px solid #dbe3d7; background:#fffdf7; box-shadow:0 10px 24px rgba(31,42,31,.06); padding:14px; cursor:pointer; }
    .node.active { outline:2px solid #2d6a4f; }
    .node-type { display:inline-block; padding:3px 8px; border-radius:999px; background:#d9eadf; color:#2d6a4f; font-size:11px; font-weight:700; margin-bottom:8px; }
    .node-title { font-size:15px; font-weight:700; margin-bottom:8px; }
    .node-meta { font-size:11px; color:#617064; white-space:pre-line; line-height:1.5; }
    svg { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; }
    .section { margin-bottom:18px; }
    .section h3 { margin:0 0 10px; font-size:14px; }
    .kv { margin-bottom:8px; }
    .kv .k { font-size:12px; color:#617064; margin-bottom:3px; }
    .kv .v { font-size:13px; line-height:1.6; word-break:break-all; }
    .field { padding:8px 10px; border:1px solid #dbe3d7; border-radius:12px; background:#fff; margin-bottom:8px; }
    .field-name { font-weight:700; font-size:13px; }
    .field-meta { font-size:11px; color:#617064; margin-top:4px; }
    .edge-item { padding:8px 10px; border-radius:12px; background:#f4f7f2; margin-bottom:8px; font-size:12px; line-height:1.6; }
    .tag { display:inline-block; padding:2px 8px; border-radius:999px; background:#d9eadf; color:#2d6a4f; font-size:11px; font-weight:700; margin:0 6px 6px 0; }
    .relation-tag { display:inline-block; padding:2px 8px; border-radius:999px; color:#fff; font-size:10px; font-weight:700; margin:0 6px 6px 0; }
    .action { padding:8px 10px; border:1px solid #dbe3d7; border-radius:12px; background:#fff; margin-bottom:8px; }
    .action-title { font-size:12px; font-weight:700; margin-bottom:4px; }
    .action-meta { font-size:11px; color:#617064; line-height:1.6; }
    .btn { display:inline-block; margin-top:10px; padding:6px 12px; border:none; border-radius:999px; background:#2d6a4f; color:#fff; font-size:12px; font-weight:700; cursor:pointer; }
  </style>
</head>
<body>
  <div class="layout">
    <div class="canvas"><div id="board" class="board"><svg id="svg"></svg></div></div>
    <aside class="sidebar">
      <div class="hero">
        <h1>${map.app.appName} / yida-map</h1>
        <div class="sub">左侧主图只展示业务节点；点击任意节点后，右侧显示字段、关系和相关页面信息。</div>
        <div class="filters">
          <div class="sub" style="margin-bottom:8px;">关系显示筛选</div>
          <div id="relationFilters"></div>
        </div>
      </div>
      <div id="detail"></div>
    </aside>
  </div>
  <script>
    const payload = ${JSON.stringify(payload)};
    const board = document.getElementById('board');
    const svg = document.getElementById('svg');
    const detail = document.getElementById('detail');
    function buildTabs(sections) {
      const tabs = sections.filter((item) => item && item.content);
      if (!tabs.length) return '<div class="sub">暂无详情</div>';
      let html = '<div class="tabs">';
      tabs.forEach((tab, index) => {
        html += '<button class="tab-btn' + (index === 0 ? ' active' : '') + '" data-tab-target="' + tab.key + '">' + tab.title + '</button>';
      });
      html += '</div>';
      tabs.forEach((tab, index) => {
        html += '<div class="tab-panel' + (index === 0 ? ' active' : '') + '" data-tab-panel="' + tab.key + '">' + tab.content + '</div>';
      });
      return html;
    }
    function bindTabs() {
      const buttons = detail.querySelectorAll('[data-tab-target]');
      buttons.forEach((btn) => {
        btn.onclick = function() {
          const key = btn.getAttribute('data-tab-target');
          detail.querySelectorAll('[data-tab-target]').forEach((item) => item.classList.toggle('active', item === btn));
          detail.querySelectorAll('[data-tab-panel]').forEach((panel) => panel.classList.toggle('active', panel.getAttribute('data-tab-panel') === key));
        };
      });
    }
    const relationFilters = new Set(payload.relationTypes);
    const relationTypeLabels = ${JSON.stringify(relationTypeLabels)};
    const relationColors = {
      reads: '#2563eb',
      writes: '#15803d',
      relates_to: '#0f766e',
      jumps_to: '#b45309',
      snapshot_to: '#7c3aed',
      triggers: '#dc2626',
      updates: '#059669',
      submits: '#9333ea',
      uses_process: '#be123c',
      copies_to: '#0d9488'
    };
    function getGroupColor(group) {
      if (!group || !group.relationTypes || !group.relationTypes.length) return '#2d6a4f';
      if (group.relationTypes.includes('relates_to')) return relationColors.relates_to;
      if (group.relationTypes.includes('writes')) return relationColors.writes;
      if (group.relationTypes.includes('reads')) return relationColors.reads;
      if (group.relationTypes.includes('jumps_to')) return relationColors.jumps_to;
      return relationColors[group.relationTypes[0]] || '#2d6a4f';
    }
    function groupEdges(edges) {
      const map = new Map();
      edges.forEach((edge) => {
        const key = edge.fromNodeId + '>>' + edge.toNodeId;
        if (!map.has(key)) {
          map.set(key, {
            key,
            fromNodeId: edge.fromNodeId,
            toNodeId: edge.toNodeId,
            edges: [],
            relationTypes: new Set(),
          });
        }
        const bucket = map.get(key);
        bucket.edges.push(edge);
        bucket.relationTypes.add(edge.relationType);
      });
      return Array.from(map.values()).map((bucket) => {
        bucket.relationTypes = Array.from(bucket.relationTypes);
        return bucket;
      });
    }
    function getVisibleEdges() {
      return payload.map.edges.filter((edge) => edge.relationType !== 'contains' && relationFilters.has(edge.relationType));
    }
    function getVisibleEdgeGroups() {
      return groupEdges(getVisibleEdges());
    }
    function renderRelationFilters() {
      const root = document.getElementById('relationFilters');
      root.innerHTML = '';
      const wrap = document.createElement('div');
      wrap.className = 'filter-tags';
      payload.relationTypes.forEach((type) => {
        const tag = document.createElement('button');
        tag.className = 'filter-tag' + (relationFilters.has(type) ? ' active' : '');
        tag.textContent = relationTypeLabels[type] || type;
        tag.onclick = function() {
          if (relationFilters.has(type)) relationFilters.delete(type); else relationFilters.add(type);
          tag.classList.toggle('active', relationFilters.has(type));
          drawEdges();
          if (window.__activeNodeId) window.renderNodeDetail(window.__activeNodeId);
        };
        wrap.appendChild(tag);
      });
      root.appendChild(wrap);
    }
    function renderDetailFlow(type, id) {
      const data = type === 'automation' ? payload.map.details.automations[id] : payload.map.details.rules[id];
      if (!data) return;
      let overview = '<div class="section"><h3>' + (data.label || id) + '</h3>';
      if (type === 'automation' && data.trigger) {
        overview += '<div class="edge-item"><strong>触发器</strong><br />' + (data.trigger.sourceFieldLabel || '-') + ' ' + (data.trigger.operator || '') + ' ' + (data.trigger.value || '') + '</div>';
      }
      if (type === 'rule') {
        overview += '<div class="edge-item"><strong>触发时机</strong><br />' + (data.triggerMoment || 'submit') + '</div>';
      }
      overview += '<button class="btn" onclick=' + JSON.stringify('window.renderNodeDetail(' + JSON.stringify(type + ':' + id) + ')') + '>返回节点详情</button></div>';
      let flow = '<div class="section"><h3>动作链</h3>';
      (data.nodes || []).forEach((item) => {
        flow += '<div class="action"><div class="action-title">' + (item.label || item.nodeType) + '</div><div class="action-meta">类型：' + item.nodeType;
        if (item.operationType) flow += '<br />操作：' + item.operationType;
        if (item.targetFormUuid) flow += '<br />目标表单：' + item.targetFormUuid;
        if (item.matchFieldLabel || item.targetFieldLabel) flow += '<br />字段：' + (item.matchFieldLabel || '-') + ' → ' + (item.targetFieldLabel || '-');
        if (item.summary) flow += '<br />说明：' + item.summary;
        flow += '</div></div>';
      });
      flow += '</div>';
      detail.innerHTML = buildTabs([
        { key: 'overview', title: '概览', content: overview },
        { key: 'flow', title: '流图', content: flow }
      ]);
      bindTabs();
    }
    function createNode(node) {
      if (!payload.positions[node.nodeId]) return;
      const el = document.createElement('div');
      el.className = 'node';
      el.dataset.nodeId = node.nodeId;
      el.style.left = payload.positions[node.nodeId].x + 'px';
      el.style.top = payload.positions[node.nodeId].y + 'px';
      el.innerHTML = '<div class="node-type">' + node.nodeType + '</div><div class="node-title">' + node.label + '</div><div class="node-meta">' + (node.metaText || '') + '</div>';
      el.onclick = () => selectNode(node.nodeId);
      board.appendChild(el);
    }
    function drawEdges() {
      svg.innerHTML = '';
      getVisibleEdgeGroups().forEach((group, index) => {
        const from = payload.positions[group.fromNodeId];
        const to = payload.positions[group.toNodeId];
        if (!from || !to) return;
        const fromOnRight = to.x >= from.x;
        const toOnLeft = to.x >= from.x;
        const x1 = fromOnRight ? (from.x + 220) : from.x;
        const y1 = from.y + 58;
        const x2 = toOnLeft ? to.x : (to.x + 220);
        const y2 = to.y + 58;
        const dx = Math.max(60, Math.abs(x2 - x1) * 0.3);
        const laneOffset = ((index % 7) - 3) * 14;
        const color = getGroupColor(group);
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const c1x = fromOnRight ? (x1 + dx) : (x1 - dx);
        const c2x = toOnLeft ? (x2 - dx) : (x2 + dx);
        path.setAttribute('d', 'M ' + x1 + ' ' + y1 + ' C ' + c1x + ' ' + (y1 + laneOffset) + ', ' + c2x + ' ' + (y2 - laneOffset) + ', ' + x2 + ' ' + y2);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', color);
        path.setAttribute('stroke-width', group.relationTypes.includes('relates_to') ? '2.2' : '1.6');
        path.setAttribute('stroke-opacity', group.relationTypes.length === 1 && group.relationTypes[0] === 'jumps_to' ? '0.35' : '0.72');
        svg.appendChild(path);
      });
    }
    function selectNode(nodeId) {
      window.renderNodeDetail(nodeId);
    }
    window.renderNodeDetail = function(nodeId) {
      window.__activeNodeId = nodeId;
      Array.from(document.querySelectorAll('.node')).forEach((item) => {
        item.classList.toggle('active', item.dataset.nodeId === nodeId);
      });
      const node = payload.map.nodes.find((item) => item.nodeId === nodeId);
      const edges = getVisibleEdges().filter((item) => item.fromNodeId === nodeId || item.toNodeId === nodeId);
      const edgeGroups = groupEdges(edges);
      if (!node) {
        detail.innerHTML = '<div class="section"><h3>节点详情</h3><div class="sub">请选择主图中的节点。</div></div>';
        return;
      }
      const readPages = [];
      const writePages = [];
      const relatedPages = [];
      getVisibleEdges().forEach((edge) => {
        const from = payload.map.nodes.find((item) => item.nodeId === edge.fromNodeId);
        const to = payload.map.nodes.find((item) => item.nodeId === edge.toNodeId);
        if (node.nodeType === 'form') {
          if (edge.toNodeId === nodeId && edge.relationType === 'reads' && from && from.nodeType === 'page') readPages.push(from.label);
          if (edge.toNodeId === nodeId && edge.relationType === 'writes' && from && from.nodeType === 'page') writePages.push(from.label);
        }
        if (node.nodeType === 'page') {
          if ((edge.fromNodeId === nodeId || edge.toNodeId === nodeId) && (from && from.nodeType === 'page' || to && to.nodeType === 'page')) {
            const target = edge.fromNodeId === nodeId ? to : from;
            if (target && target.nodeType === 'page') relatedPages.push(target.label);
          }
        }
      });
      let overview = '<div class="section"><h3>' + node.label + '</h3>';
      overview += '<div class="kv"><div class="k">节点类型</div><div class="v">' + ({page:'页面',form:'表单',process:'流程',automation:'自动化',rule:'规则',app:'应用'}[node.nodeType] || node.nodeType) + '</div></div>';
      overview += '<div class="kv"><div class="k">所属应用</div><div class="v">' + node.appType + '</div></div>';
      if (node.processCode) overview += '<div class="kv"><div class="k">processCode</div><div class="v">' + node.processCode + '</div></div>';
      overview += '</div>';
      let fieldsPanel = '';
      if (node.fields && node.fields.length) {
        fieldsPanel += '<div class="section"><h3>字段清单</h3>';
        node.fields.forEach((field) => {
          fieldsPanel += '<div class="field"><div class="field-name">' + field.fieldLabel + '</div><div class="field-meta">' + field.fieldId + ' / ' + field.componentType + (field.required ? ' / 必填' : '') + '</div></div>';
        });
        fieldsPanel += '</div>';
      }
      let relatedPanel = '';
      if (node.nodeType === 'form') {
        relatedPanel += '<div class="section"><h3>相关自定义页面</h3>';
        if (!readPages.length && !writePages.length) {
          relatedPanel += '<div class="sub">暂无页面依赖</div>';
        } else {
          if (readPages.length) relatedPanel += '<div class="kv"><div class="k">读取该表单的页面</div><div class="v">' + readPages.map((item) => '<span class="tag">' + item + '</span>').join('') + '</div></div>';
          if (writePages.length) relatedPanel += '<div class="kv"><div class="k">写入该表单的页面</div><div class="v">' + writePages.map((item) => '<span class="tag">' + item + '</span>').join('') + '</div></div>';
        }
        relatedPanel += '</div>';
      }
      if (node.nodeType === 'page') {
        relatedPanel += '<div class="section"><h3>相关自定义页面</h3>';
        if (!relatedPages.length) {
          relatedPanel += '<div class="sub">暂无页面联动</div>';
        } else {
          relatedPanel += '<div class="v">' + relatedPages.map((item) => '<span class="tag">' + item + '</span>').join('') + '</div>';
        }
        relatedPanel += '</div>';
      }
      if (node.nodeType === 'automation' || node.nodeType === 'rule') {
        const objectId = node.nodeType === 'automation' ? node.automationId : node.ruleId;
        relatedPanel += '<div class="section"><h3>详情流图</h3><button class="btn" onclick=' + JSON.stringify('window.renderDetailFlow(' + JSON.stringify(node.nodeType) + ', ' + JSON.stringify(objectId) + ')') + '>查看详情</button></div>';
      }
      let relationPanel = '<div class="section"><h3>相关关系</h3>';
      if (!edgeGroups.length) {
        relationPanel += '<div class="sub">暂无业务关系</div>';
      } else {
        edgeGroups.forEach((group) => {
          const from = payload.map.nodes.find((item) => item.nodeId === group.fromNodeId);
          const to = payload.map.nodes.find((item) => item.nodeId === group.toNodeId);
          const relationBadges = group.relationTypes.map((type) => {
            return '<span class="relation-tag" style="background:' + (relationColors[type] || '#2d6a4f') + '">' + (relationTypeLabels[type] || type) + '</span>';
          }).join('');
          const summaries = group.edges.map((edge) => {
            return '<div>' + (edge.summary ? edge.summary : edge.relationType) + (edge.fromFieldLabel || edge.toFieldLabel ? ' / ' + (edge.fromFieldLabel || '-') + ' → ' + (edge.toFieldLabel || '-') : '') + '</div>';
          }).join('');
          relationPanel += '<div class="edge-item"><strong>' + (from ? from.label : group.fromNodeId) + ' → ' + (to ? to.label : group.toNodeId) + '</strong><br />' + relationBadges + summaries + '</div>';
        });
      }
      relationPanel += '</div>';
      detail.innerHTML = buildTabs([
        { key: 'overview', title: '概览', content: overview },
        { key: 'fields', title: '字段', content: fieldsPanel },
        { key: 'related', title: '关联', content: relatedPanel },
        { key: 'relations', title: '关系', content: relationPanel }
      ]);
      bindTabs();
    };
    window.renderDetailFlow = renderDetailFlow;
    payload.map.nodes.forEach((node) => {
      node.metaText = (function(n){
        if (n.nodeType === 'form') return (n.formType || 'form') + '\\n' + (n.formUuid || '');
        if (n.nodeType === 'page') return (n.pageKind || 'page') + '\\n' + (n.pageId || '');
        if (n.nodeType === 'process') return n.processCode || '';
        if (n.nodeType === 'automation') return (n.meta && n.meta.triggerSummary) || n.appType || '';
        if (n.nodeType === 'rule') return (n.meta && n.meta.triggerMoment) || n.appType || '';
        return n.appType || '';
      })(node);
      createNode(node);
    });
    renderRelationFilters();
    drawEdges();
    const firstNode = payload.map.nodes.find((node) => node.nodeType !== 'app');
    if (firstNode) selectNode(firstNode.nodeId);
  </script>
</body>
</html>`;
}

async function visualizeMap(appType, outputPathArg) {
  const projectRoot = findProjectRoot();
  const map = loadMap(projectRoot, appType, appType);
  const outputPath = outputPathArg ? path.resolve(outputPathArg) : path.join(path.dirname(getMapPath(projectRoot, appType)), `${appType}.html`);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, buildVisualizationHtml(map), 'utf8');
  return { appType, outputPath, nodeCount: map.nodes.length, edgeCount: map.edges.length };
}

async function run(args) {
  const subCommand = args[0];
  if (!subCommand) {
    printUsage();
    process.exit(1);
  }

  if (subCommand === 'rebuild') {
    if (!args[1]) {
      throw new Error('缺少 appType');
    }
    const result = await rebuildMap(args[1]);
    console.log(JSON.stringify({ success: true, ...result }, null, 2));
    return;
  }

  if (subCommand === 'show') {
    if (!args[1]) {
      throw new Error('缺少 appType');
    }
    const map = loadMap(findProjectRoot(), args[1], args[1]);
    const result = summarize(map);
    if (hasFlag(args, '--json')) {
      console.log(JSON.stringify({ success: true, ...result }, null, 2));
    } else {
      console.log(formatSummary(result));
    }
    return;
  }

  if (subCommand === 'link') {
    const result = linkMap(args);
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (subCommand === 'unlink') {
    const result = unlinkMap(args);
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (subCommand === 'visualize') {
    if (!args[1]) {
      throw new Error('缺少 appType');
    }
    const result = await visualizeMap(args[1], args[2]);
    console.log(JSON.stringify({ success: true, ...result }, null, 2));
    return;
  }

  printUsage();
  process.exit(1);
}

module.exports = {
  run,
};

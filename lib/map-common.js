'use strict';

const fs = require('fs');
const path = require('path');
const { version: packageVersion } = require('../package.json');
const {
  findProjectRoot,
  loadCookieData,
  triggerLogin,
  resolveBaseUrl,
  httpGet,
  requestWithAutoLogin,
} = require('./core/utils');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function getI18nText(value) {
  if (!value) {return '';}
  if (typeof value === 'string') {return value;}
  return value.zh_CN || value.pureEn_US || value.en_US || value.value || '';
}

function extractSchemaContent(schemaResult) {
  if (!schemaResult) {return null;}
  if (schemaResult.content && typeof schemaResult.content === 'object') {return schemaResult.content;}
  if (schemaResult.pages) {return schemaResult;}
  return null;
}

function buildAuthRef() {
  let cookieData = loadCookieData();
  if (!cookieData) {
    cookieData = triggerLogin();
  }
  return {
    csrfToken: cookieData.csrf_token,
    cookies: cookieData.cookies,
    baseUrl: resolveBaseUrl(cookieData),
    cookieData,
  };
}

async function fetchAppNavigation(appType, authRef) {
  const requestPath = '/' + appType + '/query/app/getAppPlatFormParam.json'
    + '?_api=nattyFetch&_mock=false'
    + '&_csrf_token=' + encodeURIComponent(authRef.csrfToken)
    + '&_locale_time_zone_offset=28800000'
    + '&pageIndex=1&pageSize=200'
    + '&_stamp=' + Date.now();

  const result = await requestWithAutoLogin((auth) => httpGet(auth.baseUrl, requestPath, null, auth.cookies), authRef);
  if (!result || result.success === false || !result.content) {
    throw new Error(result && result.errorMsg ? result.errorMsg : '获取应用导航失败');
  }
  return result.content.formNavigationList || [];
}

async function fetchFormSchema(appType, formUuid, authRef) {
  const result = await requestWithAutoLogin((auth) => {
    return httpGet(
      auth.baseUrl,
      `/alibaba/web/${appType}/_view/query/formdesign/getFormSchema.json`,
      { formUuid, schemaVersion: 'V5' },
      auth.cookies
    );
  }, authRef);
  return extractSchemaContent(result);
}

function walkSchemaComponents(nodes, visitor, parentFieldId) {
  if (!Array.isArray(nodes)) {return;}
  nodes.forEach((node) => {
    if (!node || typeof node !== 'object') {return;}
    const props = node.props || {};
    const currentParentFieldId = (props.__category__ === 'form' && node.componentName === 'TableField') ? props.fieldId : parentFieldId;
    visitor(node, parentFieldId);
    if (Array.isArray(node.children)) {
      walkSchemaComponents(node.children, visitor, currentParentFieldId);
    }
  });
}

function collectRefsFromSource(sourceCode) {
  const refs = {
    formUuids: [],
    processCodes: [],
    urls: [],
  };
  if (!sourceCode) {return refs;}

  const formMatches = sourceCode.match(/FORM-[A-Z0-9]+/g) || [];
  const processMatches = sourceCode.match(/TPROC[-A-Z0-9]+/g) || [];
  const urlMatches = sourceCode.match(/\/(?:[^"'\s]+)\/(?:formDetail|processDetail|workbench|submission)[^"'\s]*/g) || [];

  refs.formUuids = Array.from(new Set(formMatches));
  refs.processCodes = Array.from(new Set(processMatches));
  refs.urls = Array.from(new Set(urlMatches));
  return refs;
}

function now() {
  return Date.now();
}

function getMapDir(projectRoot) {
  return path.join(projectRoot, '.cache', 'maps');
}

function getMapPath(projectRoot, appType) {
  return path.join(getMapDir(projectRoot), `${appType}.json`);
}

function createEmptyMap(appType, appName) {
  const ts = now();
  return {
    meta: {
      version: '2.0.0',
      scope: 'single_app',
      generatedAt: ts,
      updatedAt: ts,
      generator: 'openyida',
      generatorVersion: packageVersion,
    },
    app: {
      appType,
      appName: appName || appType,
    },
    nodes: [],
    edges: [],
    details: {
      automations: {},
      rules: {},
    },
    events: [],
  };
}

function loadMap(projectRoot, appType, appName) {
  const mapPath = getMapPath(projectRoot, appType);
  if (!fs.existsSync(mapPath)) {
    return createEmptyMap(appType, appName);
  }
  return JSON.parse(fs.readFileSync(mapPath, 'utf8'));
}

function saveMap(projectRoot, map) {
  ensureDir(getMapDir(projectRoot));
  map.meta.updatedAt = now();
  fs.writeFileSync(getMapPath(projectRoot, map.app.appType), JSON.stringify(map, null, 2), 'utf8');
}

function makeNodeId(nodeType, appType, objectId) {
  return `${nodeType}:${appType}:${objectId}`;
}

function makeEdgeId(relationType, fromNodeId, toNodeId) {
  return `${relationType}:${Buffer.from(`${fromNodeId}->${toNodeId}`).toString('base64').replace(/=+$/g, '')}`;
}

function createEvent(type, summary, meta) {
  return {
    eventId: `evt:${type}:${now()}:${Math.random().toString(36).slice(2, 8)}`,
    time: now(),
    type,
    summary,
    actor: 'system',
    meta: meta || {},
  };
}

function upsertNode(map, node) {
  const index = map.nodes.findIndex((item) => item.nodeId === node.nodeId);
  const next = Object.assign({ status: 'active', meta: {} }, node);
  if (index >= 0) {
    map.nodes[index] = Object.assign({}, map.nodes[index], next);
  } else {
    map.nodes.push(next);
  }
}

function upsertEdge(map, edge) {
  const index = map.edges.findIndex((item) => item.edgeId === edge.edgeId);
  const next = Object.assign({
    relationScope: 'internal',
    confidence: 'confirmed',
    fromFieldId: '',
    fromFieldLabel: '',
    toFieldId: '',
    toFieldLabel: '',
    evidence: [],
  }, edge);
  if (index >= 0) {
    map.edges[index] = Object.assign({}, map.edges[index], next);
  } else {
    map.edges.push(next);
  }
}

function getLabel(value) {
  return getI18nText(value) || '未命名';
}

function isFieldNode(node) {
  return Boolean(node && node.props && node.props.__category__ === 'form' && node.props.fieldId);
}

function extractFieldMeta(node, parentFieldId) {
  const props = node.props || {};
  const field = {
    fieldId: props.fieldId || '',
    fieldLabel: getLabel(props.label),
    componentType: node.componentName || 'Unknown',
    required: Boolean(props.required),
    behavior: props.behavior || 'NORMAL',
    parentFieldId: parentFieldId || '',
  };
  if (Array.isArray(props.dataSource) && props.dataSource.length) {
    field.options = props.dataSource.map((item) => item && item.value).filter(Boolean);
  }
  return field;
}

function collectFieldsFromSchema(schemaContent) {
  const fields = [];
  if (!schemaContent || !Array.isArray(schemaContent.pages) || !schemaContent.pages[0]) {
    return fields;
  }
  walkSchemaComponents(schemaContent.pages[0].componentsTree || [], (node, parentFieldId) => {
    if (!isFieldNode(node)) {return;}
    fields.push(extractFieldMeta(node, parentFieldId));
  }, '');
  return fields;
}

function extractPageSource(schemaContent) {
  if (!schemaContent || !Array.isArray(schemaContent.pages) || !schemaContent.pages[0]) {return '';}
  const page = schemaContent.pages[0];
  if (page.methods && page.methods.__initMethods__ && page.methods.__initMethods__.source) {
    return page.methods.__initMethods__.source;
  }
  return '';
}

function collectOpsFromSource(sourceCode) {
  const refs = collectRefsFromSource(sourceCode || '');
  const ops = {
    reads: [],
    writes: [],
    jumps: [],
    processes: refs.processCodes.slice(),
  };
  const constantGroups = {};
  const objectRegex = /(?:var|const)\s+(\w+)\s*=\s*\{([\s\S]*?)\};/g;
  let objectMatch;
  while ((objectMatch = objectRegex.exec(sourceCode || ''))) {
    const groupName = objectMatch[1];
    const body = objectMatch[2];
    const itemRegex = /(\w+)\s*:\s*['"]([^'"]+)['"]/g;
    let itemMatch;
    constantGroups[groupName] = constantGroups[groupName] || {};
    while ((itemMatch = itemRegex.exec(body))) {
      constantGroups[groupName][itemMatch[1]] = itemMatch[2];
    }
  }
  function resolveRef(expr) {
    const raw = String(expr || '').trim();
    if (/^['"]FORM-/.test(raw)) {return raw.replace(/^['"]|['"]$/g, '');}
    const refMatch = raw.match(/^(\w+)\.(\w+)$/);
    if (refMatch) {
      const group = constantGroups[refMatch[1]] || {};
      return group[refMatch[2]] || '';
    }
    return '';
  }
  const readRegex = /(searchFormDatas|getFormDataById)\s*\([\s\S]*?formUuid\s*:\s*([^,\n\r}]+)/g;
  const writeRegex = /(saveFormData)\s*\([\s\S]*?formUuid\s*:\s*([^,\n\r}]+)/g;
  const jumpRegex = /openPage\([\s\S]*?(FORM-[A-Z0-9]+|\w+\.\w+)[\s\S]*?\)/g;
  let match;
  while ((match = readRegex.exec(sourceCode || ''))) {
    const formUuid = resolveRef(match[2]);
    if (formUuid) {ops.reads.push({ operation: match[1], formUuid });}
  }
  while ((match = writeRegex.exec(sourceCode || ''))) {
    const formUuid = resolveRef(match[2]);
    if (formUuid) {ops.writes.push({ operation: match[1], formUuid });}
  }
  while ((match = jumpRegex.exec(sourceCode || ''))) {
    const pageId = resolveRef(match[1]);
    if (pageId) {ops.jumps.push({ pageId });}
  }
  return ops;
}

function walkFiles(dirPath, collector) {
  if (!fs.existsSync(dirPath)) {return;}
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  entries.forEach((entry) => {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, collector);
      return;
    }
    collector(fullPath);
  });
}

function scanLocalPageSources(projectRoot, appType) {
  const pageDir = path.join(projectRoot, 'pages', 'src');
  const result = {};
  walkFiles(pageDir, (filePath) => {
    if (!filePath.endsWith('.js')) {return;}
    const content = fs.readFileSync(filePath, 'utf8');
    const matches = Array.from(new Set(content.match(/FORM-[A-Z0-9]+/g) || []));
    matches.forEach((formUuid) => {
      if (!result[formUuid] || content.includes('/' + appType + '/custom/' + formUuid)) {
        result[formUuid] = {
          sourceFile: path.relative(projectRoot, filePath),
          sourceCode: content,
        };
      }
    });
  });
  return result;
}

module.exports = {
  now,
  findProjectRoot,
  getMapDir,
  getMapPath,
  createEmptyMap,
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
};

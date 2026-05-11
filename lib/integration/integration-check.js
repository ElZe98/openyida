'use strict';

const { loadCookieData, triggerLogin, resolveBaseUrl } = require('../core/utils');
const { listLogicflows, listFormLogicflows, listLogicflowLogs } = require('./integration-api');
const { banner, info, warn, success, usage } = require('../core/chalk');

const LOG_STATUS = {
  success: '3',
  exception: '2',
  running: '0',
};

const DEFAULT_FLOW_TYPES = ['1', '2', '3', '5', '6'];

function createProgressReporter(enabled) {
  if (!enabled) {
    return {
      update() {},
      finish() {},
    };
  }

  let lastLength = 0;
  return {
    update(message) {
      const line = `  ${message}`;
      const padding = lastLength > line.length ? ' '.repeat(lastLength - line.length) : '';
      process.stderr.write(`\r${line}${padding}`);
      lastLength = line.length;
    },
    finish() {
      if (lastLength > 0) {
        process.stderr.write('\n');
        lastLength = 0;
      }
    },
  };
}

function truncateText(text, maxLength) {
  const value = String(text || '');
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength - 3)}...`;
}

function parseFlag(args, flagName) {
  const index = args.indexOf(flagName);
  if (index !== -1 && args[index + 1] && !args[index + 1].startsWith('--')) {
    return args[index + 1];
  }
  return null;
}

function hasFlag(args, flagName) {
  return args.includes(flagName);
}

function normalizeLogStatus(value) {
  if (!value || value === 'exception') {
    return LOG_STATUS.exception;
  }
  if (value === 'success') {
    return LOG_STATUS.success;
  }
  if (value === 'running') {
    return LOG_STATUS.running;
  }
  if (['0', '2', '3'].includes(String(value))) {
    return String(value);
  }
  throw new Error(`不支持的日志状态：${value}。可选值：exception/success/running/0/2/3`);
}

function buildAuthRef() {
  let cookieData = loadCookieData();
  return Promise.resolve(cookieData || triggerLogin()).then((resolvedCookieData) => ({
    csrfToken: resolvedCookieData.csrf_token,
    cookies: resolvedCookieData.cookies,
    baseUrl: resolveBaseUrl(resolvedCookieData),
    cookieData: resolvedCookieData,
  }));
}

function appendFlow(result, group, flow) {
  if (!flow || !flow.processCode || result.seenProcessCodes.has(flow.processCode)) {
    return;
  }
  result.seenProcessCodes.add(flow.processCode);
  result.flows.push({
    appType: result.appType,
    formUuid: flow.formUuid || group.formUuid || '',
    formTitle: group.formTitle || flow.formTitle || '',
    formType: group.formType || flow.formType || '',
    name: flow.name || '',
    processCode: flow.processCode,
    status: flow.status || '',
    eventName: flow.eventName || '',
    eventType: flow.eventType || group.eventType || null,
    executeByOrder: flow.executeByOrder,
    gmtModified: flow.gmtModified || '',
    lastAction: flow.lastAction || '',
    modifier: flow.modifier || '',
  });
}

function collectFlowsFromListResponse(result, response) {
  const groups = response.data || [];
  for (const item of groups) {
    if (Array.isArray(item.flowList)) {
      for (const flow of item.flowList) {
        appendFlow(result, item, flow);
      }
    } else {
      appendFlow(result, {}, item);
    }
  }
}

async function listAllFlowsForForm(authRef, appType, formUuid, baseGroup, options = {}) {
  const pageSize = options.pageSize || 10;
  const type = options.type || '1';
  const flows = {
    appType,
    flows: [],
    seenProcessCodes: new Set(),
  };
  let pageIndex = 1;
  let totalCount = null;

  do {
    const response = await listFormLogicflows(authRef, {
      appType,
      formUuid,
      type,
      pageIndex,
      pageSize,
    });
    collectFlowsFromListResponse(flows, response);
    totalCount = response.totalCount || totalCount;
    pageIndex++;
  } while (totalCount && (pageIndex - 1) * pageSize < totalCount);

  return flows.flows.map((flow) => ({
    ...flow,
    formTitle: flow.formTitle || baseGroup.formTitle || '',
    formType: flow.formType || baseGroup.formType || '',
  }));
}

async function listAllLogicflows(authRef, appType, options = {}) {
  const pageSize = options.pageSize || 10;
  const flowTypes = options.flowTypes || DEFAULT_FLOW_TYPES;
  const result = {
    appType,
    flows: [],
    seenProcessCodes: new Set(),
  };

  for (const type of flowTypes) {
    const groupsWithMore = [];
    let pageIndex = 1;
    let totalCount = null;

    do {
      const response = await listLogicflows(authRef, {
        appType,
        type,
        pageIndex,
        pageSize,
      });
      collectFlowsFromListResponse(result, response);
      for (const group of response.data || []) {
        if (group && group.formUuid && group.hasMore) {
          groupsWithMore.push(group);
        }
      }
      totalCount = response.totalCount || totalCount;
      pageIndex++;
    } while (totalCount && (pageIndex - 1) * pageSize < totalCount);

    for (const group of groupsWithMore) {
      const formFlows = await listAllFlowsForForm(authRef, appType, group.formUuid, group, { pageSize, type });
      for (const flow of formFlows) {
        appendFlow(result, group, flow);
      }
    }
  }

  return result.flows;
}

async function collectAbnormalFlows(authRef, appType, options = {}) {
  const status = normalizeLogStatus(options.status || 'exception');
  const logPageSize = options.logPageSize || 10;
  const maxLogPages = options.maxLogPages || 1;
  const flows = await listAllLogicflows(authRef, appType, {
    pageSize: 10,
    flowTypes: options.flowTypes || DEFAULT_FLOW_TYPES,
  });
  if (options.onProgress) {
    options.onProgress({ appType, phase: 'logs', current: 0, total: flows.length });
  }
  const abnormalFlows = [];

  for (let index = 0; index < flows.length; index++) {
    const flow = flows[index];
    const logs = [];
    let totalCount = 0;
    for (let pageIndex = 1; pageIndex <= maxLogPages; pageIndex++) {
      const logResponse = await listLogicflowLogs(authRef, {
        appType,
        processCode: flow.processCode,
        status,
        pageIndex,
        pageSize: logPageSize,
      });
      totalCount = logResponse.totalCount || totalCount;
      logs.push(...(logResponse.data || []));
      if (!totalCount || pageIndex * logPageSize >= totalCount) {
        break;
      }
    }
    if (totalCount > 0 || logs.length > 0) {
      abnormalFlows.push({
        ...flow,
        abnormalLogCount: totalCount || logs.length,
        logs,
      });
    }
    if (options.onProgress) {
      options.onProgress({
        appType,
        phase: 'logs',
        current: index + 1,
        total: flows.length,
        flow,
      });
    }
  }

  return {
    appType,
    totalFlows: flows.length,
    abnormalFlows,
  };
}

function printTextResult(result) {
  success(`检查完成：${result.checkedApps.length} 个应用，${result.totalFlows} 条自动化，${result.abnormalFlows.length} 条存在异常日志`);
  if (result.errors.length) {
    warn(`有 ${result.errors.length} 个应用检查失败，详见 JSON 输出或错误摘要。`);
  }
  if (!result.abnormalFlows.length) {
    info('未发现执行异常日志。');
    return;
  }
  for (const flow of result.abnormalFlows) {
    console.log([
      flow.appType,
      flow.formTitle || flow.formUuid || '-',
      flow.name || '-',
      flow.processCode,
      `异常日志 ${flow.abnormalLogCount}`,
    ].join('\t'));
    for (const log of flow.logs || []) {
      console.log([
        '',
        log.procInstId || '-',
        log.formInstId || '-',
        log.exceptionEntity || '-',
        log.finishDate || log.finishTime || log.createDate || '-',
      ].join('\t'));
    }
  }
}

async function run(args) {
  if (!args.length || hasFlag(args, '--help') || hasFlag(args, '-h')) {
    usage(
      'openyida integration check <appType...> [--json] [--no-progress] [--flow-types 1,2,3,5,6] [--log-page-size 10] [--max-log-pages 1]',
      'openyida integration check APP_XXX --json'
    );
    process.exit(0);
  }

  const outputJson = hasFlag(args, '--json');
  const logPageSize = Number(parseFlag(args, '--log-page-size') || 10);
  const maxLogPages = Number(parseFlag(args, '--max-log-pages') || 1);
  const status = normalizeLogStatus(parseFlag(args, '--status') || 'exception');
  const flowTypes = (parseFlag(args, '--flow-types') || DEFAULT_FLOW_TYPES.join(','))
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  const appTypes = args.filter((arg, index) => {
    if (arg.startsWith('--')) {
      return false;
    }
    const previous = args[index - 1];
    return !previous || !previous.startsWith('--');
  });

  if (!appTypes.length) {
    throw new Error('缺少 appType。用法：openyida integration check <appType...>');
  }

  if (!outputJson) {
    banner('检查集成自动化异常日志', { subtitle: `执行状态筛选：${status}` });
  }

  const authRef = await buildAuthRef();
  const progress = createProgressReporter(!hasFlag(args, '--no-progress'));
  const result = {
    checkedApps: appTypes,
    totalFlows: 0,
    abnormalFlows: [],
    errors: [],
  };

  for (const appType of appTypes) {
    try {
      if (!outputJson) {
        info(`检查应用：${appType}`);
      }
      const appResult = await collectAbnormalFlows(authRef, appType, {
        status,
        logPageSize,
        maxLogPages,
        flowTypes,
        onProgress: ({ current, total, flow }) => {
          if (current !== 0 && current !== total && current % 5 !== 0) {
            return;
          }
          const suffix = flow && flow.name ? `，当前：${truncateText(flow.name, 32)}` : '';
          progress.update(`检查进度 ${current}/${total}${suffix}`);
        },
      });
      progress.finish();
      result.totalFlows += appResult.totalFlows;
      result.abnormalFlows.push(...appResult.abnormalFlows);
    } catch (error) {
      progress.finish();
      result.errors.push({ appType, message: error.message });
    }
  }

  if (outputJson) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  printTextResult(result);
  if (result.errors.length) {
    process.exitCode = 1;
  }
}

module.exports = {
  LOG_STATUS,
  DEFAULT_FLOW_TYPES,
  normalizeLogStatus,
  collectFlowsFromListResponse,
  listAllLogicflows,
  collectAbnormalFlows,
  run,
};

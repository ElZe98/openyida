'use strict';

const {
  normalizeLogStatus,
  collectFlowsFromListResponse,
} = require('../lib/integration/integration-check');

describe('integration check', () => {
  test('normalizeLogStatus maps frontend log status aliases', () => {
    expect(normalizeLogStatus()).toBe('2');
    expect(normalizeLogStatus('exception')).toBe('2');
    expect(normalizeLogStatus('success')).toBe('3');
    expect(normalizeLogStatus('running')).toBe('0');
    expect(normalizeLogStatus('2')).toBe('2');
    expect(() => normalizeLogStatus('bad')).toThrow('不支持的日志状态');
  });

  test('collectFlowsFromListResponse flattens grouped flowList items and deduplicates processCode', () => {
    const result = {
      appType: 'APP_TEST',
      flows: [],
      seenProcessCodes: new Set(),
    };

    collectFlowsFromListResponse(result, {
      data: [
        {
          formUuid: 'FORM-A',
          formTitle: '表单A',
          formType: 'receipt',
          flowList: [
            { name: '异常同步', processCode: 'LPROC-A', status: 'y', eventName: '表单创建成功' },
            { name: '异常同步重复', processCode: 'LPROC-A', status: 'y' },
          ],
        },
        { formUuid: 'FORM-B', name: '平铺自动化', processCode: 'LPROC-B', status: 'n' },
      ],
    });

    expect(result.flows).toHaveLength(2);
    expect(result.flows[0]).toMatchObject({
      appType: 'APP_TEST',
      formUuid: 'FORM-A',
      formTitle: '表单A',
      name: '异常同步',
      processCode: 'LPROC-A',
    });
    expect(result.flows[1]).toMatchObject({
      formUuid: 'FORM-B',
      name: '平铺自动化',
      processCode: 'LPROC-B',
    });
  });
});

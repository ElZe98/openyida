'use strict';

jest.mock('../lib/core/utils', () => ({
  httpGet: jest.fn(),
  httpPost: jest.fn(),
  requestWithAutoLogin: jest.fn((fn, authRef) => fn(authRef)),
}));

const { httpGet } = require('../lib/core/utils');
const { listFormLogicflows, listLogicflowLogs } = require('../lib/integration/integration-api');

describe('integration api', () => {
  beforeEach(() => {
    httpGet.mockReset();
  });

  test('listLogicflowLogs sends the frontend status filter for exception logs', async () => {
    httpGet.mockResolvedValue({
      success: true,
      content: {
        currentPage: 1,
        data: [{ procInstId: 'PROC-1', status: 2, exceptionEntity: 'failed' }],
        totalCount: 1,
      },
    });

    const result = await listLogicflowLogs({
      baseUrl: 'https://example.com',
      csrfToken: 'csrf-token',
      cookies: [],
    }, {
      appType: 'APP_TEST',
      processCode: 'LPROC-TEST',
      status: 2,
      pageIndex: 1,
      pageSize: 10,
    });

    expect(result.totalCount).toBe(1);
    expect(httpGet).toHaveBeenCalledTimes(1);
    const [, path,,, options] = httpGet.mock.calls[0];
    expect(path).toContain('/alibaba/web/APP_TEST/query/formLogicflowBinding/listLog.json?');
    expect(path).toContain('_api=Connector.listLog');
    expect(path).toContain('processCode=LPROC-TEST');
    expect(path).toContain('status=2');
    expect(path).toContain('dateType=modifyTime');
    expect(options).toEqual({ silentStatus: true });
  });

  test('listFormLogicflows uses the form binding endpoint for grouped load-more flows', async () => {
    httpGet.mockResolvedValue({
      success: true,
      content: {
        currentPage: 1,
        data: [{ name: 'flow', processCode: 'LPROC-A' }],
        totalCount: 1,
      },
    });

    await listFormLogicflows({
      baseUrl: 'https://example.com',
      csrfToken: 'csrf-token',
      cookies: [],
    }, {
      appType: 'APP_TEST',
      formUuid: 'FORM_TEST',
      type: '1',
    });

    const [, path,,, options] = httpGet.mock.calls[0];
    expect(path).toContain('/alibaba/web/APP_TEST/query/formLogicflowBinding/listflow.json?');
    expect(path).toContain('_api=Connector.getTriggerList');
    expect(path).toContain('formUuid=FORM_TEST');
    expect(options).toEqual({ silentStatus: true });
  });
});

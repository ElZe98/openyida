'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

// ── compile run() 行为测试 ────────────────────────────────────────────

describe('compile run() 行为', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yida-compile-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('源文件不存在时，process.exit(1) 被调用', async () => {
    const { run } = require('../lib/app/compile');
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });

    await expect(run([path.join(tmpDir, 'non-existent.js')])).rejects.toThrow('process.exit called');
    expect(mockExit).toHaveBeenCalledWith(1);

    mockExit.mockRestore();
  });

  test('未传参数时，process.exit(1) 被调用', async () => {
    const { run } = require('../lib/app/compile');
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });

    await expect(run([])).rejects.toThrow('process.exit called');
    expect(mockExit).toHaveBeenCalledWith(1);

    mockExit.mockRestore();
  });

  test('有效 JSX 源文件编译成功，产物写入 dist 目录', async () => {
    const { compileSource } = require('../lib/app/publish');

    // 准备一个合法的宜搭自定义页面源文件
    const sourceContent = `
const _customState = { count: 0 };

export function getCustomState(key) {
  if (key) return _customState[key];
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

export function didMount() {}

export function didUnmount() {}

export function renderJsx() {
  return (
    <div>
      <div style={{ display: 'none' }}>{this.state.timestamp}</div>
      <span>Hello</span>
    </div>
  );
}
`;
    const sourceFile = path.join(tmpDir, 'demo.js');
    fs.writeFileSync(sourceFile, sourceContent, 'utf-8');

    // 直接调用 compileSource，产物路径由其返回值提供
    const { compiledPath, compiledCode } = compileSource(sourceFile);

    expect(fs.existsSync(compiledPath)).toBe(true);
    expect(compiledCode.length).toBeGreaterThan(0);
    // 编译产物不应包含 JSX 语法
    expect(compiledCode).not.toContain('<div>');
  });

  test('含语法错误的源文件编译失败，process.exit(1) 被调用', async () => {
    const { run } = require('../lib/app/compile');

    const invalidSource = `
export function renderJsx() {
  return <div unclosed;
}
`;
    const sourceFile = path.join(tmpDir, 'invalid.js');
    fs.writeFileSync(sourceFile, invalidSource, 'utf-8');

    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });

    const utils = require('../lib/core/utils');
    const originalFindProjectRoot = utils.findProjectRoot;
    utils.findProjectRoot = () => tmpDir;

    await expect(run([sourceFile])).rejects.toThrow('process.exit called');
    expect(mockExit).toHaveBeenCalledWith(1);

    utils.findProjectRoot = originalFindProjectRoot;
    mockExit.mockRestore();
  });
});

// ── compileSource 导出测试 ────────────────────────────────────────────

describe('publish.compileSource 导出', () => {
  test('compileSource 已从 publish.js 正确导出', () => {
    const { compileSource } = require('../lib/app/publish');
    expect(typeof compileSource).toBe('function');
  });
});

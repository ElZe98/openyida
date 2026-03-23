# JSX 编译错误自查清单

> **遇到 JSX 编译错误时，按以下顺序逐项排查**，90% 的编译错误都由以下原因引起：

## 🔴 第 1 优先级：禁止使用的语法（绝对红线）

| 语法 | 错误代码 | 正确代码 | 说明 |
|------|---------|---------|------|
| ❌ 类属性声明 | `class App { state = {} }` | 必须使用 `_customState` 全局变量 | Babel 编译不过 |
| ❌ Class Fields 语法 | `count = 0` | `var count = 0` | React 16 不支持 |
| ❌ `import` 语句 | `import React from 'react'` | 禁止使用 import | 三方包引入需用 `loadScript` |
| ❌ `export default` | `export default function` | 使用 `export function` | export default 编译后无法正确挂载 |
| ❌ Optional Chaining | `obj?.prop` | `obj && obj.prop` | 部分版本 Babel 不支持 |
| ❌ Nullish Coalescing | `a ?? b` | `a !== null ? a : b` | 同上 |
| ❌ 装饰器语法 | `@decorator class X` | 禁止使用装饰器 | 需要额外 Babel 插件 |

## 🟡 第 2 优先级：极易出错的地方

### 2.1 事件绑定（最容易出错）

```javascript
// ❌ 错误：直接传方法引用，this 丢失
<button onClick={this.handleClick}>点击</button>

// ❌ 错误：使用 .bind()，不符合规范
<button onClick={function() { this.handleClick(); }.bind(this)}>点击</button>

// ✅ 正确：箭头函数包裹
<button onClick={(e) => { this.handleClick(e); }}>点击</button>

// ✅ 正确：如果是简单调用（仅修改状态）
<button onClick={() => { this.setCustomState({ count: 1 }); }}>点击</button>
```

### 2.2 JSX 中的 style 属性

```javascript
// ❌ 错误：CSS 属性名使用 kebab-case
<div style={{ "background-color": "red" }}></div>

// ❌ 错误：数字值未加引号
<div style={{ width: 100 }}></div>  // 会变成 "100px" 但某些情况有问题

// ✅ 正确：JS 写法（camelCase + 字符串值）
<div style={{ backgroundColor: 'red', width: '100%' }}></div>

// ✅ 正确：带单位用字符串
<div style={{ padding: '12px', marginTop: '8px' }}></div>
```

### 2.3 箭头函数 vs 普通函数

```javascript
// ❌ 错误：在需要 this 的地方用箭头函数
const handleClick = () => {
  this.utils.toast({ title: 'hi' });  // this 丢失
};

// ✅ 正确：需要 this 的方法必须用 export function
export function handleClick() {
  this.utils.toast({ title: 'hi' });
}
```

## 🟢 第 3 优先级：常见小问题

### 3.1 标签必须闭合

```javascript
// ❌ 错误：自闭合标签缺少斜线
<input type="text">
<br>

// ✅ 正确
<input type="text" />
<br />
```

### 3.2 className 而非 class

```javascript
// ❌ 错误
<div class="container">...</div>

// ✅ 正确
<div className="container">...</div>
```

### 3.3 注释语法

```javascript
// ✅ JSX 内只能使用这种注释
<div>
  {/* 这是注释 */}
  <span>内容</span>
</div>

// ❌ 不要用 HTML 注释（可能编译出错）
// <div>...</div>
```

### 3.4 三元表达式陷阱

```javascript
// ❌ 错误：三元表达式返回 null/undefined 可能导致白屏
{condition && null}  // 某些情况下编译有问题

// ✅ 正确：确保返回有效 JSX
{condition && <div>内容</div>}

// ✅ 更好：显式处理
{condition ? <div>内容</div> : <span />}
```

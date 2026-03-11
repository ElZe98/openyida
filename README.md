# OpenYiDA — AI-Powered Yida Application Development

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/openyida/openyida)](https://github.com/openyida/openyida/stargazers)

Build production-ready Yida applications using natural language with Claude Code and AI coding tools. Fully automated from creation to deployment with data persistence support.

## Overview

OpenYiDA provides a complete skill-based framework for developing Yida (宜搭) applications through AI-driven automation. Describe your application in plain language, and the system handles everything from scaffolding to deployment.

**Key Features:**

- **Fully Automated** — From app creation to deployment in minutes
- **Data Persistence** — Built-in form and storage support
- **Customizable** — Full access to generated source code for further development
- **Production-Ready** — Enterprise-grade Yida platform integration

## Prerequisites

| Dependency | Version | Purpose |
|------------|---------|---------|
| Node.js | 20+ | JSX compilation & publish pipeline |
| Python | 3.12+ | Login automation (Playwright) |
| playwright | latest | QR authentication & session management |

```bash
# Install Python dependencies
pip install playwright && playwright install chromium

# Install Node dependencies
cd .claude/skills/yida-publish/scripts && npm install
```

## Quick Start

Describe your application need in natural language:

```
Create a personal salary calculator app for me
```

The AI will execute the complete workflow:

```
Create App → Verify Login → Create Page → Analyze Requirements → Generate Code → Deploy
```

> **Note:** For Alibaba Group Yida environment, update the domain in `config.json`: `https://yida-group.alibaba-inc.com`

---

## Demo Applications

### 💰 Personal Salary Calculator

A comprehensive salary calculation tool with tax optimization.

- 🔗 [Live Demo](https://ding.aliwork.com/APP_ICUBVUPDEJ3MIFJ0701X/custom/FORM-5776BEF941604870A814608C4CE0D23C146W?isRenderNav=false&corpid=ding9a0954b4f9d9d40ef5bf40eda33b7ba0)

![Salary Calculator](https://gw.alicdn.com/imgextra/i2/O1CN017TeJuE1reVH2Dj7b7_!!6000000005656-2-tps-5114-2468.png)

---

### 🌐 Enterprise Landing Page

AI-generated product showcase with responsive design.

- 🔗 [Live Demo](https://ding.aliwork.com/s/63E1E?isRenderNav=false&corpid=ding8196cd9a2b2405da24f2f5cc6abecb85&ddtab=true)

![Smart Collaboration](https://gw.alicdn.com/imgextra/i1/O1CN01EZtvfs1cxXV00UaXi_!!6000000003667-2-tps-5118-2470.png)

---

### 🏮 Interactive Lantern Riddles

AI-powered game with automatic riddle image generation via Yida × DEAP integration.

- 🔗 [Live Demo](https://ding.aliwork.com/s/93ED6?isRenderNav=false&corpid=ding8196cd9a2b2405da24f2f5cc6abecb85)

![Lantern Riddles](https://img.alicdn.com/imgextra/i3/O1CN01dCoscP25jSAtAB9o3_!!6000000007562-2-tps-2144-1156.png)

---

### 🎂 Birthday Wishes Game

Interactive celebration tool with confetti effects and personalized cards.

- 🔗 [Live Demo](https://ding.aliwork.com/s/0D49?corpid=ding8196cd9a2b2405da24f2f5cc6abecb85&isRenderNav=false)

---

## Skill Package

The framework includes modular skills for different aspects of Yida development:

| Skill | Description |
|-------|-------------|
| **`yida-app`** | Main orchestration — coordinates the full development pipeline |
| **`yida-login`** | Session management with QR authentication and cookie persistence |
| **`yida-logout`** | Clear authentication session |
| **`yida-create-app`** | Initialize new Yida application |
| **`yida-create-page`** | Create custom display pages |
| **`yida-create-form-page`** | Form page builder with 18 field types |
| **`yida-custom-page`** | JSX development guide with API reference |
| **`yida-publish`** | Compile and deploy to Yida platform |
| **`get-schema`** | Extract existing form schema for analysis |

### Workflow

```
yida-app (orchestrator)
  ├── yida-login ─────── Authentication & session handling
  ├── yida-create-app ── Application initialization
  ├── yida-create-page ─ Page scaffolding
  ├── yida-custom-page ─ Code generation
  └── yida-publish ───── Build & deployment
```

---

## Project Structure

```
openyida/
├── src/                           # Application source code
│   ├── salary-calculator.js       # Salary calculator
│   ├── salary-calculator.compile.js
│   ├── demo.js                   # Lantern riddles game
│   ├── demo.compile.js
│   ├── birthday-game.js          # Birthday wishes
│   └── birthday-game.compile.js
├── RD/                            # Requirements & specifications
├── .claude/skills/               # AI skill package
│   ├── yida-app/
│   ├── yida-login/
│   ├── yida-logout/
│   ├── yida-create-app/
│   ├── yida-create-page/
│   ├── yida-create-form-page/
│   ├── yida-custom-page/
│   ├── yida-publish/
│   └── get-schema/
├── config.json
└── LICENSE
```

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Contributors

<a href="https://github.com/openyida/openyida/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=openyida/openyida" />
</a>

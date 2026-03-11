# Build Yida Apps Fast with Claude Code

> Stable, supports data storage, can be customized after generation 🚀

## Introduction

This project demonstrates how to use **Claude Code** and other AI coding tools to automatically create, develop, and deploy Yida applications through natural language descriptions - no manual operation on the Yida platform required.

## Environment

| Dependency | Version | Purpose |
| --- | --- | --- |
| Node.js | 20+ | JSX compilation & publish scripts |
| Python | 3.12+ | Login management (Playwright) |
| playwright | latest | QR login & Cookie persistence |

```bash
# Install Python dependencies
pip install playwright && playwright install chromium

# Install Node dependencies
cd .claude/skills/yida-publish/scripts && npm install
```

## Quick Start

Just one sentence, and AI will automatically build the application:

```
Create a personal salary calculator app for me
```

AI will automatically execute:

```
Create App → Check Login → Create Page → Analyze Requirements → Write Code → Publish
```

**For Group Yida, update the domain in config.json**: `https://yida-group.alibaba-inc.com`

---

## Demo Showcase

### 💰 Tool - Personal Salary Calculator

- 🔗 [Try it](https://ding.aliwork.com/APP_ICUBVUPDEJ3MIFJ0701X/custom/FORM-5776BEF941604870A814608C4CE0D23C146W?isRenderNav=false&corpid=ding9a0954b4f9d9d40ef5bf40eda33b7ba0)

![Salary Calculator](https://gw.alicdn.com/imgextra/i2/O1CN017TeJuE1reVH2Dj7b7_!!6000000005656-2-tps-5114-2468.png)

---

### 🌐 Landing Page - Smart Collaboration

Enterprise product showcase page, generate a complete Landing Page with one sentence.

- 🔗 [Try it](https://ding.aliwork.com/s/63E1E?isRenderNav=false&corpid=ding8196cd9a2b2405da24f2f5cc6abecb85&ddtab=true)

![Smart Collaboration](https://gw.alicdn.com/imgextra/i1/O1CN01EZtvfs1cxXV00UaXi_!!6000000003667-2-tps-5118-2470.png)

---

### 🏮 Event - Lantern Riddles

AI generates lantern riddle images, users guess answers, get humorous AI hints on wrong guesses.

- **Highlight**: Yida × DEAP integration, call Yida form API to trigger backend AI image generation
- 🔗 [Try it](https://ding.aliwork.com/s/93ED6?isRenderNav=false&corpid=ding8196cd9a2b2405da24f2f5cc6abecb85)

![Lantern Riddles](https://img.alicdn.com/imgextra/i3/O1CN01dCoscP25jSAtAB9o3_!!6000000007562-2-tps-2144-1156.png)

---

### 🎂 Organizational Care - Birthday Wishes Game

Click to blow out candles, make a wish, send a personalized birthday card.

- **How to play**: Enter birthday person's name → click to blow out all candles within 15 seconds → write a blessing → confetti celebration
- 🔗 [Try it](https://ding.aliwork.com/s/0D49?corpid=ding8196cd9a2b2405da24f2f5cc6abecb85&isRenderNav=false)

---

## Yida-AI-Skill Package

This project provides a complete Yida development skill package that can be fully automated with local AI coding tools:

| Skill | Description |
| --- | --- |
| **`yida-app`** | Complete app development workflow orchestration (main entry) |
| **`yida-login`** | Login management (Cookie persistence + QR login) |
| **`yida-logout`** | Logout, clear Cookie cache |
| **`yida-create-app`** | Create Yida app, get appType |
| **`yida-create-page`** | Create custom display page, get pageId |
| **`yida-create-form-page`** | Create form page, supports 18 field types |
| **`yida-custom-page`** | Custom page JSX development guide & API reference |
| **`yida-publish`** | Compile JSX source and publish to Yida |
| **`get-schema`** | Get complete Schema structure of existing forms |

### Skill Collaboration Flow

```
yida-app (orchestration)
  ├── yida-login ─────── Login check & QR login
  ├── yida-create-app ── Create app → appType
  ├── yida-create-page ─ Create page → formUuid
  ├── y JSX guideida-custom-page ─ & API
  └── yida-publish ───── Babel compile → Schema build → Publish
```

---

## Project Structure

```
openyida/
├── src/                                 # Page source code
│   ├── salary-calculator.js             # 💰 Personal salary calculator
│   ├── salary-calculator.compile.js     #    └─ Compiled output
│   ├── demo.js                          # 🏮 Lantern riddles
│   ├── demo.compile.js                  #    └─ Compiled output
│   ├── birthday-game.js                 # 🎂 Birthday wishes game
│   └── birthday-game.compile.js         #    └─ Compiled output
├── RD/                                  # Requirements docs
│   ├── salary-calculator.md             # 💰 Salary calculator requirements & config
│   ├── birthday-game.md                 # 🎂 Birthday game requirements & config
│   └── GLR.md                           # 🏮 Lantern riddles requirements & config
└── .claude/skills/                      # Yida-AI-Skill package
    ├── yida-app/                        #   Complete workflow orchestration
    ├── yida-login/                      #   Login management
    ├── yida-logout/                     #   Logout
    ├── yida-create-app/                 #   Create app
    ├── yida-create-page/                #   Create custom page
    ├── yida-create-form-page/           #   Create form page
    ├── yida-custom-page/                #   JSX guide
    ├── yida-publish/                    #   Compile & publish
    └── get-schema/                      #   Get form Schema
```

---

## Contributing

Contributions welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) to learn how to contribute.

## License

MIT License - See [LICENSE](LICENSE)

---

## Contributors

<a href="https://github.com/openyida/openyida/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=openyida/openyida" />
</a>

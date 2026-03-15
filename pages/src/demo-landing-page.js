// ============================================================
// 智联协同 - SaaS产品官网落地页
// ============================================================

var EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

// ============================================================
// 状态管理
// ============================================================

var _customState = {
  scrolled: false,
  mobileMenuOpen: false,
  heroEmail: "",
  heroEmailValid: false,
  heroSubmitted: false,
  heroSubmitting: false,
  activeTestimonial: 0,
  activeDemo: 0,
  billingAnnual: true,
  ctaEmail: "",
  ctaEmailValid: false,
  ctaSubmitted: false,
  ctaSubmitting: false,
  visibleSections: {},
};

export function getCustomState(key) {
  if (key) {
    return _customState[key];
  }
  return Object.assign({}, _customState);
}

export function setCustomState(newState) {
  Object.keys(newState).forEach(function (key) {
    _customState[key] = newState[key];
  });
  this.forceUpdate();
}

export function forceUpdate() {
  this.setState({ timestamp: new Date().getTime() });
}

// ============================================================
// 生命周期
// ============================================================

export function didMount() {
  var self = this;

  // 滚动监听：导航栏变色 + fade-up 动效
  self._scrollHandler = function () {
    var shouldBeScrolled = window.scrollY > 60;
    if (shouldBeScrolled !== _customState.scrolled) {
      _customState.scrolled = shouldBeScrolled;
      self.forceUpdate();
    }
    // 滚动 fade-up 检测
    var sections = document.querySelectorAll("[data-animate]");
    var changed = false;
    for (var i = 0; i < sections.length; i++) {
      var sectionId = sections[i].getAttribute("data-animate");
      var rect = sections[i].getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.85 && !_customState.visibleSections[sectionId]) {
        _customState.visibleSections[sectionId] = true;
        changed = true;
      }
    }
    if (changed) {
      self.forceUpdate();
    }
  };
  window.addEventListener("scroll", self._scrollHandler);

  // 客户评价自动轮播
  self._testimonialTimer = setInterval(function () {
    _customState.activeTestimonial = (_customState.activeTestimonial + 1) % 3;
    self.forceUpdate();
  }, 5000);

  // 初始触发一次滚动检测
  setTimeout(function () {
    self._scrollHandler();
  }, 100);
}

export function didUnmount() {
  if (this._scrollHandler) {
    window.removeEventListener("scroll", this._scrollHandler);
  }
  if (this._testimonialTimer) {
    clearInterval(this._testimonialTimer);
  }
}

// ============================================================
// 业务方法
// ============================================================

export function handleHeroSubmit() {
  var self = this;
  if (!_customState.heroEmailValid || _customState.heroSubmitting) return;
  self.setCustomState({ heroSubmitting: true });
  setTimeout(function () {
    self.setCustomState({ heroSubmitting: false, heroSubmitted: true });
  }, 1500);
}

export function handleCtaSubmit() {
  var self = this;
  if (!_customState.ctaEmailValid || _customState.ctaSubmitting) return;
  self.setCustomState({ ctaSubmitting: true });
  setTimeout(function () {
    self.setCustomState({ ctaSubmitting: false, ctaSubmitted: true });
  }, 1500);
}

export function scrollToSection(sectionId) {
  var element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: "smooth" });
  }
  if (_customState.mobileMenuOpen) {
    this.setCustomState({ mobileMenuOpen: false });
  }
}

// ============================================================
// 渲染
// ============================================================

export function renderJsx() {
  var self = this;
  var timestamp = this.state.timestamp;
  var state = this.getCustomState();

  // ========== 全局样式 / 动画 ==========
  var globalCSS = "\n    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');\n\n    * { margin: 0; padding: 0; box-sizing: border-box; }\n    html { scroll-behavior: smooth; }\n    body { overflow-x: hidden; }\n\n    @keyframes fadeInUp {\n      from { opacity: 0; transform: translateY(40px); }\n      to { opacity: 1; transform: translateY(0); }\n    }\n    @keyframes fadeIn {\n      from { opacity: 0; }\n      to { opacity: 1; }\n    }\n    @keyframes float {\n      0%, 100% { transform: translateY(0px); }\n      50% { transform: translateY(-10px); }\n    }\n    @keyframes pulse {\n      0%, 100% { opacity: 0.4; transform: scale(1); }\n      50% { opacity: 0.8; transform: scale(1.1); }\n    }\n    @keyframes glow {\n      0%, 100% { box-shadow: 0 0 20px rgba(37,99,235,0.3); }\n      50% { box-shadow: 0 0 40px rgba(37,99,235,0.6); }\n    }\n    @keyframes slideDown {\n      from { opacity: 0; transform: translateY(-20px); }\n      to { opacity: 1; transform: translateY(0); }\n    }\n    @keyframes spin {\n      0% { transform: rotate(0deg); }\n      100% { transform: rotate(360deg); }\n    }\n    @keyframes particleFloat1 {\n      0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }\n      25% { transform: translate(100px, -50px) scale(1.2); opacity: 0.6; }\n      50% { transform: translate(50px, -100px) scale(0.8); opacity: 0.4; }\n      75% { transform: translate(-30px, -60px) scale(1.1); opacity: 0.5; }\n    }\n    @keyframes particleFloat2 {\n      0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.2; }\n      33% { transform: translate(-80px, -40px) scale(1.3); opacity: 0.5; }\n      66% { transform: translate(60px, -80px) scale(0.9); opacity: 0.3; }\n    }\n    @keyframes particleFloat3 {\n      0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.25; }\n      50% { transform: translate(40px, -120px) scale(1.15); opacity: 0.55; }\n    }\n\n    .nav-link:hover { opacity: 0.8; }\n    .feature-card:hover { transform: translateY(-8px); box-shadow: 0 20px 60px rgba(0,0,0,0.12) !important; }\n    .feature-card { transition: transform 0.3s ease, box-shadow 0.3s ease; }\n    .feature-icon-wrap:hover .feature-icon { transform: scale(1.1) rotate(5deg); }\n    .feature-icon { transition: transform 0.3s ease; }\n    .pricing-card:hover { transform: translateY(-4px); box-shadow: 0 20px 60px rgba(0,0,0,0.1) !important; }\n    .pricing-card { transition: transform 0.3s ease, box-shadow 0.3s ease; }\n    .footer-link:hover { color: #2563EB !important; }\n    .footer-link { transition: color 0.2s ease; }\n    .demo-tab:hover { background: rgba(37,99,235,0.08) !important; }\n    .logo-item:hover { filter: grayscale(0%) !important; opacity: 1 !important; }\n    .logo-item { transition: filter 0.3s ease, opacity 0.3s ease; }\n    .cta-btn:hover { transform: translateY(-2px); }\n    .cta-btn { transition: transform 0.2s ease; }\n\n    @media (max-width: 768px) {\n      .hide-mobile { display: none !important; }\n      .show-mobile { display: flex !important; }\n    }\n    @media (min-width: 769px) {\n      .show-mobile { display: none !important; }\n    }\n  ";

  // ========== 通用样式 ==========
  var fontFamily = "'Inter', 'PingFang SC', 'Microsoft YaHei', sans-serif";

  var sectionVisible = function (id) {
    return state.visibleSections[id];
  };

  var animStyle = function (id, delay) {
    return {
      opacity: sectionVisible(id) ? 1 : 0,
      transform: sectionVisible(id) ? "translateY(0)" : "translateY(40px)",
      transition: "opacity 0.7s ease " + (delay || 0) + "s, transform 0.7s ease " + (delay || 0) + "s",
    };
  };

  // ========== 数据 ==========
  var navLinks = [
    { label: "功能", target: "features" },
    { label: "案例", target: "testimonials" },
    { label: "定价", target: "pricing" },
  ];

  var trustStats = [
    { number: "10,000+", label: "团队信赖" },
    { number: "99.9%", label: "正常运行" },
    { number: "4.9/5", label: "用户评分" },
  ];

  var trustLogos = [
    { name: "阿里巴巴", abbr: "A" },
    { name: "腾讯", abbr: "T" },
    { name: "字节跳动", abbr: "B" },
    { name: "华为", abbr: "H" },
    { name: "小米", abbr: "M" },
    { name: "京东", abbr: "J" },
  ];

  var features = [
    {
      icon: "⚡",
      title: "实时协作",
      description: "多人同时编辑文档，所有更改实时同步。自动保存让你永不丢失工作进度，评论和反馈即时可见。",
      tags: ["多人编辑", "自动保存", "评论同步"],
    },
    {
      icon: "🧠",
      title: "智能任务",
      description: "AI 自动分析任务优先级，智能提醒截止日期。可视化进度看板让项目状态一目了然。",
      tags: ["AI优先级", "智能提醒", "进度可视"],
    },
    {
      icon: "🔗",
      title: "无缝集成",
      description: "一键连接 Slack、钉钉、飞书、GitHub 等 50+ 主流工具，打通团队工作流，告别信息孤岛。",
      tags: ["50+工具", "一键连接", "数据互通"],
    },
  ];

  var demoTabs = [
    {
      label: "任务看板",
      title: "可视化任务管理",
      description: "拖拽式看板让任务流转一目了然，支持自定义工作流、标签分类和多维度筛选，团队协作效率提升 300%。",
      highlights: ["拖拽排序", "自定义工作流", "多维筛选", "实时同步"],
    },
    {
      label: "文档协作",
      title: "实时多人文档编辑",
      description: "像 Google Docs 一样流畅的多人实时编辑体验，支持富文本、表格、代码块，内置版本历史和评论系统。",
      highlights: ["实时编辑", "版本历史", "评论批注", "模板库"],
    },
    {
      label: "数据分析",
      title: "智能数据洞察",
      description: "自动生成项目报表和团队效能分析，AI 驱动的数据洞察帮助管理者做出更明智的决策。",
      highlights: ["自动报表", "效能分析", "AI洞察", "导出分享"],
    },
  ];

  var testimonials = [
    {
      name: "张明",
      title: "CTO",
      company: "创新科技",
      rating: 5,
      text: "智联协同彻底改变了我们团队的工作方式。项目交付效率提升了 40%，跨部门沟通成本降低了 60%。这是我用过最好的协作工具。",
      avatar: "Z",
    },
    {
      name: "李婷",
      title: "产品总监",
      company: "未来互联",
      rating: 5,
      text: "智能任务分配功能太棒了！AI 能准确判断任务优先级，团队再也不用为排期争论。集成了我们所有常用工具，工作流无缝衔接。",
      avatar: "L",
    },
    {
      name: "王强",
      title: "研发经理",
      company: "数据云端",
      rating: 5,
      text: "从 Jira 迁移到智联协同后，团队满意度直线上升。界面简洁直观，上手零成本。实时协作功能让远程团队像坐在一起工作。",
      avatar: "W",
    },
  ];

  var pricingPlans = [
    {
      name: "基础版",
      monthlyPrice: "免费",
      annualPrice: "免费",
      description: "适合小团队起步",
      popular: false,
      features: [
        { text: "最多 5 名成员", included: true },
        { text: "基础任务管理", included: true },
        { text: "5GB 存储空间", included: true },
        { text: "社区支持", included: true },
        { text: "高级分析", included: false },
        { text: "自定义工作流", included: false },
        { text: "API 访问", included: false },
        { text: "专属客户经理", included: false },
      ],
      buttonText: "免费开始",
      buttonStyle: "outline",
    },
    {
      name: "专业版",
      monthlyPrice: "¥99",
      annualPrice: "¥79",
      description: "适合成长型团队",
      popular: true,
      features: [
        { text: "最多 50 名成员", included: true },
        { text: "高级任务管理", included: true },
        { text: "100GB 存储空间", included: true },
        { text: "优先邮件支持", included: true },
        { text: "高级分析", included: true },
        { text: "自定义工作流", included: true },
        { text: "API 访问", included: false },
        { text: "专属客户经理", included: false },
      ],
      buttonText: "免费试用 14 天",
      buttonStyle: "primary",
    },
    {
      name: "企业版",
      monthlyPrice: "¥299",
      annualPrice: "¥249",
      description: "适合大型组织",
      popular: false,
      features: [
        { text: "无限成员", included: true },
        { text: "企业级任务管理", included: true },
        { text: "无限存储空间", included: true },
        { text: "7×24 专线支持", included: true },
        { text: "高级分析", included: true },
        { text: "自定义工作流", included: true },
        { text: "API 访问", included: true },
        { text: "专属客户经理", included: true },
      ],
      buttonText: "联系销售",
      buttonStyle: "outline",
    },
  ];

  var footerColumns = [
    {
      title: "产品",
      links: ["功能介绍", "定价方案", "更新日志", "产品路线图"],
    },
    {
      title: "资源",
      links: ["帮助中心", "开发者文档", "API 参考", "社区论坛"],
    },
    {
      title: "公司",
      links: ["关于我们", "加入我们", "新闻动态", "合作伙伴"],
    },
    {
      title: "法律",
      links: ["服务条款", "隐私政策", "Cookie 政策", "安全合规"],
    },
  ];

  // ========== 渲染 ==========
  return (
    <div style={{ fontFamily: fontFamily, color: "#1E293B", background: "#F8FAFC", minHeight: "100vh", overflowX: "hidden" }}>
      <div style={{ display: "none" }}>{timestamp}</div>
      <style>{globalCSS}</style>

      {/* ==================== 导航栏 ==================== */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          padding: "0 24px",
          height: "72px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: state.scrolled ? "rgba(255,255,255,0.95)" : "transparent",
          backdropFilter: state.scrolled ? "blur(20px)" : "none",
          WebkitBackdropFilter: state.scrolled ? "blur(20px)" : "none",
          borderBottom: state.scrolled ? "1px solid rgba(0,0,0,0.06)" : "1px solid transparent",
          transition: "all 0.3s ease",
        }}
      >
        <div style={{ width: "100%", maxWidth: "1280px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Logo */}
          <div
            style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}
            onClick={function () { window.scrollTo({ top: 0, behavior: "smooth" }); }}
          >
            <div style={{
              width: "36px", height: "36px", borderRadius: "10px",
              background: state.scrolled ? "linear-gradient(135deg, #2563EB, #3B82F6)" : "rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "18px", fontWeight: "800",
              color: state.scrolled ? "#fff" : "#fff",
              transition: "all 0.3s ease",
            }}>智</div>
            <span style={{
              fontSize: "18px", fontWeight: "700",
              color: state.scrolled ? "#1E293B" : "#fff",
              transition: "color 0.3s ease",
            }}>智联协同</span>
          </div>

          {/* 桌面端导航 */}
          <div className="hide-mobile" style={{ display: "flex", alignItems: "center", gap: "32px" }}>
            {navLinks.map(function (link) {
              return (
                <a
                  key={link.target}
                  className="nav-link"
                  onClick={function () { self.scrollToSection(link.target); }}
                  style={{
                    color: state.scrolled ? "#475569" : "rgba(255,255,255,0.9)",
                    textDecoration: "none", fontSize: "15px", fontWeight: "500",
                    cursor: "pointer", transition: "color 0.3s ease",
                  }}
                >{link.label}</a>
              );
            })}
            <div style={{ width: "1px", height: "20px", background: state.scrolled ? "#E2E8F0" : "rgba(255,255,255,0.2)" }}></div>
            <a className="nav-link" style={{
              color: state.scrolled ? "#475569" : "rgba(255,255,255,0.9)",
              textDecoration: "none", fontSize: "15px", fontWeight: "500", cursor: "pointer",
            }}>登录</a>
            <button
              className="cta-btn"
              onClick={function () { self.scrollToSection("hero-cta"); }}
              style={{
                background: state.scrolled ? "#2563EB" : "rgba(255,255,255,0.15)",
                color: "#fff", border: state.scrolled ? "none" : "1px solid rgba(255,255,255,0.3)",
                borderRadius: "8px", padding: "8px 20px", fontSize: "14px", fontWeight: "600",
                cursor: "pointer", transition: "all 0.3s ease",
                backdropFilter: "blur(10px)",
              }}
            >免费注册</button>
          </div>

          {/* 移动端汉堡按钮 */}
          <button
            className="show-mobile"
            onClick={function () { self.setCustomState({ mobileMenuOpen: !state.mobileMenuOpen }); }}
            style={{
              background: "none", border: "none", cursor: "pointer", padding: "8px",
              display: "none", flexDirection: "column", gap: "5px",
            }}
          >
            <span style={{ display: "block", width: "22px", height: "2px", background: state.scrolled ? "#1E293B" : "#fff", borderRadius: "1px", transition: "all 0.3s ease", transform: state.mobileMenuOpen ? "rotate(45deg) translate(5px, 5px)" : "none" }}></span>
            <span style={{ display: "block", width: "22px", height: "2px", background: state.scrolled ? "#1E293B" : "#fff", borderRadius: "1px", transition: "all 0.3s ease", opacity: state.mobileMenuOpen ? 0 : 1 }}></span>
            <span style={{ display: "block", width: "22px", height: "2px", background: state.scrolled ? "#1E293B" : "#fff", borderRadius: "1px", transition: "all 0.3s ease", transform: state.mobileMenuOpen ? "rotate(-45deg) translate(5px, -5px)" : "none" }}></span>
          </button>
        </div>
      </nav>

      {/* 移动端全屏菜单 */}
      {state.mobileMenuOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 999,
          background: "rgba(15,23,42,0.98)", backdropFilter: "blur(20px)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "32px",
          animation: "fadeIn 0.3s ease",
        }}>
          {navLinks.map(function (link) {
            return (
              <a
                key={link.target}
                onClick={function () { self.scrollToSection(link.target); }}
                style={{ color: "#fff", textDecoration: "none", fontSize: "24px", fontWeight: "600", cursor: "pointer" }}
              >{link.label}</a>
            );
          })}
          <a style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "20px", cursor: "pointer" }}>登录</a>
          <button
            onClick={function () { self.scrollToSection("hero-cta"); }}
            style={{
              background: "#2563EB", color: "#fff", border: "none", borderRadius: "12px",
              padding: "14px 40px", fontSize: "18px", fontWeight: "600", cursor: "pointer",
            }}
          >免费注册</button>
        </div>
      )}

      {/* ==================== Hero 区 ==================== */}
      <section style={{
        minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(160deg, #0F172A 0%, #1E3A5F 40%, #2563EB 80%, #3B82F6 100%)",
        position: "relative", overflow: "hidden", padding: "120px 24px 80px",
      }}>
        {/* 粒子/光晕动画 */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "10%", left: "10%", width: "300px", height: "300px", borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)", animation: "particleFloat1 12s ease-in-out infinite" }}></div>
          <div style={{ position: "absolute", top: "60%", right: "10%", width: "200px", height: "200px", borderRadius: "50%", background: "radial-gradient(circle, rgba(37,99,235,0.25) 0%, transparent 70%)", animation: "particleFloat2 10s ease-in-out infinite" }}></div>
          <div style={{ position: "absolute", bottom: "20%", left: "30%", width: "250px", height: "250px", borderRadius: "50%", background: "radial-gradient(circle, rgba(96,165,250,0.2) 0%, transparent 70%)", animation: "particleFloat3 14s ease-in-out infinite" }}></div>
          <div style={{ position: "absolute", top: "30%", right: "25%", width: "150px", height: "150px", borderRadius: "50%", background: "radial-gradient(circle, rgba(147,197,253,0.15) 0%, transparent 70%)", animation: "particleFloat1 8s ease-in-out infinite 2s" }}></div>
          {/* 网格装饰 */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0.03,
            backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}></div>
        </div>

        <div style={{ position: "relative", zIndex: 2, textAlign: "center", maxWidth: "800px", width: "100%" }}>
          {/* 标签 */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "100px", padding: "6px 16px", marginBottom: "32px",
            backdropFilter: "blur(10px)", animation: "fadeInUp 0.8s ease",
          }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#34D399" }}></span>
            <span style={{ color: "rgba(255,255,255,0.9)", fontSize: "13px", fontWeight: "500" }}>全新 3.0 版本已发布</span>
          </div>

          {/* 主标题 */}
          <h1 style={{
            fontSize: "clamp(36px, 6vw, 72px)", fontWeight: "800", color: "#fff",
            lineHeight: 1.1, marginBottom: "24px", letterSpacing: "-0.02em",
            animation: "fadeInUp 0.8s ease 0.1s both",
          }}>
            重新定义<br />团队协作
          </h1>

          {/* 副标题 */}
          <p style={{
            fontSize: "clamp(16px, 2.5vw, 22px)", color: "rgba(255,255,255,0.75)",
            lineHeight: 1.6, marginBottom: "48px", maxWidth: "560px", marginLeft: "auto", marginRight: "auto",
            animation: "fadeInUp 0.8s ease 0.4s both",
          }}>
            让工作流程更智能、更高效。<br />一站式团队协作平台，助力企业数字化转型。
          </p>

          {/* CTA 表单 */}
          <div id="hero-cta" style={{ animation: "fadeInUp 0.8s ease 0.6s both" }}>
            {state.heroSubmitted ? (
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "12px",
                background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.3)",
                borderRadius: "12px", padding: "16px 32px",
              }}>
                <span style={{ fontSize: "24px" }}>✅</span>
                <span style={{ color: "#34D399", fontSize: "16px", fontWeight: "600" }}>注册成功！请查收确认邮件</span>
              </div>
            ) : (
              <div style={{
                display: "flex", flexDirection: "row", gap: "12px",
                maxWidth: "520px", marginLeft: "auto", marginRight: "auto",
                flexWrap: "wrap", justifyContent: "center",
              }}>
                <input
                  id="hero-email-input"
                  type="email"
                  placeholder="输入工作邮箱"
                  defaultValue=""
                  aria-label="工作邮箱"
                  onCompositionStart={function () { _customState._isComposing = true; }}
                  onCompositionEnd={function (e) {
                    _customState._isComposing = false;
                    _customState.heroEmail = e.target.value;
                    var valid = EMAIL_REGEX.test(e.target.value);
                    if (valid !== _customState.heroEmailValid) {
                      _customState.heroEmailValid = valid;
                      self.forceUpdate();
                    }
                  }}
                  onChange={function (e) {
                    if (!_customState._isComposing) {
                      _customState.heroEmail = e.target.value;
                      var valid = EMAIL_REGEX.test(e.target.value);
                      if (valid !== _customState.heroEmailValid) {
                        _customState.heroEmailValid = valid;
                        self.forceUpdate();
                      }
                    }
                  }}
                  style={{
                    flex: "1 1 280px", padding: "14px 20px", borderRadius: "10px",
                    border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.1)",
                    color: "#fff", fontSize: "15px", outline: "none",
                    backdropFilter: "blur(10px)", minWidth: "0",
                  }}
                />
                <button
                  className="cta-btn"
                  onClick={function () { self.handleHeroSubmit(); }}
                  disabled={!state.heroEmailValid || state.heroSubmitting}
                  style={{
                    flex: "0 0 auto", padding: "14px 28px", borderRadius: "10px",
                    background: state.heroEmailValid ? "#2563EB" : "rgba(37,99,235,0.4)",
                    color: "#fff", border: "none", fontSize: "15px", fontWeight: "700",
                    cursor: state.heroEmailValid ? "pointer" : "not-allowed",
                    whiteSpace: "nowrap",
                    animation: state.heroEmailValid ? "glow 2s ease-in-out infinite" : "none",
                    opacity: state.heroEmailValid ? 1 : 0.6,
                    transition: "all 0.3s ease",
                  }}
                >
                  {state.heroSubmitting ? "提交中..." : "免费试用 14 天"}
                </button>
              </div>
            )}
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", marginTop: "16px" }}>
              无需信用卡 · 随时取消 · 即刻开始
            </p>
          </div>
        </div>
      </section>

      {/* ==================== 信任背书 ==================== */}
      <section data-animate="trust" style={{ padding: "80px 24px", background: "#fff" }}>
        <div style={Object.assign({ maxWidth: "1280px", marginLeft: "auto", marginRight: "auto" }, animStyle("trust", 0))}>
          {/* 统计数据 */}
          <div style={{
            display: "flex", justifyContent: "center", gap: "48px", marginBottom: "48px",
            flexWrap: "wrap",
          }}>
            {trustStats.map(function (stat) {
              return (
                <div key={stat.label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "36px", fontWeight: "800", color: "#2563EB", marginBottom: "4px" }}>{stat.number}</div>
                  <div style={{ fontSize: "14px", color: "#64748B", fontWeight: "500" }}>{stat.label}</div>
                </div>
              );
            })}
          </div>

          {/* Logo 墙 */}
          <p style={{ textAlign: "center", fontSize: "14px", color: "#94A3B8", marginBottom: "24px", fontWeight: "500" }}>
            深受行业领先企业信赖
          </p>
          <div style={{
            display: "flex", justifyContent: "center", alignItems: "center", gap: "40px",
            flexWrap: "wrap",
          }}>
            {trustLogos.map(function (logo) {
              return (
                <div
                  key={logo.name}
                  className="logo-item"
                  style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    filter: "grayscale(100%)", opacity: 0.5, cursor: "pointer",
                  }}
                >
                  <div style={{
                    width: "36px", height: "36px", borderRadius: "8px",
                    background: "#E2E8F0", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "16px", fontWeight: "700", color: "#64748B",
                  }}>{logo.abbr}</div>
                  <span style={{ fontSize: "15px", fontWeight: "600", color: "#64748B" }}>{logo.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================== 核心功能 ==================== */}
      <section id="features" data-animate="features" style={{ padding: "100px 24px", background: "#F8FAFC" }}>
        <div style={Object.assign({ maxWidth: "1280px", marginLeft: "auto", marginRight: "auto" }, animStyle("features", 0))}>
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <span style={{
              display: "inline-block", background: "rgba(37,99,235,0.08)", color: "#2563EB",
              fontSize: "13px", fontWeight: "600", padding: "4px 14px", borderRadius: "100px", marginBottom: "16px",
            }}>核心功能</span>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: "800", color: "#0F172A", marginBottom: "16px" }}>
              为高效团队打造的全能工具
            </h2>
            <p style={{ fontSize: "17px", color: "#64748B", maxWidth: "560px", marginLeft: "auto", marginRight: "auto", lineHeight: 1.6 }}>
              从任务管理到实时协作，智联协同提供一站式解决方案
            </p>
          </div>

          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "24px",
          }}>
            {features.map(function (feature, index) {
              return (
                <div
                  key={feature.title}
                  className="feature-card"
                  style={Object.assign({
                    background: "#fff", borderRadius: "16px", padding: "36px 32px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)",
                    border: "1px solid rgba(0,0,0,0.04)",
                  }, animStyle("features", 0.1 + index * 0.15))}
                >
                  <div className="feature-icon-wrap" style={{ marginBottom: "20px" }}>
                    <div className="feature-icon" style={{
                      width: "56px", height: "56px", borderRadius: "14px",
                      background: "linear-gradient(135deg, rgba(37,99,235,0.08), rgba(59,130,246,0.12))",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "28px",
                    }}>{feature.icon}</div>
                  </div>
                  <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#0F172A", marginBottom: "12px" }}>{feature.title}</h3>
                  <p style={{ fontSize: "15px", color: "#64748B", lineHeight: 1.7, marginBottom: "20px" }}>{feature.description}</p>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {feature.tags.map(function (tag) {
                      return (
                        <span key={tag} style={{
                          background: "#F1F5F9", color: "#475569", fontSize: "12px", fontWeight: "500",
                          padding: "4px 10px", borderRadius: "6px",
                        }}>{tag}</span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================== 产品演示 ==================== */}
      <section data-animate="demo" style={{ padding: "100px 24px", background: "#fff" }}>
        <div style={Object.assign({ maxWidth: "1280px", marginLeft: "auto", marginRight: "auto" }, animStyle("demo", 0))}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <span style={{
              display: "inline-block", background: "rgba(37,99,235,0.08)", color: "#2563EB",
              fontSize: "13px", fontWeight: "600", padding: "4px 14px", borderRadius: "100px", marginBottom: "16px",
            }}>产品演示</span>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: "800", color: "#0F172A", marginBottom: "16px" }}>
              眼见为实
            </h2>
            <p style={{ fontSize: "17px", color: "#64748B", lineHeight: 1.6 }}>
              探索智联协同的强大功能
            </p>
          </div>

          {/* 标签切换 */}
          <div style={{
            display: "flex", justifyContent: "center", gap: "8px", marginBottom: "48px",
            flexWrap: "wrap",
          }}>
            {demoTabs.map(function (tab, index) {
              var isActive = state.activeDemo === index;
              return (
                <button
                  key={tab.label}
                  className={isActive ? "" : "demo-tab"}
                  onClick={function () { self.setCustomState({ activeDemo: index }); }}
                  style={{
                    padding: "10px 24px", borderRadius: "8px", border: "none",
                    background: isActive ? "#2563EB" : "transparent",
                    color: isActive ? "#fff" : "#64748B",
                    fontSize: "14px", fontWeight: "600", cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >{tab.label}</button>
              );
            })}
          </div>

          {/* 演示内容 */}
          <div style={{
            display: "flex", alignItems: "center", gap: "64px",
            flexWrap: "wrap",
          }}>
            {/* 左侧文字 */}
            <div style={{ flex: "1 1 340px", minWidth: "280px" }}>
              <h3 style={{ fontSize: "28px", fontWeight: "700", color: "#0F172A", marginBottom: "16px" }}>
                {demoTabs[state.activeDemo].title}
              </h3>
              <p style={{ fontSize: "16px", color: "#64748B", lineHeight: 1.7, marginBottom: "24px" }}>
                {demoTabs[state.activeDemo].description}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {demoTabs[state.activeDemo].highlights.map(function (highlight) {
                  return (
                    <div key={highlight} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{
                        width: "20px", height: "20px", borderRadius: "50%",
                        background: "rgba(37,99,235,0.1)", display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "11px", color: "#2563EB", flexShrink: 0,
                      }}>✓</div>
                      <span style={{ fontSize: "15px", color: "#475569", fontWeight: "500" }}>{highlight}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 右侧产品截图（浏览器窗口装饰） */}
            <div style={{ flex: "1 1 400px", minWidth: "300px" }}>
              <div style={{
                borderRadius: "12px", overflow: "hidden",
                boxShadow: "0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)",
                border: "1px solid rgba(0,0,0,0.06)",
              }}>
                {/* 浏览器顶栏 */}
                <div style={{
                  background: "#F1F5F9", padding: "12px 16px",
                  display: "flex", alignItems: "center", gap: "8px",
                }}>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#EF4444" }}></div>
                    <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#F59E0B" }}></div>
                    <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#22C55E" }}></div>
                  </div>
                  <div style={{
                    flex: 1, background: "#fff", borderRadius: "6px", padding: "6px 12px",
                    fontSize: "12px", color: "#94A3B8", textAlign: "center",
                  }}>app.zhilian.com/{demoTabs[state.activeDemo].label === "任务看板" ? "board" : demoTabs[state.activeDemo].label === "文档协作" ? "docs" : "analytics"}</div>
                </div>
                {/* 截图内容区 */}
                <div style={{
                  background: "linear-gradient(135deg, #EEF2FF, #E0E7FF, #C7D2FE)",
                  padding: "40px", minHeight: "320px",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                }}>
                  <div style={{ fontSize: "48px", marginBottom: "16px" }}>
                    {state.activeDemo === 0 ? "📋" : state.activeDemo === 1 ? "📝" : "📊"}
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: "600", color: "#3730A3", marginBottom: "8px" }}>
                    {demoTabs[state.activeDemo].title}
                  </div>
                  <div style={{ fontSize: "14px", color: "#6366F1" }}>
                    交互式演示区域
                  </div>
                  {/* 模拟 UI 元素 */}
                  <div style={{ display: "flex", gap: "12px", marginTop: "24px", flexWrap: "wrap", justifyContent: "center" }}>
                    {[1, 2, 3].map(function (item) {
                      return (
                        <div key={item} style={{
                          background: "rgba(255,255,255,0.8)", borderRadius: "8px",
                          padding: "12px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                          fontSize: "13px", color: "#475569", fontWeight: "500",
                        }}>
                          {state.activeDemo === 0 ? ["待办任务", "进行中", "已完成"][item - 1] : state.activeDemo === 1 ? ["文档 " + item, "编辑中...", "已保存"][item - 1] : ["日报表", "周报表", "月报表"][item - 1]}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 客户评价 ==================== */}
      <section id="testimonials" data-animate="testimonials" style={{ padding: "100px 24px", background: "#F8FAFC" }}>
        <div style={Object.assign({ maxWidth: "1280px", marginLeft: "auto", marginRight: "auto" }, animStyle("testimonials", 0))}>
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <span style={{
              display: "inline-block", background: "rgba(37,99,235,0.08)", color: "#2563EB",
              fontSize: "13px", fontWeight: "600", padding: "4px 14px", borderRadius: "100px", marginBottom: "16px",
            }}>客户评价</span>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: "800", color: "#0F172A", marginBottom: "16px" }}>
              听听用户怎么说
            </h2>
            <p style={{ fontSize: "17px", color: "#64748B", lineHeight: 1.6 }}>
              来自真实用户的使用反馈
            </p>
          </div>

          {/* 轮播卡片 */}
          <div style={{ maxWidth: "720px", marginLeft: "auto", marginRight: "auto", position: "relative" }}>
            {testimonials.map(function (testimonial, index) {
              var isActive = state.activeTestimonial === index;
              return (
                <div
                  key={testimonial.name}
                  style={{
                    display: isActive ? "block" : "none",
                    background: "rgba(255,255,255,0.8)",
                    backdropFilter: "blur(20px)",
                    borderRadius: "20px", padding: "40px 36px",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
                    border: "1px solid rgba(255,255,255,0.8)",
                    position: "relative",
                    animation: isActive ? "fadeIn 0.5s ease" : "none",
                  }}
                >
                  {/* 大号引号装饰 */}
                  <div style={{
                    position: "absolute", top: "20px", left: "28px",
                    fontSize: "72px", color: "rgba(37,99,235,0.08)", fontFamily: "Georgia, serif",
                    lineHeight: 1, fontWeight: "700",
                  }}>"</div>

                  {/* 星级 */}
                  <div style={{ display: "flex", gap: "4px", marginBottom: "20px" }}>
                    {[1, 2, 3, 4, 5].map(function (star) {
                      return (
                        <span key={star} style={{ fontSize: "18px", color: star <= testimonial.rating ? "#F59E0B" : "#E2E8F0" }}>★</span>
                      );
                    })}
                  </div>

                  {/* 评价内容 */}
                  <p style={{
                    fontSize: "17px", color: "#334155", lineHeight: 1.8,
                    marginBottom: "28px", fontStyle: "italic", position: "relative", zIndex: 1,
                  }}>
                    "{testimonial.text}"
                  </p>

                  {/* 用户信息 */}
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div style={{
                      width: "48px", height: "48px", borderRadius: "50%",
                      background: "linear-gradient(135deg, #2563EB, #3B82F6)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontSize: "18px", fontWeight: "700",
                    }}>{testimonial.avatar}</div>
                    <div>
                      <div style={{ fontSize: "15px", fontWeight: "700", color: "#0F172A" }}>{testimonial.name}</div>
                      <div style={{ fontSize: "13px", color: "#64748B" }}>{testimonial.title}，{testimonial.company}</div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* 指示器 */}
            <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "28px" }}>
              {testimonials.map(function (_, index) {
                var isActive = state.activeTestimonial === index;
                return (
                  <button
                    key={index}
                    onClick={function () { self.setCustomState({ activeTestimonial: index }); }}
                    aria-label={"切换到第" + (index + 1) + "条评价"}
                    style={{
                      width: isActive ? "32px" : "8px", height: "8px",
                      borderRadius: "4px", border: "none",
                      background: isActive ? "#2563EB" : "#CBD5E1",
                      cursor: "pointer", transition: "all 0.3s ease",
                      padding: 0,
                    }}
                  ></button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 定价方案 ==================== */}
      <section id="pricing" data-animate="pricing" style={{ padding: "100px 24px", background: "#fff" }}>
        <div style={Object.assign({ maxWidth: "1280px", marginLeft: "auto", marginRight: "auto" }, animStyle("pricing", 0))}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <span style={{
              display: "inline-block", background: "rgba(37,99,235,0.08)", color: "#2563EB",
              fontSize: "13px", fontWeight: "600", padding: "4px 14px", borderRadius: "100px", marginBottom: "16px",
            }}>定价方案</span>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: "800", color: "#0F172A", marginBottom: "16px" }}>
              简单透明的定价
            </h2>
            <p style={{ fontSize: "17px", color: "#64748B", lineHeight: 1.6, marginBottom: "32px" }}>
              选择最适合你团队的方案
            </p>

            {/* 月付/年付切换 */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "12px",
              background: "#F1F5F9", borderRadius: "10px", padding: "4px",
            }}>
              <button
                onClick={function () { self.setCustomState({ billingAnnual: false }); }}
                style={{
                  padding: "8px 20px", borderRadius: "8px", border: "none",
                  background: !state.billingAnnual ? "#fff" : "transparent",
                  color: !state.billingAnnual ? "#0F172A" : "#64748B",
                  fontSize: "14px", fontWeight: "600", cursor: "pointer",
                  boxShadow: !state.billingAnnual ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  transition: "all 0.2s ease",
                }}
              >月付</button>
              <button
                onClick={function () { self.setCustomState({ billingAnnual: true }); }}
                style={{
                  padding: "8px 20px", borderRadius: "8px", border: "none",
                  background: state.billingAnnual ? "#fff" : "transparent",
                  color: state.billingAnnual ? "#0F172A" : "#64748B",
                  fontSize: "14px", fontWeight: "600", cursor: "pointer",
                  boxShadow: state.billingAnnual ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  transition: "all 0.2s ease",
                }}
              >年付</button>
              {state.billingAnnual && (
                <span style={{
                  background: "#DCFCE7", color: "#16A34A", fontSize: "12px", fontWeight: "600",
                  padding: "2px 8px", borderRadius: "4px",
                }}>省 20%</span>
              )}
            </div>
          </div>

          {/* 定价卡片 */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "24px", maxWidth: "1080px", marginLeft: "auto", marginRight: "auto",
          }}>
            {pricingPlans.map(function (plan, index) {
              var price = state.billingAnnual ? plan.annualPrice : plan.monthlyPrice;
              return (
                <div
                  key={plan.name}
                  className="pricing-card"
                  style={Object.assign({
                    background: plan.popular ? "linear-gradient(135deg, #0F172A, #1E293B)" : "#fff",
                    borderRadius: "20px", padding: "36px 32px",
                    boxShadow: plan.popular ? "0 20px 60px rgba(15,23,42,0.3)" : "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)",
                    border: plan.popular ? "none" : "1px solid rgba(0,0,0,0.06)",
                    position: "relative", overflow: "hidden",
                  }, animStyle("pricing", 0.1 + index * 0.15))}
                >
                  {/* 最受欢迎角标 */}
                  {plan.popular && (
                    <div style={{
                      position: "absolute", top: "16px", right: "16px",
                      background: "#2563EB", color: "#fff", fontSize: "11px", fontWeight: "700",
                      padding: "4px 12px", borderRadius: "100px",
                    }}>最受欢迎</div>
                  )}

                  <h3 style={{
                    fontSize: "18px", fontWeight: "700",
                    color: plan.popular ? "#fff" : "#0F172A",
                    marginBottom: "4px",
                  }}>{plan.name}</h3>
                  <p style={{
                    fontSize: "13px",
                    color: plan.popular ? "rgba(255,255,255,0.6)" : "#94A3B8",
                    marginBottom: "20px",
                  }}>{plan.description}</p>

                  {/* 价格 */}
                  <div style={{ marginBottom: "28px" }}>
                    <span style={{
                      fontSize: price === "免费" ? "36px" : "42px", fontWeight: "800",
                      color: plan.popular ? "#fff" : "#0F172A",
                    }}>{price}</span>
                    {price !== "免费" && (
                      <span style={{
                        fontSize: "15px",
                        color: plan.popular ? "rgba(255,255,255,0.5)" : "#94A3B8",
                      }}> /人/月</span>
                    )}
                  </div>

                  {/* 功能列表 */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "32px" }}>
                    {plan.features.map(function (feature) {
                      return (
                        <div key={feature.text} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{
                            fontSize: "14px",
                            color: feature.included ? (plan.popular ? "#34D399" : "#2563EB") : (plan.popular ? "rgba(255,255,255,0.2)" : "#CBD5E1"),
                          }}>{feature.included ? "✓" : "✗"}</span>
                          <span style={{
                            fontSize: "14px",
                            color: feature.included ? (plan.popular ? "rgba(255,255,255,0.9)" : "#475569") : (plan.popular ? "rgba(255,255,255,0.3)" : "#CBD5E1"),
                            textDecoration: feature.included ? "none" : "line-through",
                          }}>{feature.text}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* 按钮 */}
                  <button
                    className="cta-btn"
                    style={{
                      width: "100%", padding: "14px", borderRadius: "10px",
                      fontSize: "15px", fontWeight: "700", cursor: "pointer",
                      background: plan.popular ? "#2563EB" : "transparent",
                      color: plan.popular ? "#fff" : "#2563EB",
                      border: plan.popular ? "none" : "2px solid #2563EB",
                      transition: "all 0.2s ease",
                    }}
                  >{plan.buttonText}</button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================== 最终 CTA ==================== */}
      <section data-animate="final-cta" style={{
        padding: "120px 24px",
        background: "linear-gradient(160deg, #0F172A 0%, #1E3A5F 50%, #2563EB 100%)",
        position: "relative", overflow: "hidden",
      }}>
        {/* 背景装饰 */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none" }}>
          <div style={{ position: "absolute", top: "20%", left: "5%", width: "200px", height: "200px", borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)", animation: "particleFloat2 10s ease-in-out infinite" }}></div>
          <div style={{ position: "absolute", bottom: "10%", right: "10%", width: "300px", height: "300px", borderRadius: "50%", background: "radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)", animation: "particleFloat1 12s ease-in-out infinite" }}></div>
        </div>

        <div style={Object.assign({
          maxWidth: "680px", marginLeft: "auto", marginRight: "auto",
          textAlign: "center", position: "relative", zIndex: 2,
        }, animStyle("final-cta", 0))}>
          <h2 style={{
            fontSize: "clamp(28px, 5vw, 48px)", fontWeight: "800", color: "#fff",
            marginBottom: "16px", lineHeight: 1.2,
          }}>
            准备好提升团队效率了吗？
          </h2>
          <p style={{
            fontSize: "18px", color: "rgba(255,255,255,0.7)", marginBottom: "40px", lineHeight: 1.6,
          }}>
            加入 10,000+ 团队，体验全新的协作方式
          </p>

          {state.ctaSubmitted ? (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "12px",
              background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.3)",
              borderRadius: "12px", padding: "16px 32px",
            }}>
              <span style={{ fontSize: "24px" }}>✅</span>
              <span style={{ color: "#34D399", fontSize: "16px", fontWeight: "600" }}>注册成功！请查收确认邮件</span>
            </div>
          ) : (
            <div style={{
              display: "flex", gap: "12px", maxWidth: "520px",
              marginLeft: "auto", marginRight: "auto",
              flexWrap: "wrap", justifyContent: "center",
            }}>
              <input
                id="cta-email-input"
                type="email"
                placeholder="输入工作邮箱"
                defaultValue=""
                aria-label="工作邮箱"
                onCompositionStart={function () { _customState._isComposing2 = true; }}
                onCompositionEnd={function (e) {
                  _customState._isComposing2 = false;
                  _customState.ctaEmail = e.target.value;
                  var valid = EMAIL_REGEX.test(e.target.value);
                  if (valid !== _customState.ctaEmailValid) {
                    _customState.ctaEmailValid = valid;
                    self.forceUpdate();
                  }
                }}
                onChange={function (e) {
                  if (!_customState._isComposing2) {
                    _customState.ctaEmail = e.target.value;
                    var valid = EMAIL_REGEX.test(e.target.value);
                    if (valid !== _customState.ctaEmailValid) {
                      _customState.ctaEmailValid = valid;
                      self.forceUpdate();
                    }
                  }
                }}
                style={{
                  flex: "1 1 280px", padding: "16px 20px", borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.1)",
                  color: "#fff", fontSize: "15px", outline: "none",
                  backdropFilter: "blur(10px)", minWidth: "0",
                }}
              />
              <button
                className="cta-btn"
                onClick={function () { self.handleCtaSubmit(); }}
                disabled={!state.ctaEmailValid || state.ctaSubmitting}
                style={{
                  flex: "0 0 auto", padding: "16px 32px", borderRadius: "10px",
                  background: state.ctaEmailValid ? "#fff" : "rgba(255,255,255,0.2)",
                  color: state.ctaEmailValid ? "#2563EB" : "rgba(255,255,255,0.5)",
                  border: "none", fontSize: "15px", fontWeight: "700",
                  cursor: state.ctaEmailValid ? "pointer" : "not-allowed",
                  whiteSpace: "nowrap",
                  transition: "all 0.3s ease",
                }}
              >
                {state.ctaSubmitting ? "提交中..." : "立即开始"}
              </button>
            </div>
          )}

          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", marginTop: "16px" }}>
            14 天免费试用 · 无需信用卡 · 随时取消
          </p>
        </div>
      </section>

      {/* ==================== 页脚 ==================== */}
      <footer style={{ background: "#0F172A", padding: "80px 24px 40px", color: "#94A3B8" }}>
        <div style={{ maxWidth: "1280px", marginLeft: "auto", marginRight: "auto" }}>
          {/* 四栏链接 */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "40px", marginBottom: "64px",
          }}>
            {/* Logo + 描述 */}
            <div style={{ gridColumn: "span 1" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <div style={{
                  width: "32px", height: "32px", borderRadius: "8px",
                  background: "linear-gradient(135deg, #2563EB, #3B82F6)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "14px", fontWeight: "800", color: "#fff",
                }}>智</div>
                <span style={{ fontSize: "16px", fontWeight: "700", color: "#fff" }}>智联协同</span>
              </div>
              <p style={{ fontSize: "14px", lineHeight: 1.7, color: "#64748B" }}>
                让团队协作更智能、更高效。一站式企业协作平台。
              </p>
            </div>

            {footerColumns.map(function (column) {
              return (
                <div key={column.title}>
                  <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#E2E8F0", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {column.title}
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {column.links.map(function (link) {
                      return (
                        <a key={link} className="footer-link" style={{
                          color: "#64748B", textDecoration: "none", fontSize: "14px", cursor: "pointer",
                        }}>{link}</a>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 分割线 */}
          <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", marginBottom: "32px" }}></div>

          {/* 底部 */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            flexWrap: "wrap", gap: "16px",
          }}>
            <p style={{ fontSize: "13px", color: "#475569" }}>
              © 2025 智联协同. All rights reserved.
            </p>
            {/* 社交媒体 */}
            <div style={{ display: "flex", gap: "16px" }}>
              {["微信", "微博", "GitHub"].map(function (social) {
                return (
                  <a key={social} style={{
                    width: "36px", height: "36px", borderRadius: "8px",
                    background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#64748B", fontSize: "12px", fontWeight: "600",
                    textDecoration: "none", cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}>{social.charAt(0)}</a>
                );
              })}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

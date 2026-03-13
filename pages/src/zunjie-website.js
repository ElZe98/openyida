// ============================================================
// 状态管理
// ============================================================

// 留资表单配置
const LEAD_FORM_UUID = 'FORM-408EB12FE01E491CBB62C6B7F64DBF4FCD97';
const LEAD_FORM_FIELDS = {
  name: 'textField_dpw8zg2y',
  phone: 'textField_dpw80ukr',
  city: 'textField_dpw8ae99',
  model: 'radioField_dpw875pw',
  intentType: 'radioField_dpw8yzlw',
  remark: 'textareaField_dpw87h7p',
};

const _customState = {
  navScrolled: false,
  activeSection: 'hero',
  activeModel: 's9',
  activeTech: 'adas',
  countersStarted: false,
  counterValues: { range: 0, speed: 0, voltage: 0, sensors: 0 },
  mobileMenuOpen: false,
  // 留资弹窗
  leadModalOpen: false,
  leadModalType: '预约试驾', // 预约试驾 / 立即订购 / 了解更多
  leadModalModel: '尊界 S9', // 预填意向车型
  leadSubmitting: false,
  leadSubmitSuccess: false,
};

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

// ============================================================
// 生命周期
// ============================================================

export function didMount() {
  const self = this;

  // 监听滚动：导航栏变色 + 数字动画触发
  function handleScroll() {
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const wasScrolled = _customState.navScrolled;
    const isScrolled = scrollY > 60;

    if (wasScrolled !== isScrolled) {
      _customState.navScrolled = isScrolled;
      self.forceUpdate();
    }

    // 触发数字计数动画
    if (!_customState.countersStarted) {
      const statsEl = document.getElementById('zj-stats-bar');
      if (statsEl) {
        const rect = statsEl.getBoundingClientRect();
        if (rect.top < window.innerHeight - 100) {
          _customState.countersStarted = true;
          self._startCounters();
        }
      }
    }

    // 触发 reveal 动画
    const revealEls = document.querySelectorAll('.zj-reveal');
    revealEls.forEach(function(el) {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight - 80) {
        el.classList.add('zj-revealed');
      }
    });
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  _customState._scrollHandler = handleScroll;

  // 注入全局动画样式
  self._injectStyles();

  // 初始触发一次
  setTimeout(function() { handleScroll(); }, 100);
}

export function didUnmount() {
  if (_customState._scrollHandler) {
    window.removeEventListener('scroll', _customState._scrollHandler);
  }
  if (_customState._counterTimer) {
    clearInterval(_customState._counterTimer);
  }
  // 清理注入的样式
  const styleEl = document.getElementById('zj-global-styles');
  if (styleEl) styleEl.remove();
}

// ============================================================
// 留资弹窗操作
// ============================================================

export function openLeadModal(intentType, model) {
  _customState.leadModalOpen = true;
  _customState.leadModalType = intentType || '预约试驾';
  _customState.leadModalModel = model || '尊界 S9';
  _customState.leadSubmitting = false;
  _customState.leadSubmitSuccess = false;
  // 禁止背景滚动
  document.body.style.overflow = 'hidden';
  this.forceUpdate();
}

export function closeLeadModal() {
  _customState.leadModalOpen = false;
  _customState.leadSubmitSuccess = false;
  document.body.style.overflow = '';
  this.forceUpdate();
}

export function submitLeadForm() {
  const self = this;

  // 读取非受控输入框的值
  const nameEl = document.getElementById('zj-lead-name');
  const phoneEl = document.getElementById('zj-lead-phone');
  const cityEl = document.getElementById('zj-lead-city');
  const remarkEl = document.getElementById('zj-lead-remark');

  const nameVal = nameEl ? nameEl.value.trim() : '';
  const phoneVal = phoneEl ? phoneEl.value.trim() : '';
  const cityVal = cityEl ? cityEl.value.trim() : '';
  const remarkVal = remarkEl ? remarkEl.value.trim() : '';
  const modelVal = _customState.leadModalModel;
  const intentVal = _customState.leadModalType;

  // 前端校验
  if (!nameVal) {
    self.utils.toast({ title: '请输入姓名', type: 'error' });
    return;
  }
  if (!phoneVal || !/^1[3-9]\d{9}$/.test(phoneVal)) {
    self.utils.toast({ title: '请输入正确的手机号码', type: 'error' });
    return;
  }
  if (!cityVal) {
    self.utils.toast({ title: '请输入所在城市', type: 'error' });
    return;
  }

  _customState.leadSubmitting = true;
  self.forceUpdate();

  const formDataJson = {};
  formDataJson[LEAD_FORM_FIELDS.name] = nameVal;
  formDataJson[LEAD_FORM_FIELDS.phone] = phoneVal;
  formDataJson[LEAD_FORM_FIELDS.city] = cityVal;
  formDataJson[LEAD_FORM_FIELDS.model] = modelVal;
  formDataJson[LEAD_FORM_FIELDS.intentType] = intentVal;
  if (remarkVal) {
    formDataJson[LEAD_FORM_FIELDS.remark] = remarkVal;
  }

  self.utils.yida.saveFormData({
    formUuid: LEAD_FORM_UUID,
    appType: window.pageConfig ? window.pageConfig.appType : 'APP_E2J5TYFZBOZ12OX1T42P',
    formDataJson: JSON.stringify(formDataJson),
  }).then(function() {
    _customState.leadSubmitting = false;
    _customState.leadSubmitSuccess = true;
    self.forceUpdate();
    // 3 秒后自动关闭
    setTimeout(function() {
      self.closeLeadModal();
    }, 3000);
  }).catch(function(err) {
    _customState.leadSubmitting = false;
    self.forceUpdate();
    self.utils.toast({ title: (err && err.message) || '提交失败，请稍后重试', type: 'error' });
  });
}

// ============================================================
// 辅助方法（挂载到 this）
// ============================================================

export function _injectStyles() {
  if (document.getElementById('zj-global-styles')) return;
  const style = document.createElement('style');
  style.id = 'zj-global-styles';
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    .zj-root { font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'PingFang SC', 'Helvetica Neue', sans-serif; background: #000; color: #fff; overflow-x: hidden; }

    /* 滚动平滑 */
    html { scroll-behavior: smooth; }

    /* reveal 动画 */
    .zj-reveal { opacity: 0; transform: translateY(40px); transition: opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1); }
    .zj-reveal.zj-revealed { opacity: 1; transform: translateY(0); }
    .zj-reveal-delay-1 { transition-delay: 0.1s; }
    .zj-reveal-delay-2 { transition-delay: 0.2s; }
    .zj-reveal-delay-3 { transition-delay: 0.3s; }
    .zj-reveal-delay-4 { transition-delay: 0.4s; }

    /* 导航栏 */
    .zj-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 9999; transition: background 0.4s ease, backdrop-filter 0.4s ease; }
    .zj-nav.scrolled { background: rgba(0,0,0,0.85); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.08); }
    .zj-nav a { text-decoration: none; }

    /* Hero 粒子 */
    @keyframes zjFloat { 0%,100%{transform:translateY(0) scale(1);opacity:0.6} 50%{transform:translateY(-20px) scale(1.1);opacity:1} }
    @keyframes zjPulse { 0%,100%{opacity:0.3;transform:scale(1)} 50%{opacity:0.8;transform:scale(1.05)} }
    @keyframes zjSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    @keyframes zjScrollBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(8px)} }

    /* 雷达动画 */
    @keyframes zjRadarSweep { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    @keyframes zjRadarPing { 0%{opacity:1;transform:scale(0.5)} 100%{opacity:0;transform:scale(2)} }
    @keyframes zjRadarDot { 0%,100%{opacity:0.3} 50%{opacity:1} }

    /* 电驱动画 */
    @keyframes zjPowerPulse { 0%,100%{transform:scale(1);opacity:0.3} 50%{transform:scale(1.15);opacity:0.7} }
    @keyframes zjPowerParticle { 0%{transform:translate(0,0) scale(1);opacity:1} 100%{transform:translate(var(--dx),var(--dy)) scale(0);opacity:0} }

    /* 数字计数 */
    @keyframes zjCountUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

    /* 车型卡片悬停 */
    .zj-model-card { transition: transform 0.4s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s ease; cursor: pointer; }
    .zj-model-card:hover { transform: translateY(-8px); box-shadow: 0 40px 80px rgba(0,0,0,0.6); }

    /* 技术 Tab */
    .zj-tech-tab { transition: all 0.3s ease; cursor: pointer; }
    .zj-tech-tab:hover { opacity: 1 !important; }

    /* 留资弹窗动画 */
    @keyframes zjFadeIn { from{opacity:0} to{opacity:1} }
    @keyframes zjSlideUp { from{opacity:0;transform:translateY(30px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }

    /* 留资输入框 focus */
    .zj-lead-input:focus { border-color: rgba(96,165,250,0.5) !important; background: rgba(255,255,255,0.08) !important; }

    /* 购买按钮 hover */
    .zj-btn-buy-primary:hover { background: #e5e7eb !important; }
    .zj-btn-buy-ghost:hover { border-color: rgba(255,255,255,0.4) !important; }

    /* 按钮悬停 */
    .zj-btn-primary { transition: all 0.3s ease; cursor: pointer; }
    .zj-btn-primary:hover { background: #fff !important; color: #000 !important; transform: scale(1.02); }
    .zj-btn-ghost { transition: all 0.3s ease; cursor: pointer; }
    .zj-btn-ghost:hover { background: rgba(255,255,255,0.15) !important; }

    /* 购买卡片 */
    .zj-buy-card { transition: transform 0.4s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s ease; }
    .zj-buy-card:hover { transform: translateY(-6px); }

    /* 体验卡片 */
    .zj-exp-card { transition: transform 0.4s cubic-bezier(0.16,1,0.3,1); cursor: default; }
    .zj-exp-card:hover { transform: scale(1.02); }

    /* 移动端菜单 */
    @keyframes zjMenuSlide { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
    .zj-mobile-menu { animation: zjMenuSlide 0.3s ease; }

    /* 留资弹窗 */
    @keyframes zjModalIn { from{opacity:0;transform:translateY(30px) scale(0.96)} to{opacity:1;transform:translateY(0) scale(1)} }
    .zj-lead-modal-box { animation: zjModalIn 0.4s cubic-bezier(0.16,1,0.3,1); }
    .zj-lead-input { width:100%; padding:12px 16px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); border-radius:10px; color:#fff; font-size:15px; outline:none; transition:border-color 0.2s; font-family:inherit; }
    .zj-lead-input:focus { border-color:rgba(255,255,255,0.4); }
    .zj-lead-input::placeholder { color:rgba(255,255,255,0.3); }
    .zj-lead-radio-group { display:flex; gap:10px; flex-wrap:wrap; }
    .zj-lead-radio { display:flex; align-items:center; gap:6px; padding:8px 16px; border:1px solid rgba(255,255,255,0.15); border-radius:20px; cursor:pointer; font-size:13px; color:rgba(255,255,255,0.7); transition:all 0.2s; user-select:none; }
    .zj-lead-radio.active { border-color:#60a5fa; background:rgba(96,165,250,0.12); color:#60a5fa; }
    .zj-lead-radio:hover { border-color:rgba(255,255,255,0.3); }
    .zj-lead-submit { width:100%; padding:14px; background:#fff; color:#000; border:none; border-radius:10px; font-size:15px; font-weight:600; cursor:pointer; transition:all 0.3s; margin-top:8px; font-family:inherit; }
    .zj-lead-submit:hover:not(:disabled) { background:#e0e0e0; }
    .zj-lead-submit:disabled { opacity:0.6; cursor:not-allowed; }

    /* 留资区块 */
    .zj-lead-section-card { transition:transform 0.3s ease,box-shadow 0.3s ease; }
    .zj-lead-section-card:hover { transform:translateY(-4px); box-shadow:0 20px 60px rgba(0,0,0,0.5); }

    /* 响应式 */
    @media (max-width: 768px) {
      /* 导航 */
      .zj-nav-links { display: none !important; }
      .zj-nav-actions { display: none !important; }
      .zj-hamburger { display: flex !important; }

      /* Hero */
      .zj-hero-title { font-size: 44px !important; }
      .zj-hero-sub { font-size: 24px !important; }
      .zj-hero-desc { font-size: 14px !important; }
      .zj-hero-actions { flex-direction: column !important; align-items: stretch !important; gap: 12px !important; }
      .zj-hero-car-wrap { width: 100% !important; padding: 0 16px !important; }

      /* 数据条 */
      .zj-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }

      /* 车型 */
      .zj-models-grid { grid-template-columns: 1fr !important; }

      /* 技术 */
      .zj-tech-content { flex-direction: column !important; }
      .zj-tech-tab-bar { flex-wrap: wrap !important; gap: 8px !important; }

      /* 设计 */
      .zj-design-inner { flex-direction: column !important; gap: 40px !important; }
      .zj-design-specs { gap: 20px !important; }

      /* 体验 */
      .zj-exp-grid { grid-template-columns: 1fr !important; }
      .zj-exp-card-large { grid-column: span 1 !important; }

      /* 购买 */
      .zj-buy-inner { flex-direction: column !important; gap: 40px !important; }
      .zj-buy-text { flex: none !important; width: 100% !important; }
      .zj-buy-cards { flex-direction: column !important; }
      .zj-buy-title { font-size: 32px !important; }

      /* 页脚 */
      .zj-footer-top { grid-template-columns: 1fr 1fr !important; gap: 24px !important; }

      /* 留资区块 */
      .zj-lead-section-title { font-size: 28px !important; }
      .zj-lead-section-desc { font-size: 14px !important; }
      .zj-lead-section-btns { flex-direction: column !important; align-items: stretch !important; }

      /* 留资弹窗 */
      .zj-lead-overlay { align-items: flex-end !important; padding: 0 !important; }
      .zj-lead-modal-box { border-radius: 20px 20px 0 0 !important; max-height: 92vh !important; overflow-y: auto !important; padding: 28px 20px 40px !important; width: 100% !important; max-width: 100% !important; }
      .zj-lead-radio-group { gap: 8px !important; }
    }

    @media (max-width: 480px) {
      .zj-hero-title { font-size: 36px !important; }
      .zj-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
      .zj-footer-top { grid-template-columns: 1fr !important; }
      .zj-lead-section-title { font-size: 24px !important; }
    }
  `;
  document.head.appendChild(style);
}

export function _startCounters() {
  const self = this;
  const targets = { range: 800, speed: 29, voltage: 1000, sensors: 192 };
  const duration = 2000;
  const steps = 60;
  const interval = duration / steps;
  let step = 0;

  const timer = setInterval(function() {
    step++;
    const progress = step / steps;
    const eased = 1 - Math.pow(1 - progress, 3);

    _customState.counterValues = {
      range: Math.round(targets.range * eased),
      speed: Math.round(targets.speed * eased),
      voltage: Math.round(targets.voltage * eased),
      sensors: Math.round(targets.sensors * eased),
    };

    if (step >= steps) {
      clearInterval(timer);
      _customState.counterValues = { range: 800, speed: 29, voltage: 1000, sensors: 192 };
    }
    self.forceUpdate();
  }, interval);

  _customState._counterTimer = timer;
}

// ============================================================
// 渲染
// ============================================================

export function renderJsx() {
  const { timestamp } = this.state;
  const self = this;

  const navScrolled = _customState.navScrolled;
  const activeModel = _customState.activeModel;
  const activeTech = _customState.activeTech;
  const counterValues = _customState.counterValues;
  const mobileMenuOpen = _customState.mobileMenuOpen;
  const leadModalOpen = _customState.leadModalOpen;
  const leadModalType = _customState.leadModalType;
  const leadModalModel = _customState.leadModalModel;
  const leadSubmitting = _customState.leadSubmitting;
  const leadSubmitSuccess = _customState.leadSubmitSuccess;

  // ---- 样式对象 ----
  const S = {
    root: { fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'PingFang SC', sans-serif", background: '#000', color: '#fff', overflowX: 'hidden', minHeight: '100vh' },

    // 导航
    nav: { position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999, transition: 'background 0.4s ease', background: navScrolled ? 'rgba(0,0,0,0.85)' : 'transparent', backdropFilter: navScrolled ? 'blur(20px)' : 'none', WebkitBackdropFilter: navScrolled ? 'blur(20px)' : 'none', borderBottom: navScrolled ? '1px solid rgba(255,255,255,0.08)' : 'none' },
    navInner: { maxWidth: '1200px', margin: '0 auto', padding: '0 24px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    navLogo: { display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', textDecoration: 'none', fontWeight: '600', fontSize: '18px', letterSpacing: '0.05em' },
    navLinks: { display: 'flex', gap: '32px', listStyle: 'none' },
    navLink: { color: 'rgba(255,255,255,0.85)', fontSize: '13px', fontWeight: '400', textDecoration: 'none', letterSpacing: '0.02em', cursor: 'pointer', transition: 'color 0.2s' },
    navActions: { display: 'flex', gap: '12px', alignItems: 'center' },
    navBtnGhost: { padding: '7px 16px', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '20px', color: '#fff', fontSize: '13px', background: 'transparent', cursor: 'pointer', transition: 'all 0.3s' },
    navBtnPrimary: { padding: '7px 16px', background: '#fff', borderRadius: '20px', color: '#000', fontSize: '13px', fontWeight: '500', border: 'none', cursor: 'pointer', transition: 'all 0.3s' },
    hamburger: { display: 'none', flexDirection: 'column', gap: '5px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' },
    hamburgerLine: { width: '22px', height: '1.5px', background: '#fff', borderRadius: '2px', transition: 'all 0.3s' },

    // 移动端菜单
    mobileMenu: { position: 'fixed', top: '52px', left: 0, right: 0, background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', zIndex: 9998, padding: '20px 24px 32px', borderBottom: '1px solid rgba(255,255,255,0.1)' },
    mobileMenuItem: { display: 'block', padding: '14px 0', color: 'rgba(255,255,255,0.85)', fontSize: '17px', fontWeight: '400', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' },

    // Hero
    hero: { position: 'relative', height: '100vh', minHeight: '700px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: 'linear-gradient(180deg, #0a0e1a 0%, #050810 50%, #000 100%)' },
    heroBg: { position: 'absolute', inset: 0, overflow: 'hidden' },
    heroGlow1: { position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '400px', background: 'radial-gradient(ellipse, rgba(60,100,200,0.25) 0%, transparent 70%)', animation: 'zjPulse 4s ease-in-out infinite' },
    heroGlow2: { position: 'absolute', bottom: '10%', left: '20%', width: '400px', height: '300px', background: 'radial-gradient(ellipse, rgba(100,60,200,0.15) 0%, transparent 70%)', animation: 'zjPulse 5s ease-in-out infinite 1s' },
    heroContent: { position: 'relative', zIndex: 2, textAlign: 'center', padding: '0 24px', maxWidth: '900px' },
    heroBadge: { display: 'inline-block', padding: '6px 16px', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '20px', fontSize: '12px', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '28px', background: 'rgba(255,255,255,0.05)' },
    heroTitle: { fontSize: '80px', fontWeight: '700', lineHeight: '1.05', letterSpacing: '-0.03em', marginBottom: '8px', background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' },
    heroSub: { fontSize: '48px', fontWeight: '300', color: 'rgba(255,255,255,0.5)', letterSpacing: '-0.02em', marginBottom: '28px', display: 'block' },
    heroDesc: { fontSize: '17px', color: 'rgba(255,255,255,0.55)', lineHeight: '1.7', marginBottom: '44px', fontWeight: '300' },
    heroActions: { display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' },
    btnPrimary: { padding: '14px 32px', background: '#fff', color: '#000', border: 'none', borderRadius: '30px', fontSize: '15px', fontWeight: '500', cursor: 'pointer', letterSpacing: '0.01em', transition: 'all 0.3s ease' },
    btnGhost: { padding: '14px 32px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '30px', fontSize: '15px', fontWeight: '400', cursor: 'pointer', transition: 'all 0.3s ease', backdropFilter: 'blur(10px)' },

    // 车型 SVG 区域
    heroCarWrap: { position: 'absolute', bottom: '80px', left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '900px', opacity: 0.9 },

    // 滚动提示
    scrollHint: { position: 'absolute', bottom: '32px', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 2 },
    scrollLine: { width: '1px', height: '40px', background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.5))', animation: 'zjScrollBounce 2s ease-in-out infinite' },
    scrollText: { fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' },

    // 数据条
    statsBar: { background: '#111', padding: '60px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' },
    statsInner: { maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0' },
    statItem: { textAlign: 'center', padding: '0 20px', borderRight: '1px solid rgba(255,255,255,0.08)' },
    statItemLast: { textAlign: 'center', padding: '0 20px' },
    statNum: { fontSize: '56px', fontWeight: '700', letterSpacing: '-0.03em', background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.6) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: '1' },
    statUnit: { fontSize: '20px', fontWeight: '300', color: 'rgba(255,255,255,0.5)', marginLeft: '4px' },
    statLabel: { fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: '10px', letterSpacing: '0.02em' },

    // 通用 section
    sectionHeader: { textAlign: 'center', marginBottom: '64px' },
    sectionEyebrow: { fontSize: '12px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px', display: 'block' },
    sectionTitle: { fontSize: '48px', fontWeight: '700', letterSpacing: '-0.025em', lineHeight: '1.1', marginBottom: '16px' },
    sectionDesc: { fontSize: '17px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.7', maxWidth: '560px', margin: '0 auto', fontWeight: '300' },

    // 车型
    modelsSection: { padding: '120px 24px', background: '#000' },
    modelsGrid: { maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' },
    modelCard: { borderRadius: '20px', overflow: 'hidden', background: 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)', border: '1px solid rgba(255,255,255,0.08)', position: 'relative' },
    modelCardInner: { padding: '40px 36px 36px' },
    modelBadge: { display: 'inline-block', padding: '4px 12px', background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.3)', borderRadius: '12px', fontSize: '11px', color: '#60a5fa', letterSpacing: '0.05em', marginBottom: '20px' },
    modelBadgeNew: { display: 'inline-block', padding: '4px 12px', background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: '12px', fontSize: '11px', color: '#a78bfa', letterSpacing: '0.05em', marginBottom: '20px' },
    modelName: { fontSize: '36px', fontWeight: '700', letterSpacing: '-0.02em', marginBottom: '8px' },
    modelTagline: { fontSize: '15px', color: 'rgba(255,255,255,0.45)', marginBottom: '28px', fontWeight: '300' },
    modelSpecs: { display: 'flex', gap: '24px', marginBottom: '28px' },
    modelSpec: { textAlign: 'center' },
    specVal: { fontSize: '28px', fontWeight: '700', letterSpacing: '-0.02em', display: 'block' },
    specUnit: { fontSize: '13px', color: 'rgba(255,255,255,0.4)', display: 'block' },
    specLabel: { fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '4px', display: 'block' },
    modelPrice: { marginBottom: '24px' },
    priceFrom: { fontSize: '12px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '4px' },
    priceVal: { fontSize: '24px', fontWeight: '600', letterSpacing: '-0.01em' },
    modelActions: { display: 'flex', gap: '12px' },
    btnModelPrimary: { flex: 1, padding: '12px', background: '#fff', color: '#000', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.3s' },
    btnModelGhost: { flex: 1, padding: '12px', background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', fontSize: '14px', cursor: 'pointer', transition: 'all 0.3s' },

    // 技术
    techSection: { padding: '120px 24px', background: '#050810' },
    techTabBar: { display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '64px', flexWrap: 'wrap' },
    techTab: (isActive) => ({
      padding: '10px 24px', borderRadius: '24px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', border: 'none', transition: 'all 0.3s',
      background: isActive ? '#fff' : 'rgba(255,255,255,0.06)',
      color: isActive ? '#000' : 'rgba(255,255,255,0.6)',
    }),
    techContent: { maxWidth: '1100px', margin: '0 auto', display: 'flex', gap: '64px', alignItems: 'center', minHeight: '420px' },
    techText: { flex: 1 },
    techVisual: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    techEyebrow: { fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px', display: 'block' },
    techTitle: { fontSize: '40px', fontWeight: '700', letterSpacing: '-0.025em', lineHeight: '1.1', marginBottom: '20px' },
    techDesc: { fontSize: '16px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.75', marginBottom: '28px', fontWeight: '300' },
    techPoints: { listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' },
    techPoint: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'rgba(255,255,255,0.7)' },
    techDot: (color) => ({ width: '6px', height: '6px', borderRadius: '50%', background: color, flexShrink: 0 }),

    // 雷达可视化
    radarWrap: { position: 'relative', width: '280px', height: '280px' },
    radarRing: (size, opacity) => ({ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: size, height: size, borderRadius: '50%', border: `1px solid rgba(96,165,250,${opacity})` }),
    radarSweep: { position: 'absolute', top: '50%', left: '50%', width: '140px', height: '2px', transformOrigin: '0 50%', background: 'linear-gradient(to right, rgba(96,165,250,0.8), transparent)', animation: 'zjRadarSweep 3s linear infinite', borderRadius: '1px' },
    radarCenter: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '10px', height: '10px', borderRadius: '50%', background: '#60a5fa', boxShadow: '0 0 20px rgba(96,165,250,0.8)' },

    // 座舱可视化
    cockpitWrap: { width: '320px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' },
    cockpitHeader: { padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '8px' },
    cockpitDot: (color) => ({ width: '8px', height: '8px', borderRadius: '50%', background: color }),
    cockpitBody: { padding: '20px 16px' },
    cockpitTime: { fontSize: '40px', fontWeight: '200', letterSpacing: '-0.02em', marginBottom: '16px', color: '#fff' },
    cockpitNavBar: { background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: '8px', padding: '8px 12px', marginBottom: '12px', fontSize: '12px', color: '#60a5fa' },
    cockpitCard: { background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '10px 12px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' },
    cockpitCardIcon: { fontSize: '20px' },
    cockpitCardTitle: { fontSize: '12px', color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
    cockpitCardSub: { fontSize: '11px', color: 'rgba(255,255,255,0.4)' },

    // 电驱可视化
    powerWrap: { position: 'relative', width: '280px', height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    powerRing: (size, color, delay) => ({ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: size, height: size, borderRadius: '50%', border: `1.5px solid ${color}`, animation: `zjPowerPulse 2.5s ease-in-out infinite ${delay}` }),
    powerBolt: { position: 'relative', zIndex: 2, fontSize: '64px', filter: 'drop-shadow(0 0 20px rgba(251,191,36,0.6))' },

    // 设计
    designSection: { padding: '120px 24px', background: '#000' },
    designInner: { maxWidth: '1100px', margin: '0 auto', display: 'flex', gap: '80px', alignItems: 'center' },
    designText: { flex: '0 0 380px' },
    designVisual: { flex: 1 },
    designSpecs: { display: 'flex', gap: '32px', marginTop: '40px' },
    designSpecItem: { textAlign: 'center' },
    designSpecVal: { fontSize: '36px', fontWeight: '700', letterSpacing: '-0.02em', display: 'block', background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.5) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' },
    designSpecLabel: { fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '6px', display: 'block' },

    // 体验
    expSection: { padding: '120px 24px', background: '#050810' },
    expGrid: { maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'auto auto', gap: '16px' },
    expCard: { borderRadius: '16px', overflow: 'hidden', position: 'relative', minHeight: '220px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' },
    expCardLarge: { gridColumn: 'span 2', minHeight: '280px' },
    expCardContent: { position: 'relative', zIndex: 2, padding: '28px', background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)' },
    expIcon: { fontSize: '28px', marginBottom: '10px', display: 'block' },
    expTitle: { fontSize: '20px', fontWeight: '600', marginBottom: '8px' },
    expDesc: { fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.6', fontWeight: '300' },

    // 购买
    buySection: { padding: '120px 24px', background: '#000' },
    buyInner: { maxWidth: '1100px', margin: '0 auto', display: 'flex', gap: '80px', alignItems: 'flex-start' },
    buyText: { flex: '0 0 380px' },
    buyTitle: { fontSize: '44px', fontWeight: '700', letterSpacing: '-0.025em', lineHeight: '1.15', marginBottom: '20px' },
    buyDesc: { fontSize: '16px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.75', marginBottom: '36px', fontWeight: '300' },
    buyFeatures: { display: 'flex', flexDirection: 'column', gap: '16px' },
    buyFeature: { display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: 'rgba(255,255,255,0.7)' },
    buyCards: { flex: 1, display: 'flex', gap: '16px' },
    buyCard: { flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '32px 24px', display: 'flex', flexDirection: 'column' },
    buyCardFeatured: { flex: 1, background: 'linear-gradient(135deg, rgba(96,165,250,0.08) 0%, rgba(167,139,250,0.08) 100%)', border: '1px solid rgba(96,165,250,0.25)', borderRadius: '20px', padding: '32px 24px', display: 'flex', flexDirection: 'column' },
    buyCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' },
    buyCardName: { fontSize: '22px', fontWeight: '700' },
    buyCardBadge: { padding: '4px 10px', background: 'rgba(255,255,255,0.08)', borderRadius: '10px', fontSize: '11px', color: 'rgba(255,255,255,0.6)' },
    buyCardBadgeHot: { padding: '4px 10px', background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.3)', borderRadius: '10px', fontSize: '11px', color: '#60a5fa' },
    buyCardPrice: { marginBottom: '24px' },
    buyPriceLabel: { fontSize: '12px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '4px' },
    buyPriceMain: { fontSize: '28px', fontWeight: '700', letterSpacing: '-0.02em' },
    buyCardFeatures: { listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px', flex: 1 },
    buyCardFeatureItem: { fontSize: '13px', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: '8px' },
    btnBuyPrimary: { width: '100%', padding: '13px', background: '#fff', color: '#000', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', marginBottom: '10px', transition: 'all 0.3s' },
    btnBuyGhost: { width: '100%', padding: '13px', background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', fontSize: '14px', cursor: 'pointer', transition: 'all 0.3s' },

    // 关于
    aboutSection: { padding: '100px 24px', background: 'linear-gradient(180deg, #050810 0%, #000 100%)', textAlign: 'center' },
    aboutLogo: { fontSize: '48px', marginBottom: '20px', display: 'block' },
    aboutTitle: { fontSize: '36px', fontWeight: '700', letterSpacing: '-0.02em', marginBottom: '20px' },
    aboutDesc: { fontSize: '16px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.8', maxWidth: '600px', margin: '0 auto 40px', fontWeight: '300' },
    aboutPartners: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px' },
    partnerItem: { textAlign: 'center' },
    partnerLogo: { fontSize: '20px', fontWeight: '700', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.8)', marginBottom: '6px' },
    partnerLabel: { fontSize: '12px', color: 'rgba(255,255,255,0.4)' },
    partnerDivider: { fontSize: '24px', color: 'rgba(255,255,255,0.2)', fontWeight: '300' },

    // 页脚
    footer: { background: '#111', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '60px 24px 32px' },
    footerInner: { maxWidth: '1100px', margin: '0 auto' },
    footerTop: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: '40px', marginBottom: '48px' },
    footerBrand: { display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontWeight: '600', fontSize: '16px', marginBottom: '12px' },
    footerBrandDesc: { fontSize: '13px', color: 'rgba(255,255,255,0.35)', lineHeight: '1.6' },
    footerGroupTitle: { fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginBottom: '16px', letterSpacing: '0.02em' },
    footerLinks: { listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' },
    footerLink: { fontSize: '13px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none', cursor: 'pointer', transition: 'color 0.2s' },
    footerBottom: { borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' },
    footerCopy: { fontSize: '12px', color: 'rgba(255,255,255,0.3)' },
    footerLegal: { display: 'flex', gap: '20px' },
    footerLegalLink: { fontSize: '12px', color: 'rgba(255,255,255,0.3)', textDecoration: 'none', cursor: 'pointer' },

    // 留资弹窗
    leadOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', animation: 'zjFadeIn 0.25s ease' },
    leadModal: { background: 'linear-gradient(145deg, #0d1117 0%, #111827 100%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '40px', width: '100%', maxWidth: '480px', position: 'relative', animation: 'zjSlideUp 0.3s cubic-bezier(0.16,1,0.3,1)' },
    leadCloseBtn: { position: 'absolute', top: '16px', right: '16px', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: '1' },
    leadTitle: { fontSize: '24px', fontWeight: '700', marginBottom: '6px', letterSpacing: '-0.02em' },
    leadSubtitle: { fontSize: '14px', color: 'rgba(255,255,255,0.45)', marginBottom: '28px' },
    leadFieldGroup: { marginBottom: '16px' },
    leadLabel: { display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '6px', fontWeight: '500', letterSpacing: '0.02em' },
    leadInput: { width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
    leadTextarea: { width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '14px', outline: 'none', resize: 'vertical', minHeight: '80px', boxSizing: 'border-box', fontFamily: 'inherit' },
    leadRadioGroup: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
    leadRadioBtn: (active) => ({ padding: '7px 14px', borderRadius: '8px', border: active ? '1px solid rgba(96,165,250,0.6)' : '1px solid rgba(255,255,255,0.12)', background: active ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.04)', color: active ? '#60a5fa' : 'rgba(255,255,255,0.6)', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }),
    leadSubmitBtn: { width: '100%', padding: '14px', background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginTop: '24px', letterSpacing: '0.02em' },
    leadSubmitBtnDisabled: { width: '100%', padding: '14px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '12px', color: 'rgba(255,255,255,0.3)', fontSize: '15px', fontWeight: '600', cursor: 'not-allowed', marginTop: '24px', letterSpacing: '0.02em' },
    leadSuccessWrap: { textAlign: 'center', padding: '20px 0' },
    leadSuccessIcon: { fontSize: '56px', marginBottom: '16px', display: 'block' },
    leadSuccessTitle: { fontSize: '22px', fontWeight: '700', marginBottom: '8px' },
    leadSuccessDesc: { fontSize: '14px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.6' },

    // 留资区块
    leadSection: { padding: '100px 24px', background: 'linear-gradient(180deg, #050810 0%, #000 100%)' },
    leadSectionInner: { maxWidth: '900px', margin: '0 auto', textAlign: 'center' },
    leadSectionTitle: { fontSize: '40px', fontWeight: '700', letterSpacing: '-0.025em', marginBottom: '16px' },
    leadSectionDesc: { fontSize: '16px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.75', marginBottom: '48px', fontWeight: '300' },
    leadSectionBtns: { display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' },
    leadSectionBtnPrimary: { padding: '16px 40px', background: '#fff', color: '#000', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', letterSpacing: '0.02em' },
    leadSectionBtnGhost: { padding: '16px 40px', background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '12px', fontSize: '15px', cursor: 'pointer', letterSpacing: '0.02em' },
  };

  // ---- 车型 SVG（简洁侧视图）----
  const renderCarSvg = (colorStart, colorEnd, glowColor) => (
    <svg viewBox="0 0 500 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto' }}>
      <path d="M60 130 C60 130 90 100 130 90 C160 83 200 80 240 78 C280 76 320 77 355 82 C390 87 415 98 430 112 C445 126 450 138 450 145 L450 155 C450 160 445 163 440 163 L70 163 C65 163 60 160 60 155 Z" fill={`url(#cg${glowColor})`} stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
      <path d="M145 90 C162 73 188 60 222 54 C252 49 284 48 312 50 C340 52 364 61 381 73 C398 85 408 97 410 103 L145 103 Z" fill={`url(#cr${glowColor})`}/>
      <path d="M153 100 C167 82 192 67 222 61 C249 56 278 55 305 57 C330 59 352 68 368 79 C382 89 390 99 392 103 Z" fill="rgba(100,160,220,0.3)"/>
      <circle cx="370" cy="163" r="30" fill="#111" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"/>
      <circle cx="370" cy="163" r="20" fill="#0a0a0a" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
      <circle cx="370" cy="163" r="9" fill="url(#ch)"/>
      <circle cx="140" cy="163" r="30" fill="#111" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"/>
      <circle cx="140" cy="163" r="20" fill="#0a0a0a" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
      <circle cx="140" cy="163" r="9" fill="url(#ch)"/>
      <ellipse cx="255" cy="185" rx="155" ry="10" fill={`url(#cs${glowColor})`} opacity="0.5"/>
      <defs>
        <linearGradient id={`cg${glowColor}`} x1="60" y1="100" x2="450" y2="163" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={colorStart}/>
          <stop offset="100%" stopColor={colorEnd}/>
        </linearGradient>
        <linearGradient id={`cr${glowColor}`} x1="145" y1="48" x2="410" y2="103" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={colorStart} stopOpacity="0.9"/>
          <stop offset="100%" stopColor={colorEnd} stopOpacity="0.7"/>
        </linearGradient>
        <radialGradient id="ch" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#aaa"/>
          <stop offset="100%" stopColor="#333"/>
        </radialGradient>
        <radialGradient id={`cs${glowColor}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={glowColor} stopOpacity="0.6"/>
          <stop offset="100%" stopColor={glowColor} stopOpacity="0"/>
        </radialGradient>
      </defs>
    </svg>
  );

  // ---- 技术内容 ----
  const techData = {
    adas: {
      eyebrow: 'HUAWEI ADS 3.0',
      eyebrowColor: '#60a5fa',
      title: '高阶智能驾驶',
      desc: '全球首个不依赖高精地图的高阶智能驾驶系统。192 项传感器融合，毫秒级感知决策，实现城区、高速、泊车全场景无缝覆盖。',
      points: ['城区 NCA 全国无图覆盖', '毫米波雷达 + 激光雷达 + 摄像头三重融合', 'OTA 持续进化，越用越聪明'],
      pointColor: '#60a5fa',
      visual: 'radar',
    },
    cockpit: {
      eyebrow: 'HarmonyOS 4.0',
      eyebrowColor: '#34d399',
      title: '鸿蒙智能座舱',
      desc: '全球首款搭载鸿蒙 4.0 的豪华座舱。三屏联动，万物互联，手机、平板、车机无缝流转，打造移动生活新空间。',
      points: ['15.6" 中控 + 12.3" 仪表 + 12" 副驾三屏联动', '小艺语音助手，自然语言全车控制', '华为生态全接入，超 5000 款应用'],
      pointColor: '#34d399',
      visual: 'cockpit',
    },
    power: {
      eyebrow: 'DriveONE 超级电驱',
      eyebrowColor: '#fbbf24',
      title: '1000V 超高压平台',
      desc: '华为 DriveONE 全球首款量产 1000V 超高压电驱系统，充电 5 分钟续航 200km，彻底终结里程焦虑。',
      points: ['峰值功率 600kW，双电机四驱', '5C 超快充，充电 5 分钟续航 200km', '电机效率 98.5%，行业最高水平'],
      pointColor: '#fbbf24',
      visual: 'power',
    },
  };

  const currentTech = techData[activeTech];

  // ---- 雷达可视化 ----
  const renderRadar = () => (
    <div style={S.radarWrap}>
      <div style={S.radarRing(280, 0.08)}></div>
      <div style={S.radarRing(210, 0.12)}></div>
      <div style={S.radarRing(140, 0.18)}></div>
      <div style={S.radarRing(70, 0.25)}></div>
      <div style={S.radarSweep}></div>
      <div style={S.radarCenter}></div>
      {[
        { top: '30%', left: '65%' }, { top: '55%', left: '75%' },
        { top: '20%', left: '40%' }, { top: '70%', left: '35%' },
        { top: '45%', left: '20%' }, { top: '60%', left: '58%' },
      ].map(function(pos, i) {
        return (
          <div key={i} style={{ position: 'absolute', top: pos.top, left: pos.left, width: '6px', height: '6px', borderRadius: '50%', background: '#60a5fa', boxShadow: '0 0 8px rgba(96,165,250,0.8)', animation: `zjRadarDot ${1.5 + i * 0.3}s ease-in-out infinite ${i * 0.2}s` }}></div>
        );
      })}
    </div>
  );

  // ---- 座舱可视化 ----
  const renderCockpit = () => (
    <div style={S.cockpitWrap}>
      <div style={S.cockpitHeader}>
        <div style={S.cockpitDot('#ff5f57')}></div>
        <div style={S.cockpitDot('#febc2e')}></div>
        <div style={S.cockpitDot('#28c840')}></div>
        <span style={{ marginLeft: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>鸿蒙座舱</span>
      </div>
      <div style={S.cockpitBody}>
        <div style={S.cockpitTime}>14:28</div>
        <div style={S.cockpitNavBar}>🗺 导航中 · 预计 12 分钟到达</div>
        <div style={S.cockpitCard}>
          <span style={S.cockpitCardIcon}>🎵</span>
          <div>
            <div style={S.cockpitCardTitle}>正在播放</div>
            <div style={S.cockpitCardSub}>华为音乐 · 精选歌单</div>
          </div>
        </div>
        <div style={S.cockpitCard}>
          <span style={S.cockpitCardIcon}>🔋</span>
          <div>
            <div style={S.cockpitCardTitle}>续航 648 km</div>
            <div style={S.cockpitCardSub}>充电 81% · 舒适模式</div>
          </div>
        </div>
        <div style={S.cockpitCard}>
          <span style={S.cockpitCardIcon}>🌡️</span>
          <div>
            <div style={S.cockpitCardTitle}>车内 22°C</div>
            <div style={S.cockpitCardSub}>四区独立空调</div>
          </div>
        </div>
      </div>
    </div>
  );

  // ---- 电驱可视化 ----
  const renderPower = () => (
    <div style={S.powerWrap}>
      <div style={S.powerRing('280px', 'rgba(251,191,36,0.08)', '0s')}></div>
      <div style={S.powerRing('210px', 'rgba(251,191,36,0.12)', '0.4s')}></div>
      <div style={S.powerRing('140px', 'rgba(251,191,36,0.2)', '0.8s')}></div>
      <div style={S.powerRing('80px', 'rgba(251,191,36,0.3)', '1.2s')}></div>
      <div style={S.powerBolt}>⚡</div>
    </div>
  );

  // ---- 体验卡片背景 ----
  const expBgs = [
    'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    'linear-gradient(135deg, #1a0a2e 0%, #2d1b69 100%)',
    'linear-gradient(135deg, #0a1628 0%, #1a3a5c 100%)',
    'linear-gradient(135deg, #0d1117 0%, #1c2a3a 100%)',
    'linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 50%, #0a1a2a 100%)',
  ];

  // ---- 主渲染 ----
  return (
    <div className="zj-root" style={S.root}>
      <div style={{ display: 'none' }}>{timestamp}</div>

      {/* ===== 导航栏 ===== */}
      <nav className={`zj-nav${navScrolled ? ' scrolled' : ''}`} style={S.nav}>
        <div style={S.navInner}>
          {/* Logo */}
          <div style={S.navLogo}>
            <span style={{ fontSize: '22px' }}>◆</span>
            <span>尊界</span>
          </div>

          {/* 导航链接 */}
          <ul className="zj-nav-links" style={S.navLinks}>
            {['车型', '技术', '设计', '体验', '关于'].map(function(item, i) {
              const anchors = ['models', 'tech', 'design', 'experience', 'about'];
              return (
                <li key={i}>
                  <a
                    href={'#zj-' + anchors[i]}
                    style={S.navLink}
                    onClick={function(e) {
                      e.preventDefault();
                      const el = document.getElementById('zj-' + anchors[i]);
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >{item}</a>
                </li>
              );
            })}
          </ul>

          {/* 操作按钮 */}
          <div className="zj-nav-actions" style={S.navActions}>
            <button className="zj-btn-ghost" style={S.navBtnGhost} onClick={() => self.openLeadModal('预约试驾', '尊界 S9')}>预约试驾</button>
            <button className="zj-btn-primary" style={S.navBtnPrimary} onClick={() => self.openLeadModal('立即订购', '尊界 S9')}>立即订购</button>
          </div>

          {/* 汉堡菜单 */}
          <button
            className="zj-hamburger"
            style={S.hamburger}
            onClick={() => self.setCustomState({ mobileMenuOpen: !mobileMenuOpen })}
          >
            <span style={S.hamburgerLine}></span>
            <span style={S.hamburgerLine}></span>
            <span style={S.hamburgerLine}></span>
          </button>
        </div>

        {/* 移动端菜单 */}
        {mobileMenuOpen && (
          <div className="zj-mobile-menu" style={S.mobileMenu}>
            {['车型', '技术', '设计', '体验', '关于'].map(function(item, i) {
              const anchors = ['models', 'tech', 'design', 'experience', 'about'];
              return (
                <a
                  key={i}
                  style={S.mobileMenuItem}
                  onClick={function() {
                    self.setCustomState({ mobileMenuOpen: false });
                    const el = document.getElementById('zj-' + anchors[i]);
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                >{item}</a>
              );
            })}
            <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
              <button style={{ ...S.navBtnGhost, flex: 1 }} onClick={() => self.openLeadModal('预约试驾', '尊界 S9')}>预约试驾</button>
              <button style={{ ...S.navBtnPrimary, flex: 1 }} onClick={() => self.openLeadModal('立即订购', '尊界 S9')}>立即订购</button>
            </div>
          </div>
        )}
      </nav>

      {/* ===== HERO 首屏 ===== */}
      <section style={S.hero}>
        {/* 背景光晕 */}
        <div style={S.heroBg}>
          <div style={S.heroGlow1}></div>
          <div style={S.heroGlow2}></div>
          {/* 星点 */}
          {Array.from({ length: 30 }).map(function(_, i) {
            return (
              <div key={i} style={{
                position: 'absolute',
                top: (Math.sin(i * 137.5) * 0.5 + 0.5) * 100 + '%',
                left: (Math.cos(i * 137.5) * 0.5 + 0.5) * 100 + '%',
                width: i % 3 === 0 ? '2px' : '1px',
                height: i % 3 === 0 ? '2px' : '1px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,' + (0.2 + (i % 5) * 0.1) + ')',
                animation: 'zjFloat ' + (3 + i % 4) + 's ease-in-out infinite ' + (i * 0.2) + 's',
              }}></div>
            );
          })}
        </div>

        {/* 主内容 */}
        <div style={S.heroContent}>
          <div className="zj-reveal" style={S.heroBadge}>2025 全新旗舰</div>
          <h1 className="zj-reveal zj-reveal-delay-1 zj-hero-title" style={{ ...S.heroTitle, fontSize: '80px' }}>
            尊界 S9
          </h1>
          <span className="zj-reveal zj-reveal-delay-1 zj-hero-sub" style={S.heroSub}>超越想象</span>
          <p className="zj-reveal zj-reveal-delay-2 zj-hero-desc" style={S.heroDesc}>
            华为全栈智能技术 · 纯电续航 800km · 零百加速 2.9s<br/>
            重新定义中国豪华轿车的边界
          </p>
          <div className="zj-reveal zj-reveal-delay-3 zj-hero-actions" style={S.heroActions}>
            <button
              className="zj-btn-primary"
              style={S.btnPrimary}
              onClick={function() {
                const el = document.getElementById('zj-models');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >探索车型</button>
            <button
              className="zj-btn-ghost"
              style={S.btnGhost}
              onClick={function() {
                const el = document.getElementById('zj-tech');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >▶ 了解技术</button>
          </div>
        </div>

        {/* 车型轮廓 SVG */}
        <div className="zj-hero-car-wrap" style={S.heroCarWrap}>
          <svg viewBox="0 0 900 320" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto', opacity: 0.85 }}>
            <path d="M120 220 C120 220 160 165 240 145 C280 135 340 128 420 124 C500 120 580 122 640 128 C700 134 740 148 770 168 C800 188 810 210 810 222 L810 238 C810 246 802 250 794 250 L136 250 C128 250 120 246 120 238 Z" fill="url(#hbg)" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5"/>
            <path d="M258 145 C278 118 318 96 378 84 C428 74 490 71 545 74 C600 77 645 90 678 108 C711 126 728 145 732 155 L258 155 Z" fill="url(#hrg)" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
            <path d="M270 152 C288 128 324 108 378 96 C424 86 482 83 534 86 C582 89 622 101 650 118 C674 133 686 148 688 154 Z" fill="rgba(80,130,200,0.28)"/>
            <line x1="460" y1="155" x2="456" y2="250" stroke="rgba(255,255,255,0.05)" strokeWidth="1.5"/>
            <line x1="590" y1="153" x2="588" y2="250" stroke="rgba(255,255,255,0.05)" strokeWidth="1.5"/>
            <ellipse cx="780" cy="198" rx="18" ry="6" fill="url(#hlg)" opacity="0.95"/>
            <path d="M772 190 L800 190" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
            <ellipse cx="148" cy="200" rx="16" ry="5" fill="url(#htlg)" opacity="0.9"/>
            <circle cx="660" cy="250" r="52" fill="#0d0d0d" stroke="rgba(255,255,255,0.12)" strokeWidth="2"/>
            <circle cx="660" cy="250" r="38" fill="#080808" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5"/>
            <circle cx="660" cy="250" r="18" fill="url(#hhg)"/>
            <line x1="660" y1="232" x2="660" y2="250" stroke="rgba(255,255,255,0.25)" strokeWidth="2"/>
            <line x1="678" y1="250" x2="660" y2="250" stroke="rgba(255,255,255,0.25)" strokeWidth="2"/>
            <line x1="660" y1="268" x2="660" y2="250" stroke="rgba(255,255,255,0.25)" strokeWidth="2"/>
            <line x1="642" y1="250" x2="660" y2="250" stroke="rgba(255,255,255,0.25)" strokeWidth="2"/>
            <circle cx="248" cy="250" r="52" fill="#0d0d0d" stroke="rgba(255,255,255,0.12)" strokeWidth="2"/>
            <circle cx="248" cy="250" r="38" fill="#080808" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5"/>
            <circle cx="248" cy="250" r="18" fill="url(#hhg)"/>
            <line x1="248" y1="232" x2="248" y2="250" stroke="rgba(255,255,255,0.25)" strokeWidth="2"/>
            <line x1="266" y1="250" x2="248" y2="250" stroke="rgba(255,255,255,0.25)" strokeWidth="2"/>
            <line x1="248" y1="268" x2="248" y2="250" stroke="rgba(255,255,255,0.25)" strokeWidth="2"/>
            <line x1="230" y1="250" x2="248" y2="250" stroke="rgba(255,255,255,0.25)" strokeWidth="2"/>
            <path d="M180 210 C330 198 530 194 720 202" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" fill="none"/>
            <ellipse cx="454" cy="290" rx="270" ry="16" fill="url(#hsg)" opacity="0.4"/>
            <defs>
              <linearGradient id="hbg" x1="120" y1="165" x2="810" y2="250" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#141820"/>
                <stop offset="40%" stopColor="#1e2840"/>
                <stop offset="100%" stopColor="#141820"/>
              </linearGradient>
              <linearGradient id="hrg" x1="258" y1="71" x2="732" y2="155" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#1a2030"/>
                <stop offset="100%" stopColor="#1e2840"/>
              </linearGradient>
              <linearGradient id="hlg" x1="762" y1="192" x2="798" y2="204" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#ffffff"/>
                <stop offset="100%" stopColor="#a0c8ff"/>
              </linearGradient>
              <linearGradient id="htlg" x1="132" y1="195" x2="164" y2="205" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#ff3333"/>
                <stop offset="100%" stopColor="#ff8888"/>
              </linearGradient>
              <radialGradient id="hhg" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#aaaaaa"/>
                <stop offset="50%" stopColor="#555555"/>
                <stop offset="100%" stopColor="#222222"/>
              </radialGradient>
              <radialGradient id="hsg" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#4a6fa5" stopOpacity="0.7"/>
                <stop offset="100%" stopColor="#4a6fa5" stopOpacity="0"/>
              </radialGradient>
            </defs>
          </svg>
        </div>

        {/* 滚动提示 */}
        <div style={S.scrollHint}>
          <div style={S.scrollLine}></div>
          <span style={S.scrollText}>向下探索</span>
        </div>
      </section>

      {/* ===== 数据亮点条 ===== */}
      <section id="zj-stats-bar" style={S.statsBar}>
        <div className="zj-stats-grid" style={S.statsInner}>
          {[
            { val: counterValues.range, unit: 'km', label: 'CLTC 纯电续航', last: false },
            { val: (counterValues.speed / 10).toFixed(1), unit: 's', label: '零百加速', last: false },
            { val: counterValues.voltage, unit: 'V', label: '高压平台电压', last: false },
            { val: counterValues.sensors, unit: '项', label: '华为智驾传感器', last: true },
          ].map(function(item, i) {
            return (
              <div key={i} className="zj-reveal" style={item.last ? S.statItemLast : S.statItem}>
                <div>
                  <span style={S.statNum}>{item.val}</span>
                  <span style={S.statUnit}>{item.unit}</span>
                </div>
                <p style={S.statLabel}>{item.label}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ===== 车型展示 ===== */}
      <section id="zj-models" style={S.modelsSection}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div className="zj-reveal" style={S.sectionHeader}>
            <span style={S.sectionEyebrow}>车型阵容</span>
            <h2 style={S.sectionTitle}>选择你的尊界</h2>
            <p style={S.sectionDesc}>每一款车型，都是对极致的重新诠释</p>
          </div>

          <div className="zj-models-grid" style={S.modelsGrid}>
            {/* S9 */}
            <div className="zj-reveal zj-model-card" style={S.modelCard}>
              <div style={S.modelCardInner}>
                <div style={S.modelBadge}>旗舰</div>
                <h3 style={S.modelName}>尊界 S9</h3>
                <p style={S.modelTagline}>超越想象的旗舰轿车</p>
                <div style={S.modelSpecs}>
                  {[['800', 'km', '续航'], ['2.9', 's', '零百'], ['1000', 'V', '高压']].map(function(spec, i) {
                    return (
                      <div key={i} style={S.modelSpec}>
                        <span style={S.specVal}>{spec[0]}</span>
                        <span style={S.specUnit}>{spec[1]}</span>
                        <span style={S.specLabel}>{spec[2]}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ margin: '20px 0' }}>
                  {renderCarSvg('#1e2d4a', '#2a3f6a', '#4a80d4')}
                </div>
                <div style={S.modelPrice}>
                  <span style={S.priceFrom}>起售价</span>
                  <span style={S.priceVal}>¥ 79.8 万</span>
                </div>
                <div style={S.modelActions}>
                  <button style={S.btnModelPrimary} onClick={() => self.openLeadModal('立即订购', '尊界 S9')}>立即订购</button>
                  <button style={S.btnModelGhost} onClick={() => self.openLeadModal('了解更多', '尊界 S9')}>了解更多</button>
                </div>
              </div>
            </div>

            {/* S7 */}
            <div className="zj-reveal zj-reveal-delay-1 zj-model-card" style={S.modelCard}>
              <div style={S.modelCardInner}>
                <div style={S.modelBadgeNew}>新款</div>
                <h3 style={S.modelName}>尊界 S7</h3>
                <p style={S.modelTagline}>智能豪华的全新标杆</p>
                <div style={S.modelSpecs}>
                  {[['720', 'km', '续航'], ['3.5', 's', '零百'], ['800', 'V', '高压']].map(function(spec, i) {
                    return (
                      <div key={i} style={S.modelSpec}>
                        <span style={S.specVal}>{spec[0]}</span>
                        <span style={S.specUnit}>{spec[1]}</span>
                        <span style={S.specLabel}>{spec[2]}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ margin: '20px 0' }}>
                  {renderCarSvg('#2a1e4a', '#3d2a6a', '#8a4ad4')}
                </div>
                <div style={S.modelPrice}>
                  <span style={S.priceFrom}>起售价</span>
                  <span style={S.priceVal}>¥ 54.8 万</span>
                </div>
                <div style={S.modelActions}>
                  <button style={S.btnModelPrimary} onClick={() => self.openLeadModal('立即订购', '尊界 S7')}>立即订购</button>
                  <button style={S.btnModelGhost} onClick={() => self.openLeadModal('了解更多', '尊界 S7')}>了解更多</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 技术亮点 ===== */}
      <section id="zj-tech" style={S.techSection}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div className="zj-reveal" style={S.sectionHeader}>
            <span style={S.sectionEyebrow}>核心技术</span>
            <h2 style={S.sectionTitle}>华为全栈智能</h2>
            <p style={S.sectionDesc}>从感知到决策，从动力到座舱，每一个维度都由华为重新定义</p>
          </div>

          {/* Tab 切换 */}
          <div className="zj-tech-tab-bar" style={S.techTabBar}>
            {[
              { key: 'adas', label: '🚗 智能驾驶' },
              { key: 'cockpit', label: '📱 鸿蒙座舱' },
              { key: 'power', label: '⚡ 超级电驱' },
            ].map(function(tab) {
              return (
                <button
                  key={tab.key}
                  className="zj-tech-tab"
                  style={S.techTab(activeTech === tab.key)}
                  onClick={() => self.setCustomState({ activeTech: tab.key })}
                >{tab.label}</button>
              );
            })}
          </div>

          {/* 技术内容 */}
          <div className="zj-reveal zj-tech-content" style={S.techContent}>
            <div style={S.techText}>
              <span style={{ ...S.techEyebrow, color: currentTech.eyebrowColor }}>{currentTech.eyebrow}</span>
              <h3 style={S.techTitle}>{currentTech.title}</h3>
              <p style={S.techDesc}>{currentTech.desc}</p>
              <ul style={S.techPoints}>
                {currentTech.points.map(function(point, i) {
                  return (
                    <li key={i} style={S.techPoint}>
                      <div style={S.techDot(currentTech.pointColor)}></div>
                      {point}
                    </li>
                  );
                })}
              </ul>
            </div>
            <div style={S.techVisual}>
              {activeTech === 'adas' && renderRadar()}
              {activeTech === 'cockpit' && renderCockpit()}
              {activeTech === 'power' && renderPower()}
            </div>
          </div>
        </div>
      </section>

      {/* ===== 设计美学 ===== */}
      <section id="zj-design" style={S.designSection}>
        <div className="zj-design-inner" style={S.designInner}>
          <div className="zj-reveal" style={S.designText}>
            <span style={S.sectionEyebrow}>设计哲学</span>
            <h2 style={{ ...S.sectionTitle, textAlign: 'left', fontSize: '44px' }}>流动的<br/>力量美学</h2>
            <p style={{ ...S.sectionDesc, textAlign: 'left', margin: '0 0 0 0', maxWidth: '360px' }}>
              尊界的设计语言源于"流动"——空气的流动、力量的流动、时间的流动。每一条线条都经过数千次风洞测试，在极致美学与极低风阻之间找到完美平衡。
            </p>
            <div className="zj-design-specs" style={S.designSpecs}>
              {[['0.19', 'Cd 风阻系数'], ['5168', 'mm 车长'], ['1460', 'mm 车高']].map(function(item, i) {
                return (
                  <div key={i} style={S.designSpecItem}>
                    <span style={S.designSpecVal}>{item[0]}</span>
                    <span style={S.designSpecLabel}>{item[1]}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="zj-reveal zj-reveal-delay-2" style={S.designVisual}>
            <svg viewBox="0 0 900 380" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto' }}>
              <line x1="50" y1="320" x2="850" y2="320" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
              <path d="M130 280 C130 280 175 218 265 195 C315 182 390 174 480 170 C570 166 660 168 730 176 C800 184 845 202 875 225 C905 248 915 272 915 285 L915 300 C915 308 908 312 900 312 L150 312 C142 312 130 308 130 300 Z" fill="url(#dbg)" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5"/>
              <path d="M285 195 C308 164 352 138 415 124 C468 112 535 108 598 111 C661 114 712 129 748 150 C784 171 805 193 812 204 L285 204 Z" fill="url(#drg)" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
              <path d="M298 200 C318 174 358 152 415 140 C464 130 528 127 588 130 C642 133 688 147 718 164 C744 179 758 196 762 202 Z" fill="rgba(80,130,200,0.25)"/>
              <line x1="510" y1="204" x2="506" y2="312" stroke="rgba(255,255,255,0.04)" strokeWidth="1.5"/>
              <line x1="640" y1="202" x2="638" y2="312" stroke="rgba(255,255,255,0.04)" strokeWidth="1.5"/>
              <path d="M875 238 C885 235 905 238 912 245 C918 252 916 260 908 263 C900 266 882 264 875 258 Z" fill="url(#dlg)" opacity="0.95"/>
              <path d="M870 228 L905 228" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
              <path d="M135 242 C128 238 120 240 118 248 C116 256 122 264 132 266 C142 268 155 265 158 258 Z" fill="url(#dtlg)" opacity="0.9"/>
              <circle cx="760" cy="312" r="58" fill="#0d0d0d" stroke="rgba(255,255,255,0.12)" strokeWidth="2"/>
              <circle cx="760" cy="312" r="42" fill="#080808" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5"/>
              <circle cx="760" cy="312" r="20" fill="url(#dhg)"/>
              <line x1="760" y1="292" x2="760" y2="312" stroke="rgba(255,255,255,0.25)" strokeWidth="2"/>
              <line x1="780" y1="312" x2="760" y2="312" stroke="rgba(255,255,255,0.25)" strokeWidth="2"/>
              <line x1="760" y1="332" x2="760" y2="312" stroke="rgba(255,255,255,0.25)" strokeWidth="2"/>
              <line x1="740" y1="312" x2="760" y2="312" stroke="rgba(255,255,255,0.25)" strokeWidth="2"/>
              <circle cx="270" cy="312" r="58" fill="#0d0d0d" stroke="rgba(255,255,255,0.12)" strokeWidth="2"/>
              <circle cx="270" cy="312" r="42" fill="#080808" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5"/>
              <circle cx="270" cy="312" r="20" fill="url(#dhg)"/>
              <line x1="270" y1="292" x2="270" y2="312" stroke="rgba(255,255,255,0.25)" strokeWidth="2"/>
              <line x1="290" y1="312" x2="270" y2="312" stroke="rgba(255,255,255,0.25)" strokeWidth="2"/>
              <line x1="270" y1="332" x2="270" y2="312" stroke="rgba(255,255,255,0.25)" strokeWidth="2"/>
              <line x1="250" y1="312" x2="270" y2="312" stroke="rgba(255,255,255,0.25)" strokeWidth="2"/>
              <path d="M200 240 C350 228 550 224 750 232" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" fill="none"/>
              <ellipse cx="515" cy="355" rx="300" ry="18" fill="url(#dsg)" opacity="0.45"/>
              {/* 标注线 */}
              <line x1="540" y1="108" x2="540" y2="80" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3,3"/>
              <circle cx="540" cy="108" r="3" fill="rgba(255,255,255,0.4)"/>
              <text x="548" y="76" fill="rgba(255,255,255,0.4)" fontSize="11" fontFamily="sans-serif">溜背式流线车顶</text>
              <line x1="875" y1="238" x2="910" y2="210" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3,3"/>
              <circle cx="875" cy="238" r="3" fill="rgba(255,255,255,0.4)"/>
              <text x="915" y="208" fill="rgba(255,255,255,0.4)" fontSize="11" fontFamily="sans-serif">矩阵式 LED 大灯</text>
              <line x1="760" y1="354" x2="760" y2="375" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3,3"/>
              <circle cx="760" cy="354" r="3" fill="rgba(255,255,255,0.4)"/>
              <text x="720" y="390" fill="rgba(255,255,255,0.4)" fontSize="11" fontFamily="sans-serif">21" 低风阻轮毂</text>
              <defs>
                <linearGradient id="dbg" x1="130" y1="200" x2="915" y2="312" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#141820"/>
                  <stop offset="40%" stopColor="#1e2840"/>
                  <stop offset="100%" stopColor="#141820"/>
                </linearGradient>
                <linearGradient id="drg" x1="285" y1="108" x2="812" y2="204" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#1a2030"/>
                  <stop offset="100%" stopColor="#1e2840"/>
                </linearGradient>
                <linearGradient id="dlg" x1="875" y1="235" x2="912" y2="263" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#ffffff"/>
                  <stop offset="100%" stopColor="#b0d4ff"/>
                </linearGradient>
                <linearGradient id="dtlg" x1="118" y1="238" x2="158" y2="268" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#ff3333"/>
                  <stop offset="100%" stopColor="#ff7777"/>
                </linearGradient>
                <radialGradient id="dhg" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#aaaaaa"/>
                  <stop offset="50%" stopColor="#555555"/>
                  <stop offset="100%" stopColor="#222222"/>
                </radialGradient>
                <radialGradient id="dsg" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#4a6fa5" stopOpacity="0.6"/>
                  <stop offset="100%" stopColor="#4a6fa5" stopOpacity="0"/>
                </radialGradient>
              </defs>
            </svg>
          </div>
        </div>
      </section>

      {/* ===== 体验区 ===== */}
      <section id="zj-experience" style={S.expSection}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div className="zj-reveal" style={S.sectionHeader}>
            <span style={S.sectionEyebrow}>尊界体验</span>
            <h2 style={S.sectionTitle}>每一次出行，都是享受</h2>
          </div>

          <div className="zj-exp-grid" style={S.expGrid}>
            {[
              { icon: '🎵', title: '帝王级音响', desc: '丹拿 Confidence 音响系统，23 扬声器，1400W 功率，车内音乐厅体验', large: true, bg: expBgs[0] },
              { icon: '💺', title: '零重力座椅', desc: '航空级零重力后排座椅，14 向电动调节，腿托 + 颈枕全包围', large: false, bg: expBgs[1] },
              { icon: '🌡️', title: '四区独立空调', desc: '前后四区独立温控，PM2.5 过滤，负离子净化', large: false, bg: expBgs[2] },
              { icon: '🔒', title: '华为安全体系', desc: '毫米波雷达 + 摄像头双重监测，车内人员感知，儿童遗忘提醒', large: false, bg: expBgs[3] },
              { icon: '🌙', title: '星空全景天幕', desc: '1.8m² 超大全景天幕，UV 隔热 + 电致变色，一键调节透光率，仰望星空从未如此奢华', large: true, bg: expBgs[4] },
            ].map(function(card, i) {
              return (
                <div
                  key={i}
                  className={'zj-reveal zj-exp-card' + (i === 0 ? ' zj-reveal-delay-1' : i === 1 ? ' zj-reveal-delay-2' : '')}
                  style={{ ...S.expCard, ...(card.large ? S.expCardLarge : {}), background: card.bg }}
                >
                  <div style={S.expCardContent}>
                    <span style={S.expIcon}>{card.icon}</span>
                    <h3 style={S.expTitle}>{card.title}</h3>
                    <p style={S.expDesc}>{card.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== 购买引导 ===== */}
      <section id="zj-buy" style={S.buySection}>
        <div className="zj-buy-inner" style={S.buyInner}>
          <div className="zj-reveal zj-buy-text" style={S.buyText}>
            <span style={S.sectionEyebrow}>开启尊界之旅</span>
            <h2 className="zj-buy-title" style={S.buyTitle}>属于你的旗舰，<br/>现在触手可及</h2>
            <p style={S.buyDesc}>全国 200+ 城市体验中心，专属顾问一对一服务，60 天无理由退订，让你的选择没有后顾之忧。</p>
            <div style={S.buyFeatures}>
              {[
                { icon: '⭐', text: '60 天无理由退订' },
                { icon: '⚡', text: '48 小时极速交付' },
                { icon: '🏠', text: '全国 200+ 体验中心' },
                { icon: '🛡️', text: '8 年 / 16 万公里质保' },
              ].map(function(feat, i) {
                return (
                  <div key={i} style={S.buyFeature}>
                    <span style={{ fontSize: '18px' }}>{feat.icon}</span>
                    <span>{feat.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="zj-reveal zj-reveal-delay-2 zj-buy-cards" style={S.buyCards}>
            {/* S9 卡片 */}
            <div className="zj-buy-card" style={S.buyCard}>
              <div style={S.buyCardHeader}>
                <h3 style={S.buyCardName}>尊界 S9</h3>
                <div style={S.buyCardBadge}>旗舰推荐</div>
              </div>
              <div style={S.buyCardPrice}>
                <span style={S.buyPriceLabel}>起售价</span>
                <span style={S.buyPriceMain}>¥79.8万</span>
              </div>
              <ul style={S.buyCardFeatures}>
                {['800km CLTC 续航', '零百加速 2.9s', '1000V 超高压平台', 'HUAWEI ADS 3.0', '丹拿 23 扬声器音响'].map(function(feat, i) {
                  return <li key={i} style={S.buyCardFeatureItem}><span style={{ color: '#60a5fa' }}>✓</span>{feat}</li>;
                })}
              </ul>
              <button style={S.btnBuyPrimary} onClick={() => self.openLeadModal('立即订购', '尊界 S9')}>立即订购</button>
              <button style={S.btnBuyGhost} onClick={() => self.openLeadModal('预约试驾', '尊界 S9')}>预约试驾</button>
            </div>

            {/* S7 卡片（精选） */}
            <div className="zj-buy-card" style={S.buyCardFeatured}>
              <div style={S.buyCardHeader}>
                <h3 style={S.buyCardName}>尊界 S7</h3>
                <div style={S.buyCardBadgeHot}>热销</div>
              </div>
              <div style={S.buyCardPrice}>
                <span style={S.buyPriceLabel}>起售价</span>
                <span style={S.buyPriceMain}>¥54.8万</span>
              </div>
              <ul style={S.buyCardFeatures}>
                {['720km CLTC 续航', '零百加速 3.5s', '800V 高压平台', 'HUAWEI ADS 2.0', '零重力后排座椅'].map(function(feat, i) {
                  return <li key={i} style={S.buyCardFeatureItem}><span style={{ color: '#60a5fa' }}>✓</span>{feat}</li>;
                })}
              </ul>
              <button style={S.btnBuyPrimary} onClick={() => self.openLeadModal('立即订购', '尊界 S7')}>立即订购</button>
              <button style={S.btnBuyGhost} onClick={() => self.openLeadModal('预约试驾', '尊界 S7')}>预约试驾</button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 留资区块 ===== */}
      <section id="zj-lead" style={S.leadSection}>
        <div className="zj-reveal" style={S.leadSectionInner}>
          <span style={S.sectionEyebrow}>专属服务</span>
          <h2 className="zj-lead-section-title" style={S.leadSectionTitle}>预约试驾 · 立即订购</h2>
          <p className="zj-lead-section-desc" style={S.leadSectionDesc}>
            留下您的联系方式，尊界专属顾问将在 24 小时内与您取得联系，<br/>
            为您安排一对一专属试驾体验或购车方案。
          </p>
          <div className="zj-lead-section-btns" style={S.leadSectionBtns}>
            <button style={S.leadSectionBtnPrimary} onClick={() => self.openLeadModal('预约试驾', '尊界 S9')}>立即预约试驾</button>
            <button style={S.leadSectionBtnGhost} onClick={() => self.openLeadModal('立即订购', '暂未决定')}>了解购车方案</button>
          </div>
        </div>
      </section>

      {/* ===== 关于尊界 ===== */}
      <section id="zj-about" style={S.aboutSection}>
        <div className="zj-reveal" style={{ maxWidth: '700px', margin: '0 auto' }}>
          <span style={S.aboutLogo}>◆</span>
          <h2 style={S.aboutTitle}>尊界 ZUNJIE</h2>
          <p style={S.aboutDesc}>
            尊界是华为与江淮汽车联合打造的高端新能源汽车品牌，以"超越想象，驾驭未来"为品牌理念，将华为全栈智能技术与顶级豪华制造工艺深度融合，致力于为用户提供超越同级的智能豪华出行体验。
          </p>
          <div style={S.aboutPartners}>
            <div style={S.partnerItem}>
              <div style={S.partnerLogo}>HUAWEI</div>
              <div style={S.partnerLabel}>智能技术</div>
            </div>
            <div style={S.partnerDivider}>×</div>
            <div style={S.partnerItem}>
              <div style={S.partnerLogo}>JAC</div>
              <div style={S.partnerLabel}>制造工艺</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 页脚 ===== */}
      <footer style={S.footer}>
        <div style={S.footerInner}>
          <div className="zj-footer-top" style={S.footerTop}>
            <div>
              <div style={S.footerBrand}>
                <span>◆</span>
                <span>尊界 ZUNJIE</span>
              </div>
              <p style={S.footerBrandDesc}>超越想象，驾驭未来<br/>华为 × 江淮 · 高端新能源</p>
            </div>
            {[
              { title: '车型', links: ['尊界 S9', '尊界 S7', '车型对比', '配置参数'] },
              { title: '购车', links: ['立即订购', '预约试驾', '金融方案', '体验中心'] },
              { title: '服务', links: ['车主服务', 'OTA 更新', '充电网络', '联系我们'] },
              { title: '关于', links: ['品牌故事', '新闻中心', '社会责任', '加入我们'] },
            ].map(function(group, i) {
              return (
                <div key={i}>
                  <h4 style={S.footerGroupTitle}>{group.title}</h4>
                  <ul style={S.footerLinks}>
                    {group.links.map(function(link, j) {
                      return <li key={j}><a style={S.footerLink}>{link}</a></li>;
                    })}
                  </ul>
                </div>
              );
            })}
          </div>

          <div style={S.footerBottom}>
            <p style={S.footerCopy}>© 2025 尊界汽车 ZUNJIE. 保留所有权利。</p>
            <div style={S.footerLegal}>
              {['隐私政策', '使用条款', 'Cookie 设置'].map(function(item, i) {
                return <a key={i} style={S.footerLegalLink}>{item}</a>;
              })}
            </div>
          </div>
        </div>
      </footer>

      {/* ===== 留资弹窗 ===== */}
      {leadModalOpen && (
        <div className="zj-lead-overlay" style={S.leadOverlay} onClick={function(e) { if (e.target === e.currentTarget) self.closeLeadModal(); }}>
          <div className="zj-lead-modal-box" style={S.leadModal}>
            {/* 关闭按钮 */}
            <button style={S.leadCloseBtn} onClick={() => self.closeLeadModal()}>✕</button>

            {leadSubmitSuccess ? (
              /* 提交成功状态 */
              <div style={S.leadSuccessWrap}>
                <span style={S.leadSuccessIcon}>🎉</span>
                <h3 style={S.leadSuccessTitle}>预约成功！</h3>
                <p style={S.leadSuccessDesc}>
                  感谢您的关注，尊界专属顾问将在 24 小时内<br/>与您取得联系，为您安排专属服务。
                </p>
              </div>
            ) : (
              /* 表单内容 */
              <div>
                <h3 style={S.leadTitle}>{leadModalType}</h3>
                <p style={S.leadSubtitle}>填写信息，专属顾问将尽快与您联系</p>

                {/* 姓名 */}
                <div style={S.leadFieldGroup}>
                  <label style={S.leadLabel}>姓名 *</label>
                  <input
                    id="zj-lead-name"
                    className="zj-lead-input"
                    style={S.leadInput}
                    type="text"
                    placeholder="请输入您的姓名"
                    defaultValue=""
                  />
                </div>

                {/* 手机号 */}
                <div style={S.leadFieldGroup}>
                  <label style={S.leadLabel}>手机号码 *</label>
                  <input
                    id="zj-lead-phone"
                    className="zj-lead-input"
                    style={S.leadInput}
                    type="tel"
                    placeholder="请输入您的手机号码"
                    defaultValue=""
                  />
                </div>

                {/* 所在城市 */}
                <div style={S.leadFieldGroup}>
                  <label style={S.leadLabel}>所在城市 *</label>
                  <input
                    id="zj-lead-city"
                    className="zj-lead-input"
                    style={S.leadInput}
                    type="text"
                    placeholder="请输入您所在的城市"
                    defaultValue=""
                  />
                </div>

                {/* 意向车型 */}
                <div style={S.leadFieldGroup}>
                  <label style={S.leadLabel}>意向车型 *</label>
                  <div style={S.leadRadioGroup}>
                    {['尊界 S9', '尊界 S7', '暂未决定'].map(function(option) {
                      return (
                        <button
                          key={option}
                          style={S.leadRadioBtn(leadModalModel === option)}
                          onClick={() => self.setCustomState({ leadModalModel: option })}
                        >{option}</button>
                      );
                    })}
                  </div>
                </div>

                {/* 意向类型 */}
                <div style={S.leadFieldGroup}>
                  <label style={S.leadLabel}>意向类型 *</label>
                  <div style={S.leadRadioGroup}>
                    {['预约试驾', '立即订购', '了解更多'].map(function(option) {
                      return (
                        <button
                          key={option}
                          style={S.leadRadioBtn(leadModalType === option)}
                          onClick={() => self.setCustomState({ leadModalType: option })}
                        >{option}</button>
                      );
                    })}
                  </div>
                </div>

                {/* 备注 */}
                <div style={S.leadFieldGroup}>
                  <label style={S.leadLabel}>备注信息（选填）</label>
                  <textarea
                    id="zj-lead-remark"
                    className="zj-lead-input"
                    style={S.leadTextarea}
                    placeholder="如有其他需求，请在此说明"
                    defaultValue=""
                  />
                </div>

                {/* 提交按钮 */}
                <button
                  style={leadSubmitting ? S.leadSubmitBtnDisabled : S.leadSubmitBtn}
                  onClick={() => self.submitLeadForm()}
                  disabled={leadSubmitting}
                >
                  {leadSubmitting ? '提交中...' : '立即提交'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

'use strict';

async function refreshMapForApp(appType, reason) {
  if (!appType || process.env.OPENYIDA_SKIP_MAP_UPDATE === '1') {
    return;
  }

  try {
    const { run } = require('./map');
    await run(['rebuild', appType]);
    if (reason) {
      console.error(`ℹ️ 已自动更新业务关系地图: ${reason}`);
    }
  } catch (error) {
    console.error(`⚠️ 业务关系地图自动更新失败: ${error.message}`);
  }
}

module.exports = {
  refreshMapForApp,
};

import getCache from '../services/irc-cache.js';

/**
 * Stats Controller - Handles server statistics endpoints
 */

export async function getStats(req, res) {
  try {
    const cache = getCache();
    const stats = await cache.getStats();
    const status = cache.getStatus();

    res.json({
      success: true,
      data: stats,
      cacheStatus: status,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('[Controller] Error getting stats:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve server stats',
      message: err.message
    });
  }
}

export async function getCacheStatus(req, res) {
  try {
    const cache = getCache();
    const status = cache.getStatus();

    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('[Controller] Error getting cache status:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve cache status',
      message: err.message
    });
  }
}

export async function getNetworkSummary(req, res) {
  try {
    const cache = getCache();
    const stats = await cache.getStats();
    const channels = await cache.getChannels();

    const summary = {
      host: stats.host,
      port: stats.port,
      online: stats.connected,
      usersOnline: stats.usersOnline || 0,
      totalChannels: channels.length,
      topChannels: channels.slice(0, 5),
      uptime: stats.uptime || null
    };

    res.json({
      success: true,
      data: summary,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('[Controller] Error getting network summary:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve network summary',
      message: err.message
    });
  }
}

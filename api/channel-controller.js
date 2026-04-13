import getCache from '../services/irc-cache.js';

/**
 * Channel Controller - Handles channel-related API endpoints
 */

export async function listChannels(req, res) {
  try {
    const cache = getCache();
    const channels = await cache.getChannels();

    res.json({
      success: true,
      data: channels,
      count: channels.length,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('[Controller] Error listing channels:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve channels',
      message: err.message
    });
  }
}

export async function getChannelInfo(req, res) {
  try {
    const { name } = req.params;
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Channel name is required'
      });
    }

    const cache = getCache();
    const channels = await cache.getChannels();
    const channelName = name.startsWith('#') ? name : '#' + name;
    
    const channel = channels.find(ch => ch.name.toLowerCase() === channelName.toLowerCase());

    if (!channel) {
      return res.status(404).json({
        success: false,
        error: 'Channel not found'
      });
    }

    res.json({
      success: true,
      data: channel,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('[Controller] Error getting channel info:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve channel info',
      message: err.message
    });
  }
}

export async function searchChannels(req, res) {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const cache = getCache();
    const allChannels = await cache.getChannels();
    
    const query = q.toLowerCase();
    const results = allChannels.filter(ch => 
      ch.name.toLowerCase().includes(query) || 
      ch.topic.toLowerCase().includes(query)
    );

    res.json({
      success: true,
      data: results,
      count: results.length,
      query,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('[Controller] Error searching channels:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to search channels',
      message: err.message
    });
  }
}

export async function getPopularChannels(req, res) {
  try {
    const { limit = 10 } = req.query;
    const cache = getCache();
    const channels = await cache.getChannels();

    // Sort by user count descending
    const popular = channels
      .sort((a, b) => b.users - a.users)
      .slice(0, Math.min(parseInt(limit), 50));

    res.json({
      success: true,
      data: popular,
      count: popular.length,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('[Controller] Error getting popular channels:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve popular channels',
      message: err.message
    });
  }
}

import express from 'express';
import * as channelController from './channel-controller.js';
import * as statsController from './stats-controller.js';

const router = express.Router();

/**
 * Channel Routes
 */
router.get('/channels', channelController.listChannels);
router.get('/channels/popular', channelController.getPopularChannels);
router.get('/channels/search', channelController.searchChannels);
router.get('/channels/:name', channelController.getChannelInfo);

/**
 * Stats Routes
 */
router.get('/stats', statsController.getStats);
router.get('/stats/cache-status', statsController.getCacheStatus);
router.get('/stats/network-summary', statsController.getNetworkSummary);

/**
 * Error handling for undefined routes
 */
router.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    path: req.path
  });
});

export default router;

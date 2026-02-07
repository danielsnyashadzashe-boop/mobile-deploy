/**
 * Metro configuration for Expo Web with proxy support
 * This configuration adds proxy middleware for development to handle CORS issues
 */

const { getDefaultConfig } = require('expo/metro-config');
const { createProxyMiddleware } = require('http-proxy-middleware');

const config = getDefaultConfig(__dirname);

// Add proxy middleware for Flash API in development
if (process.env.NODE_ENV === 'development') {
  config.server = {
    ...config.server,
    enhanceMiddleware: (middleware) => {
      return (req, res, next) => {
        // Proxy Flash API requests to avoid CORS issues
        if (req.url.startsWith('/api/flash/')) {
          const proxy = createProxyMiddleware({
            target: 'https://api-flashswitch-sandbox.flash-group.com',
            changeOrigin: true,
            pathRewrite: {
              '^/api/flash': '', // Remove /api/flash prefix
            },
            onProxyReq: (proxyReq, req, res) => {
              console.log(`🔄 Proxying request to Flash API: ${req.url}`);
            },
            onProxyRes: (proxyRes, req, res) => {
              console.log(`✅ Flash API response: ${proxyRes.statusCode}`);
            },
            onError: (err, req, res) => {
              console.error('❌ Proxy error:', err);
              res.writeHead(502, {
                'Content-Type': 'application/json',
              });
              res.end(JSON.stringify({
                error: 'Proxy error',
                message: err.message,
              }));
            },
          });
          return proxy(req, res, next);
        }
        return middleware(req, res, next);
      };
    },
  };
}

module.exports = config;
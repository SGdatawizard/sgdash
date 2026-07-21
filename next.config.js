/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Next.js caches page data client-side for a short window even on
    // routes marked `dynamic = 'force-dynamic'`, which is why saving a
    // target or running a sync can look like it "didn't save" the moment
    // you navigate away and back — you're seeing a cached snapshot from
    // just before the change, not the real current data. Setting this to
    // 0 makes every navigation fetch fresh from the server.
    staleTimes: {
      dynamic: 0,
    },
  },
};

module.exports = nextConfig;
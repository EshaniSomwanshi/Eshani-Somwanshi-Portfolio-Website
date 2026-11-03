/* The /exploration page is a private workspace for building the avatar. It
   must never reach the live site — neither the page nor its navbar link.

   Two independent guards, either one switches it off:

   1. Build time — Vercel's system env var VERCEL_ENV, exposed to CRA as
      REACT_APP_VERCEL_ENV. It is "production" only for production deploys
      ("preview" for dev-branch previews, unset locally). CRA inlines it as a
      literal, so on a production build EXPLORATION_BUILD is `false` and the
      minifier drops the lazy import in index.js: the page's code is not in
      the production bundle at all.
   2. Run time — the live domain, as a backstop in case the env var is ever
      not exposed to the build. */
export const EXPLORATION_BUILD = process.env.REACT_APP_VERCEL_ENV !== "production";

const LIVE_HOST = /(^|\.)eshanisomwanshi\.com$/i;

export const EXPLORATION_ENABLED =
  EXPLORATION_BUILD &&
  !(typeof window !== "undefined" && LIVE_HOST.test(window.location.hostname));

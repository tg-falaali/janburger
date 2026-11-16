import { defineRouter } from "#q-app/wrappers";
import { createRouter, createWebHashHistory } from "vue-router";
import routes from "./routes.js";
import { useAuth } from "src/composables/useAuth";

export default defineRouter(function () {
  const Router = createRouter({
    scrollBehavior: (to) =>
      to.hash ? { el: to.hash, behavior: "smooth" } : { left: 0, top: 0 },
    routes,
    history: createWebHashHistory(process.env.VUE_ROUTER_BASE),
  });

  Router.beforeEach(async (to) => {
    const needsAuth = to.matched.some((r) => r.meta.requiresAuth);
    if (!needsAuth && to.path !== "/login-jan") return true;

    const { state, init } = useAuth();
    await init();

    if (needsAuth && !state.user) return { path: "/login-jan" };
    if (to.path === "/login-jan" && state.user) return { path: "/dashboard" };
    return true;
  });

  return Router;
});

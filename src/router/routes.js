const routes = [
  { path: "/", redirect: "/jan-brger" },
  { path: "/jan-brger", alias: "/jan-burger", component: () => import("pages/HomePage.vue") },
  { path: "/login-jan", component: () => import("pages/LoginPage.vue") },
  {
    path: "/dashboard",
    component: () => import("pages/DashboardPage.vue"),
    meta: { requiresAuth: true },
  },
  { path: "/:catchAll(.*)*", redirect: "/jan-brger" },
];

export default routes;

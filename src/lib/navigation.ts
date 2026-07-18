export const routeMatchesPath = (pathname: string, route: string) =>
  pathname === route || pathname.startsWith(`${route}/`);

export const findLongestMatchingRoute = (pathname: string, routes: readonly string[]) =>
  routes.reduce<string | undefined>((longest, route) => {
    if (!routeMatchesPath(pathname, route)) return longest;
    return !longest || route.length > longest.length ? route : longest;
  }, undefined);

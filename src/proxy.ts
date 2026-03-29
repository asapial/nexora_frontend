import { NextRequest, NextResponse } from "next/server";
import { userService } from "./services/user.service";

// Middleware to protect routes based on uppercase user roles
export async function proxy(request: NextRequest) {
  let isAuthenticated = false;
  let role: "CUSTOMER" | "SELLER" | "ADMIN" | null = null



  // Get session from your auth service
  const { data } = await userService.getSession();

  console.log("User data form the proxy layer :",data);

  if (data?.user?.role) {
    isAuthenticated = true;
    role = data.user.role;
  }

  const pathname = request.nextUrl.pathname;
  console.log("User data form the proxy layer :",pathname);
  // // -------------------------
  // // SHOP RULES
  // // -------------------------
  // const isShopRoot = pathname === "/shop";
  // const isShopDetail =
  //   pathname.startsWith("/shop/") && pathname.split("/").length === 3;

  // // 🔓 Allow public shop page
  // if (isShopRoot) {
  //   return NextResponse.next();
  // }

  // // 🔒 Protect /shop/:id
  // if (isShopDetail && !isAuthenticated) {
  //   return NextResponse.redirect(new URL("/login", request.url));
  // }


  // //* User is not authenticated at all
  // if (!isAuthenticated) {
  //   return NextResponse.redirect(new URL("/login", request.url));
  // }

  // // console.log("Is authenticated form the proxy :", isAuthenticated);

  // // -------------------------
  // // CUSTOMER ROUTES
  // // -------------------------
  // const customerRoutes = ["/cart", "/checkout", "/orders"];

  // if (role === "CUSTOMER") {
  //   // Customers cannot access admin or seller routes
  //   if (pathname.startsWith("/admin") || pathname.startsWith("/seller")) {
  //     return NextResponse.redirect(new URL("/", request.url));
  //   }
  // }

  // // -------------------------
  // // SELLER ROUTES
  // // -------------------------
  // const sellerRoutes = ["/seller/dashboard", "/seller/medicines", "/seller/orders"];

  // if (role === "SELLER") {
  //   // Sellers cannot access admin routes or customer-specific pages
  //   if (pathname.startsWith("/admin") || pathname.startsWith("/cart") || pathname.startsWith("/orders")) {
  //     return NextResponse.redirect(new URL("/seller/dashboard", request.url));
  //   }
  // }

  // // -------------------------
  // // ADMIN ROUTES
  // // -------------------------
  // const adminRoutes = ["/admin", "/admin/users", "/admin/orders", "/admin/categories"];

  // if (role === "ADMIN") {
  //   // Admin cannot access seller or customer routes
  //   if (pathname.startsWith("/seller") || pathname.startsWith("/cart") || pathname.startsWith("/checkout") || pathname.startsWith("/orders")) {
  //     return NextResponse.redirect(new URL("/admin", request.url));
  //   }
  // }

  // -------------------------
  // Default: allow access
  // -------------------------
  // console.log("User role:", role, "Accessing:", pathname);
  return NextResponse.next();
}

// -------------------------
// Apply middleware only to protected routes
// -------------------------
export const config = {
  matcher: [
    // "/cart",
    // "/checkout",
    // "/orders/:path*", // includes /orders and /orders/:id
    // "/profile",
    // "/seller/:path*", // all seller routes
    // "/admin/:path*",  // all admin routes
    // "/shop/:path*"
  ],
};
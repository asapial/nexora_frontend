import { NextRequest, NextResponse } from "next/server";


// Middleware to protect routes based on uppercase user roles
export async function proxy(request: NextRequest) {
  
  return NextResponse.next();
}

// -------------------------
// Apply middleware only to protected routes
// -------------------------
export const config = {
  matcher: [

  ],
};

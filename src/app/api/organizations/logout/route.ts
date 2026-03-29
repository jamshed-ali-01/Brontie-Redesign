import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Create success response
    const response = NextResponse.json(
      {
        success: true,
        message: "Logged out successfully",
        redirectTo: "/organizations/login"
      },
      { status: 200 }
    );

    // Clear ALL auth-related cookies
    const cookiesToClear = [
      "org-token",      // Your dashboard uses this
      "auth-token",     // Generic auth
      "token",          // Common token name
      "refresh-token",  // Refresh tokens
      "session",        // Session cookies
      "org_session",    // Organization session
      "next-auth.session-token", // If using NextAuth
      "next-auth.csrf-token",    // NextAuth CSRF
    ];

    // Clear each cookie with proper settings
    cookiesToClear.forEach(cookieName => {
      response.cookies.delete(cookieName);
    });

    // Also set expired cookies as backup
    response.cookies.set({
      name: "org-token",
      value: "",
      expires: new Date(0),
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    response.cookies.set({
      name: "auth-token",
      value: "",
      expires: new Date(0),
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return response;

  } catch (error: any) {
    console.error("Organization logout error:", error);
    
    // Even if error occurs, try to clear cookies
    const errorResponse = NextResponse.json(
      {
        success: false,
        message: error.message || "Logout failed"
      },
      { status: 500 }
    );

    // Try to clear cookies in error response too
    errorResponse.cookies.delete("org-token");
    errorResponse.cookies.delete("auth-token");
    
    return errorResponse;
  }
}
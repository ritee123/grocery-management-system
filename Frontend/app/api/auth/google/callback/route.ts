import { NextRequest, NextResponse } from 'next/server'
import { setAuthSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    console.log('Google OAuth callback hit')
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    
    console.log('Callback params:', { code: code ? 'present' : 'missing', state, error })

    // Handle OAuth errors
    if (error) {
      return NextResponse.redirect(
        new URL('/signup?error=google_auth_failed', request.url)
      )
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/signup?error=no_code', request.url)
      )
    }

    // Exchange authorization code for tokens
    const tokenResponse = await exchangeCodeForTokens(code)
    
    if (!tokenResponse.access_token) {
      return NextResponse.redirect(
        new URL('/signup?error=token_exchange_failed', request.url)
      )
    }

    // Get user info from Google
    const userInfo = await getGoogleUserInfo(tokenResponse.access_token)
    
    if (!userInfo) {
      return NextResponse.redirect(
        new URL('/signup?error=user_info_failed', request.url)
      )
    }

    // Create or update user in your system
    const user = await createOrUpdateGoogleUser(userInfo)
    
    // Set auth session
    await setAuthSession({
      token: tokenResponse.access_token,
      role: (user.role || 'customer') as 'customer' | 'admin',
      user: user
    })

    // Redirect to success page
    const redirectUrl = state === 'signup' ? '/portal' : '/'
    return NextResponse.redirect(new URL(redirectUrl, request.url))

  } catch (error) {
    console.error('Google OAuth callback error:', error)
    return NextResponse.redirect(
      new URL('/signup?error=callback_failed', request.url)
    )
  }
}

async function exchangeCodeForTokens(code: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/google/callback`

  const tokenUrl = 'https://oauth2.googleapis.com/token'
  
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId || '',
      client_secret: clientSecret || '',
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to exchange code for tokens')
  }

  return response.json()
}

async function getGoogleUserInfo(accessToken: string) {
  const userInfoUrl = 'https://www.googleapis.com/oauth2/v2/userinfo'
  
  const response = await fetch(userInfoUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to get user info from Google')
  }

  return response.json()
}

async function createOrUpdateGoogleUser(googleUser: any) {
  // This is where you would:
  // 1. Check if user exists in your database by email
  // 2. If not exists, create new user with Google data
  // 3. If exists, update user info if needed
  // 4. Return user object with your system's user data
  
  // For now, return a mock user object
  // In production, you would call your database/API here
  
  return {
    id: googleUser.id,
    username: googleUser.email.split('@')[0], // Use email prefix as username
    email: googleUser.email,
    name: googleUser.name,
    avatar: googleUser.picture,
    role: 'customer',
    provider: 'google',
    createdAt: new Date().toISOString(),
  }
}

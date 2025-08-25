# Team Invitation Setup Guide

This guide explains how to set up the team invitation feature for amTop CRM.

## Features Added

1. **Add Team Member Button** - Located on the `/users` page
2. **Email Invitations** - Send magic link invitations to new team members
3. **Magic Link Authentication** - Secure invitation acceptance via `/join-team` page
4. **Role-based Access** - Invite users with specific roles (User/Viewer)

## Environment Variables Required

Add these to your `.env.local` file:

```bash
# Firebase Admin SDK (for generating custom tokens)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----"

# App URL (for magic links)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## How to Get Firebase Admin SDK Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings > Service Accounts
4. Click "Generate new private key"
5. Download the JSON file
6. Extract the values:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY`

## How It Works

### 1. Sending Invitations
- Admin clicks "Add Team Member" button on `/users` page
- Enters email and selects role (User/Viewer)
- System creates invitation record in MongoDB
- Email is sent with magic link (currently logged to console)

### 2. Accepting Invitations
- User clicks magic link in email
- Redirected to `/join-team?token=xxx`
- User can sign up or sign in
- Automatically added to the organization

### 3. Database Collections
- `invitations` - Stores pending invitations
- `users` - Updated with organization membership
- `organizations` - Existing collection

## Email Service Integration

Currently, emails are logged to the console. To send actual emails, integrate with:

- **SendGrid**: `npm install @sendgrid/mail`
- **AWS SES**: `npm install @aws-sdk/client-ses`
- **Resend**: `npm install resend`

Update `app/lib/emailService.ts` with your preferred service.

## Testing the Feature

1. Start your development server: `npm run dev`
2. Go to `http://localhost:3000/users`
3. Click "Add Team Member" button
4. Enter an email address and select a role
5. Check console for email logs
6. Copy the magic link from console
7. Open the magic link in a new browser/incognito window
8. Complete the sign-up/sign-in process

## Security Features

- Invitations expire after 7 days
- Email validation ensures only invited users can join
- Role-based permissions control access
- Magic links are single-use and secure

## Troubleshooting

### Common Issues

1. **Firebase Admin SDK Error**: Check your environment variables
2. **Email Not Sending**: Check console logs, integrate proper email service
3. **Magic Link Not Working**: Verify `NEXT_PUBLIC_APP_URL` is correct
4. **User Not Added to Organization**: Check MongoDB connection and collections

### Debug Mode

In development, magic links are returned in the API response for testing. In production, only emails are sent.

## Production Deployment

1. Set up proper email service (SendGrid, AWS SES, etc.)
2. Update `NEXT_PUBLIC_APP_URL` to your production domain
3. Ensure Firebase Admin SDK credentials are secure
4. Test invitation flow thoroughly
5. Monitor invitation acceptance rates

## API Endpoints

- `POST /api/teams/invite` - Send invitation
- `GET /api/teams/invite/verify?token=xxx` - Verify invitation
- `POST /api/teams/invite/accept` - Accept invitation

## Database Schema

### Invitations Collection
```javascript
{
  email: "user@example.com",
  organizationId: "org123",
  organizationName: "Acme Corp",
  role: "user",
  invitedBy: "admin@example.com",
  invitedByName: "John Admin",
  status: "pending", // pending, accepted, expired
  createdAt: Date,
  expiresAt: Date,
  token: "unique-token-here"
}
```


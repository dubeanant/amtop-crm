interface EmailInvitationData {
  to: string;
  organizationName: string;
  invitedByName: string;
  magicLink: string;
  role: string;
}

export const sendTeamInvitation = async (data: EmailInvitationData): Promise<boolean> => {
  try {
    // In production, integrate with a proper email service like SendGrid, AWS SES, or Resend
    // For now, we'll just log the email details
    
    const emailContent = `
Subject: You've been invited to join ${data.organizationName} on amTop CRM

Hi there!

${data.invitedByName} has invited you to join their team on amTop CRM.

Organization: ${data.organizationName}
Role: ${data.role}

Click the link below to accept the invitation and join the team:

${data.magicLink}

This invitation will expire in 7 days.

If you have any questions, please contact your team admin or support@amtop.com.

Best regards,
The amTop CRM Team
    `;

    console.log('📧 Email would be sent to:', data.to);
    console.log('📧 Email content:', emailContent);
    
    // In production, replace this with actual email sending logic:
    // await emailService.send({
    //   to: data.to,
    //   subject: `You've been invited to join ${data.organizationName} on amTop CRM`,
    //   html: generateEmailHTML(data),
    //   text: emailContent
    // });

    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
};

const generateEmailHTML = (data: EmailInvitationData): string => {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Team Invitation - amTop CRM</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Team Invitation</h1>
        </div>
        <div class="content">
            <h2>You've been invited!</h2>
            <p><strong>${data.invitedByName}</strong> has invited you to join their team on amTop CRM.</p>
            
            <div style="background: #e5e7eb; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p><strong>Organization:</strong> ${data.organizationName}</p>
                <p><strong>Role:</strong> ${data.role}</p>
            </div>
            
            <p>Click the button below to accept the invitation and join the team:</p>
            
            <div style="text-align: center;">
                <a href="${data.magicLink}" class="button">Join Team</a>
            </div>
            
            <p style="font-size: 14px; color: #6b7280;">
                This invitation will expire in 7 days. If you're having trouble, contact your team admin or 
                <a href="mailto:support@amtop.com">support@amtop.com</a>
            </p>
        </div>
        <div class="footer">
            <p>amTop CRM Team</p>
        </div>
    </div>
</body>
</html>
  `;
};


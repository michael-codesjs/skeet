export const InvitationEmailHtml = (
  inviterName: string,
  organizationName: string,
  inviteLink: string,
) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invitation to join ${organizationName}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .btn { display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
        .footer { margin-top: 40px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <h2>You've been invited!</h2>
    <p>Hello,</p>
    <p><strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> on Skeet.</p>
    <p>Click the button below to accept the invitation and get started:</p>
    <a href="${inviteLink}" class="btn">Accept Invitation</a>
    <p class="footer">If you were not expecting this invitation, you can safely ignore this email.</p>
</body>
</html>
`;

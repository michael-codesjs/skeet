export const OtpEmailHtml = (
  otp: string,
  title: string = 'Verify your email',
  message: string = 'Use the code below to complete your sign in or sign up process. This code will expire in 10 minutes.',
) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Code</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap');

    body {
      font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f4f4f5;
      color: #18181b;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f4f4f5;
      padding: 40px 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #0A0A0A;
      color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid #333333;
    }
    .header {
      padding: 48px 40px 24px;
      text-align: center;
    }
    .logo {
      font-size: 28px;
      font-weight: 800;
      color: #ffffff;
      text-decoration: none;
      letter-spacing: -0.5px;
    }
    .content {
      padding: 24px 48px 48px;
      text-align: center;
    }
    .title {
      font-size: 24px;
      font-weight: 700;
      margin-top: 0;
      margin-bottom: 16px;
      color: #ffffff;
      letter-spacing: -0.5px;
    }
    .text {
      font-size: 16px;
      line-height: 1.6;
      color: #AAAAAA;
      margin-bottom: 32px;
    }
    .otp-code {
      display: inline-block;
      font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 36px;
      font-weight: 700;
      letter-spacing: 12px;
      color: #000000;
      background-color: #ffffff;
      padding: 24px 48px;
      border-radius: 100px;
      margin-bottom: 32px;
    }
    .footer {
      padding: 32px 40px;
      background-color: #000000;
      text-align: center;
      border-top: 1px solid #1A1A1A;
    }
    .footer-text {
      font-size: 14px;
      color: #666666;
      margin-bottom: 8px;
    }
    @media only screen and (max-width: 600px) {
      .container {
        width: 100%;
        border-radius: 0;
        border: none;
      }
      .content {
        padding: 24px;
      }
      .otp-code {
        font-size: 28px;
        padding: 20px 32px;
        letter-spacing: 8px;
      }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="logo">Skeet</div>
      </div>
      <div class="content">
        <h1 class="title">${title}</h1>
        <p class="text">${message}</p>
        <div class="otp-code">${otp}</div>
        <p class="text" style="font-size: 14px; margin-bottom: 0;">If you didn't request this, you can safely ignore this email.</p>
      </div>
      <div class="footer">
        <p class="footer-text">&copy; ${new Date().getFullYear()} Skeet. All rights reserved.</p>
        <p class="footer-text" style="font-size: 12px; color: #444444;">The ultimate co-pilot for the lifetime of your car.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

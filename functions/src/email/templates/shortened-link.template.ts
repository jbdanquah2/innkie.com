export const getShortenedLinkTemplate = (
  originalUrl: string,
  shortUrl: string,
  brandColor: string = "#4f46e5",
  brandName: string = "Personal"
) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        body { font-family: 'Inter', system-ui, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 40px 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 40px; overflow: hidden; border: 1px solid #f1f5f9; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05); }
        .header { padding: 40px; background: #ffffff; text-align: center; }
        .content { padding: 0 40px 40px; }
        .badge { display: inline-block; padding: 4px 12px; background: ${brandColor}15; color: ${brandColor}; border-radius: 99px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 20px; border: 1px solid ${brandColor}25; }
        h1 { font-size: 32px; font-weight: 900; color: #0f172a; margin: 0 0 16px; letter-spacing: -0.02em; line-height: 1.2; }
        p { font-size: 16px; color: #64748b; line-height: 1.6; margin: 0 0 24px; }
        .card { background: #f8fafc; border-radius: 24px; padding: 24px; border: 1px solid #f1f5f9; margin-bottom: 32px; }
        .label { font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.2em; display: block; margin-bottom: 8px; }
        .url-box { font-family: 'Monaco', 'Consolas', monospace; font-size: 14px; word-break: break-all; color: ${brandColor}; font-weight: 700; }
        .divider { height: 1px; background: #e2e8f0; margin: 24px 0; position: relative; }
        .divider::after { content: '→'; position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); background: #f8fafc; padding: 0 12px; color: #cbd5e1; font-weight: bold; }
        .btn { display: inline-block; padding: 16px 40px; background: ${brandColor}; color: #ffffff !important; font-weight: 900; font-size: 14px; text-decoration: none; border-radius: 16px; transition: transform 0.2s; box-shadow: 0 10px 15px -3px ${brandColor}40; text-transform: uppercase; letter-spacing: 0.05em; }
        .footer { padding: 40px; background: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; }
        .footer-text { font-size: 12px; color: #94a3b8; margin: 0; font-weight: 500; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
           <svg width="44" height="44" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M30 35V70" stroke="${brandColor}" stroke-width="12" stroke-linecap="round"/>
              <path d="M70 30V65" stroke="${brandColor}" stroke-width="12" stroke-linecap="round"/>
              <path d="M30 55C30 55 40 35 50 45C60 55 70 35 70 35" stroke="${brandColor}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="70" cy="15" r="8" fill="${brandColor}"/>
           </svg>
        </div>
        <div class="content">
          <div class="badge">${brandName} Workspace</div>
          <h1>Your link is live.</h1>
          <p>Everything is set up and ready to go. Your shortened link is tracking analytics in real-time.</p>
          
          <div class="card">
            <span class="label">Destination</span>
            <div class="url-box" style="color: #64748b; font-weight: 500; margin-bottom: 24px;">${originalUrl}</div>
            
            <div class="divider"></div>
            
            <span class="label">Short Link</span>
            <div class="url-box">${shortUrl}</div>
          </div>

          <div style="text-align: center; margin-top: 40px;">
            <a href="https://innkie.com/dashboard" class="btn">View Analytics</a>
          </div>
        </div>
        <div class="footer">
          <p class="footer-text">Built with precision by iNNkie.com</p>
          <p class="footer-text" style="margin-top: 8px;">&copy; 2024 iNNkie. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

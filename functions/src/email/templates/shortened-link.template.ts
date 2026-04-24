export const getShortenedLinkTemplate = (
  originalUrl: string,
  shortUrl: string,
  brandColor: string = "#4f46e5",
  brandName: string = "Personal"
) => {
  return `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 40px 20px; color: #1e293b;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 32px; overflow: hidden; border: 1px solid #f1f5f9; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05);">
        <!-- Header -->
        <div style="padding: 40px 40px 20px; text-align: center; background: #ffffff;">
           <img src="https://innkie.com/assets/logo.png" alt="iNNkie" style="width: 44px; height: 44px; display: inline-block;" onerror="this.style.display='none'" />
           <div style="width: 44px; height: 44px; background: ${brandColor}; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin: 0 auto;">
              <span style="color: white; font-size: 20px; font-weight: bold;">i</span>
           </div>
        </div>

        <!-- Content -->
        <div style="padding: 20px 40px 40px;">
          <div style="display: inline-block; padding: 4px 12px; background-color: ${brandColor}15; color: ${brandColor}; border-radius: 99px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 20px; border: 1px solid ${brandColor}25;">
            ${brandName} Workspace
          </div>
          
          <h1 style="font-size: 32px; font-weight: 900; color: #0f172a; margin: 0 0 16px; letter-spacing: -0.02em; line-height: 1.2;">
            Your link is live.
          </h1>
          
          <p style="font-size: 16px; color: #64748b; line-height: 1.6; margin: 0 0 32px;">
            Everything is set up and ready to go. Your shortened link is tracking analytics in real-time.
          </p>
          
          <!-- URL Card -->
          <div style="background: #f8fafc; border-radius: 20px; padding: 24px; border: 1px solid #f1f5f9; margin-bottom: 32px;">
            <span style="font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.2em; display: block; margin-bottom: 8px;">Destination</span>
            <div style="font-family: 'Monaco', 'Consolas', monospace; font-size: 13px; word-break: break-all; color: #64748b; font-weight: 500; margin-bottom: 24px; line-height: 1.5;">
              ${originalUrl}
            </div>
            
            <div style="height: 1px; background: #e2e8f0; margin: 24px 0; text-align: center;"></div>
            
            <span style="font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.2em; display: block; margin-bottom: 8px;">Short Link</span>
            <div style="font-family: 'Monaco', 'Consolas', monospace; font-size: 14px; word-break: break-all; color: ${brandColor}; font-weight: 700;">
              ${shortUrl}
            </div>
          </div>

          <!-- CTA -->
          <div style="text-align: center; margin-top: 40px;">
            <a href="https://innkie.com/dashboard" style="display: inline-block; padding: 16px 40px; background-color: ${brandColor}; color: #ffffff !important; font-weight: 900; font-size: 14px; text-decoration: none; border-radius: 14px; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 0 10px 15px -3px ${brandColor}40;">
              View Analytics
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="padding: 32px 40px; background: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
          <p style="font-size: 12px; color: #94a3b8; margin: 0; font-weight: 500;">Built with precision by iNNkie.com</p>
          <p style="font-size: 11px; color: #cbd5e1; margin-top: 8px; font-weight: 500;">&copy; 2024 iNNkie. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;
};

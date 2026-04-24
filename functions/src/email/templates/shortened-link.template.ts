export const getShortenedLinkTemplate = (
  originalUrl: string,
  shortUrl: string,
  brandColor: string = "#4f46e5",
  brandName: string = "Personal"
) => {
  return `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f1f5f9; padding: 60px 20px; color: #1e293b; line-height: 1.5;">
      <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 40px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08);">
        
        <!-- Hero Header -->
        <div style="padding: 48px 40px; text-align: center; background: linear-gradient(135deg, ${brandColor} 0%, ${brandColor}dd 100%);">
           <div style="width: 64px; height: 64px; background: rgba(255,255,255,0.2); border-radius: 20px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 24px; backdrop-blur: 10px; border: 1px solid rgba(255,255,255,0.3);">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
           </div>
           <h1 style="font-size: 32px; font-weight: 900; color: #ffffff; margin: 0; letter-spacing: -0.03em; line-height: 1.1;">
            Link is ready!
           </h1>
           <div style="margin-top: 12px; display: inline-block; padding: 4px 12px; background: rgba(0,0,0,0.1); color: #ffffff; border-radius: 8px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;">
            ${brandName} Workspace
           </div>
        </div>

        <!-- Body -->
        <div style="padding: 40px;">
          <p style="font-size: 16px; color: #475569; margin: 0 0 32px; text-align: center; font-weight: 500;">
            Success! Your URL has been shortened and is now active. Analytics tracking is already live.
          </p>
          
          <!-- URL Display Card -->
          <div style="background: #f8fafc; border-radius: 24px; padding: 32px; border: 1px solid #f1f5f9; margin-bottom: 40px;">
            <div style="margin-bottom: 28px;">
              <span style="font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.15em; display: block; margin-bottom: 10px;">Shortened Link</span>
              <div style="font-family: 'ui-mono', 'SFMono-Regular', 'Menlo', Monaco, Consolas, monospace; font-size: 18px; color: ${brandColor}; font-weight: 800; word-break: break-all; letter-spacing: -0.02em;">
                ${shortUrl}
              </div>
            </div>
            
            <div style="height: 1px; background: #e2e8f0; margin-bottom: 28px;"></div>
            
            <div>
              <span style="font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.15em; display: block; margin-bottom: 10px;">Destination</span>
              <div style="font-size: 14px; color: #64748b; font-weight: 500; word-break: break-all; line-height: 1.4;">
                ${originalUrl}
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div style="text-align: center;">
            <a href="https://innkie.com/dashboard" style="display: inline-block; width: 100%; box-sizing: border-box; padding: 18px 32px; background-color: ${brandColor}; color: #ffffff !important; font-weight: 800; font-size: 15px; text-decoration: none; border-radius: 18px; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 0 15px 30px -5px ${brandColor}50;">
              View Live Analytics
            </a>
          </div>

          <div style="margin-top: 24px; text-align: center;">
            <p style="font-size: 13px; color: #94a3b8; font-weight: 500;">
              Tracking clicks, locations, and devices.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="padding: 32px 40px; background: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
          <div style="margin-bottom: 16px;">
            <span style="font-size: 18px; font-weight: 900; color: #0f172a; font-style: italic;">iNNkie</span>
          </div>
          <p style="font-size: 12px; color: #94a3b8; margin: 0; font-weight: 500;">Sent via iNNkie Link Management</p>
          <p style="font-size: 11px; color: #cbd5e1; margin-top: 8px; font-weight: 500;">&copy; 2024 iNNkie Platform. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;
};

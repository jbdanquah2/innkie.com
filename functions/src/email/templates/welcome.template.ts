export const getWelcomeEmailTemplate = (
  userName: string = "there"
) => {
  const brandColor = "#4f46e5"; // Default iNNkie Indigo
  
  return `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f1f5f9; padding: 60px 20px; color: #1e293b; line-height: 1.5;">
      <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 40px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08);">
        
        <!-- Hero Header -->
        <div style="padding: 48px 40px; text-align: center; background: linear-gradient(135deg, ${brandColor} 0%, ${brandColor}dd 100%);">
           <div style="width: 64px; height: 64px; background: rgba(255,255,255,0.2); border-radius: 20px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 24px; backdrop-blur: 10px; border: 1px solid rgba(255,255,255,0.3);">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
           </div>
           <h1 style="font-size: 32px; font-weight: 900; color: #ffffff; margin: 0; letter-spacing: -0.03em; line-height: 1.1;">
            Welcome to iNNkie!
           </h1>
           <div style="margin-top: 12px; display: inline-block; padding: 4px 12px; background: rgba(0,0,0,0.1); color: #ffffff; border-radius: 8px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;">
            Onboarding
           </div>
        </div>

        <!-- Body -->
        <div style="padding: 40px; text-align: center;">
          <h2 style="font-size: 24px; font-weight: 800; color: #0f172a; margin: 0 0 16px; tracking-tight;">
            Nice to meet you, ${userName}.
          </h2>
          <p style="font-size: 16px; color: #475569; margin: 0 0 32px; font-weight: 500;">
            Thanks for joining iNNkie, the premium redirection platform for modern teams. Start shortening your URLs and tracking insights with precision.
          </p>
          
          <!-- CTA -->
          <div style="text-align: center;">
            <a href="https://innkie.com/dashboard" style="display: inline-block; width: 100%; box-sizing: border-box; padding: 18px 32px; background-color: ${brandColor}; color: #ffffff !important; font-weight: 800; font-size: 15px; text-decoration: none; border-radius: 18px; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 0 15px 30px -5px ${brandColor}50;">
              Enter Dashboard
            </a>
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

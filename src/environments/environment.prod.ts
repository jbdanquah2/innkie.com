
const backend_url = 'https://api.innkie.com';

export const environment = {
  production: true,
  apiUrl: `${backend_url}/api`,
  appUrl: 'https://innkie.com',
  firebaseConfig: {
    apiKey: "AIzaSyBMvUp6IKuwE2JHg50NhR1wnF1NQsPPPqQ",
    authDomain: "auth.innkie.com",
    projectId: "linkifyurl",
    storageBucket: "linkifyurl.appspot.com",
    messagingSenderId: "296797983995",
    appId: "1:296797983995:web:27b06701de4978add08c5e"
  },

  // api endpoints.....
  shortenUrl: `${backend_url}/api/shorten-url`,
  createCustomJWT: `${backend_url}/api/create-custom-jwt`,
  applyCustomClaims: `${backend_url}/api/apply-custom-claims`,
  previewLongURL: `${backend_url}/api/preview-url`,
  redirectURL: `${backend_url}/api/redirect-url`
}

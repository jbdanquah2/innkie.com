export const environment = {
  production: true,
  apiUrl: 'https://api.innkie.com/api',
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
  shortenUrl: 'https://api.innkie.com/api/shorten-url',
  createCustomJWT: 'https://api.innkie.com/api/create-custom-jwt',
  applyCustomClaims: 'https://api.innkie.com/api/apply-custom-claims',
  previewLongURL: 'https://api.innkie.com/api/preview-url',
  redirectURL: 'https://api.innkie.com/api/redirect-url'
}

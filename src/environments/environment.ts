export const environment = {
  production: false,
  apiUrl: 'http://localhost:5002/api',
  appUrl: 'http://localhost:4200',
  firebaseConfig: {
    apiKey: "AIzaSyBMvUp6IKuwE2JHg50NhR1wnF1NQsPPPqQ",
    authDomain: "linkifyurl.firebaseapp.com",
    projectId: "linkifyurl",
    storageBucket: "linkifyurl.appspot.com",
    messagingSenderId: "296797983995",
    appId: "1:296797983995:web:27b06701de4978add08c5e"
  },

  // api endpoints...
  shortenUrl: 'http://localhost:5002/api/shorten-url',
  createCustomJWT: 'http://localhost:5002/api/create-custom-jwt',
  applyCustomClaims: 'http://localhost:5002/api/apply-custom-claims',
  previewLongURL: 'http://localhost:5002/api/preview-url',
  redirectURL: 'http://localhost:5002/api/redirect-url'
}

export const MC_SERVER_URL = 'https://gary-chau.github.io/Findalways-MC'

export const MC_SERVER_URL = import.meta.env.PROD 
  ? 'https://gary-chau.github.io/Findalways-MC'  // Production URL
  : 'http://localhost:3000'  // Development URL 
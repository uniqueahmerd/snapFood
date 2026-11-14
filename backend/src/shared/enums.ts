export enum ROLE {
  ADMIN = 'admin',
  USER = 'user',
}

export enum AUTHPROVIDER {
  LOCAL = 'local',
  GOOGLE = 'google',
}

export enum TOKENTYPE {
  VERIFICATION_TOKEN = 'verification_token',
  RESET_TOKEN = 'reset_token',
  REFRESH_TOKEN = 'refresh_token',
}

export enum USERSTATUS {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
}

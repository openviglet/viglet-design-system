export type VigUser = {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  admin: boolean;
  avatarUrl?: string;
  hasAvatar?: boolean;
  privileges?: string[];
};

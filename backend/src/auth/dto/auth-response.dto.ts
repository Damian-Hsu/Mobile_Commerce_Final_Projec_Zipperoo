export class AuthResponseDto {
  accessToken!: string;
  refreshToken!: string;
  user!: {
    id: number;
    account: string;
    username: string;
    email?: string;
    phone?: string;
    role: string;
    shopName?: string;
    description?: string;
  };
} 
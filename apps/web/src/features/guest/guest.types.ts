export interface Guest {
  id: string;
  nickname: string;
  displayCode: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface CreateGuestRequest {
  nickname: string;
}

export interface UpdateGuestRequest {
  nickname: string;
}

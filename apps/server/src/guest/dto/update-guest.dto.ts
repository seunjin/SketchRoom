import type { UpdateGuestRequest } from '@sketch-room/shared';
import { CreateGuestDto } from './create-guest.dto';

export class UpdateGuestDto
  extends CreateGuestDto
  implements UpdateGuestRequest {}

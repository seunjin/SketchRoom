import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateGuestDto } from './dto/create-guest.dto';
import { UpdateGuestDto } from './dto/update-guest.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Guest } from './entity/guest.entity';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { AppException } from '../common/exception/app.exception';
import { ERROR_CODE } from '../common/constant/error-code.constant';

@Injectable()
export class GuestService {
  constructor(
    @InjectRepository(Guest) //Guest 엔티티를 다루는 Repository를 주세요.
    private readonly guestRepository: Repository<Guest>, //이건 주입받은 repository를 클래스 내부에서 쓰기 위해 저장하는 필드입니다.
  ) {}

  async create(createGuestDto: CreateGuestDto) {
    const guest = this.guestRepository.create({
      nickname: createGuestDto.nickname,
      displayCode: await this.generateDisplayCode(),
    });
    return this.guestRepository.save(guest);
  }

  async findOne(id: string) {
    const guest = await this.guestRepository.findOneBy({ id });
    if (!guest) {
      throw new AppException(ERROR_CODE.GUEST_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return guest;
  }

  async update(id: string, updateGuestDto: UpdateGuestDto) {
    const guest = await this.findOne(id);

    guest.nickname = updateGuestDto.nickname;

    return this.guestRepository.save(guest);
  }

  //랜덤 diaplay함수 생성 (중복도 체크함)
  private async generateDisplayCode(): Promise<string> {
    //10번의 재시도 기회
    for (let i = 0; i < 10; i += 1) {
      const displayCode = randomBytes(3).toString('hex').toUpperCase();

      const exists = await this.guestRepository.existsBy({ displayCode });

      if (!exists) {
        return displayCode;
      }
    }

    throw new AppException(
      ERROR_CODE.GUEST_DISPLAY_CODE_GENERATION_FAILED,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

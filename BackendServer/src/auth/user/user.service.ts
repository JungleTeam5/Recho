import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';       // ← 꼭 필요
import { Repository } from 'typeorm';                     // ← 꼭 필요

import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt'; // bcrypt import

// src/user/user.service.ts
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

   async createUser(dto: CreateUserDto): Promise<User> {
    // 1. 아이디 중복 확인
    const existingUser = await this.userRepo.findOneBy({ id: dto.id });
    if (existingUser) {
      // 이미 아이디가 존재하면 409 Conflict 에러를 발생시킵니다.
      throw new ConflictException('이미 존재하는 아이디입니다.');
    }

    // 2. 비밀번호 암호화
    // 솔트 라운드는 10~12 정도가 적당합니다. 숫자가 높을수록 보안은 강화되지만 속도는 느려집니다.
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(dto.password, saltRounds);

    // 3. 암호화된 비밀번호로 유저 생성 및 저장
    const user = this.userRepo.create({
      id: dto.id,
      username: dto.name,
      password: hashedPassword, // 암호화된 비밀번호를 저장
    });
    
    await this.userRepo.save(user);

    // 보안을 위해 반환되는 객체에서 비밀번호 필드를 제거합니다.
    const { password, ...result } = user; // user 객체에서 password를 분리하고, 나머지는 result에 담습니다.
    return result as User; // password가 제외된 result 객체를 반환합니다.
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepo.findOneBy({ id });
  }

  async setCurrentRefreshToken(userId: string, refreshToken: string) {
    // 리프레시 토큰을 해싱하여 저장하는 것이 안전합니다.
    const saltRounds = 10;
    const hashedRefreshToken = await bcrypt.hash(refreshToken, saltRounds);
    await this.userRepo.update(userId, { hashedRefreshToken });
  }

   async removeRefreshToken(userId: string): Promise<any> {
    return this.userRepo.update(userId, {
      hashedRefreshToken: null,
    });
  }

}

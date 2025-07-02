
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity'; // 경로 수정
import { CreateUserDto } from './dto/create-user.dto'; // 경로 수정
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}


  async createUser(dto: CreateUserDto): Promise<Omit<User, 'password' | 'hashedRefreshToken'>> {
    // 1. 아이디 중복 확인 추가 👍 
    const existingUserById = await this.userRepo.findOneBy({ id: dto.id });
    if (existingUserById) {
      throw new ConflictException('이미 존재하는 아이디입니다.');
    }
    
    // 2. 이메일 중복 확인도 추가 👍 to동주님
    const existingUserByEmail = await this.userRepo.findOne({
      where: { email: dto.email },
    });
    if (existingUserByEmail) {
      throw new ConflictException('이미 사용 중인 이메일입니다.');
    }
  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOneBy({ id });
  }


  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOneBy({ username });
  }
  
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOneBy({ email });
  }

  async createUser(createUserDto: CreateUserDto): Promise<Omit<User, 'password' | 'hashedRefreshToken'>> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const newUser = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });
    const savedUser = await this.userRepository.save(newUser);
    // 보안을 위해 비밀번호 관련 필드는 제외하고 반환
    const { password, hashedRefreshToken, ...result } = savedUser;
    return result;
  }

  async findByProviderId(provider: string, providerId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { provider, providerId },
    });
  }

  async createWithProvider(details: {
    provider: string;
    providerId: string;
    email: string;
    username: string;
  }): Promise<User> {
    const newUser = this.userRepository.create({
      id: details.providerId,
      username: details.username,
      email: details.email,
      provider: details.provider,
      providerId: details.providerId,
    });
    return this.userRepository.save(newUser);
  }

  async updatePassword(userId: string, newHashedPassword: string): Promise<void> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }
    user.password = newHashedPassword;
    await this.userRepository.save(user);
  }

  async setCurrentRefreshToken(userId: string, refreshToken: string | null): Promise<void> {
    await this.userRepository.update(userId, {
      hashedRefreshToken: refreshToken,
    });
  }
}
// src/user/dto/create-user.dto.ts
import { IsString, IsNotEmpty, MinLength } from 'class-validator'; // MinLength를 import에 추가합니다.

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  id: string;       // 클라이언트가 지정하는 유저 아이디

  @IsString()
  @IsNotEmpty()
  name: string;
  
  // ↓↓↓↓↓↓↓ 이 부분을 추가하세요 ↓↓↓↓↓↓
  @IsString()
  @IsNotEmpty()
  @MinLength(4, { message: '비밀번호는 최소 4자 이상이어야 합니다.' }) // 최소 길이 검사 추가
  password: string;
}
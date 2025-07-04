import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('videos')
export class Video {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  video_id: number;

  @Column({ type: 'bigint' })
  user_id: number;

  @Column({ type: 'bigint', nullable: true })
  parent_video_id: number;

  @Column({ type: 'int', default: 0 })
  depth: number;

  @Column({ length: 255 })
  video_key: string;

  @Column({ length: 255 })
  thumbnail_key: string;

  @Column({ type: 'int', default: 0 })
  like_count: number;

  @Column({ type: 'int', default: 0 })
  comment_count: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}

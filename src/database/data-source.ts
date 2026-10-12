import { existsSync } from 'node:fs';
import { DataSource } from 'typeorm';
import { validate } from '../config/env.validation.js';
import { User } from '../users/entities/user.entity.js';

if (existsSync('.env')) {
  process.loadEnvFile();
}

const env = validate(process.env);

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.DB_HOST,
  port: env.DB_PORT,
  username: env.DB_USERNAME,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  entities: [User],
  migrations: ['dist/database/migrations/*.js'],
  synchronize: false,
});

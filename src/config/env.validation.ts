import { plainToInstance } from "class-transformer";
import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Max, Min, MinLength, validateSync } from "class-validator";

export enum Environment {
  Development = 'development',
  Test = 'test',
  Production = 'production',
}

export class EnvironmentVariables {
    @IsOptional()
    @IsEnum(Environment)
    NODE_ENV: Environment = Environment.Development;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(65535)
    PORT: number = 3000;

    @IsString()
    @IsNotEmpty()
    DB_HOST: string;

    @IsInt()
    @Min(1)
    @Max(65535)
    DB_PORT: number;

    @IsString()
    @IsNotEmpty()
    DB_USERNAME: string;

    @IsString()
    @IsNotEmpty()
    DB_PASSWORD: string;

    @IsString()
    @IsNotEmpty()
    DB_NAME: string;

    @IsString()
    @MinLength(32)
    JWT_ACCESS_SECRET: string;

    @IsString()
    @MinLength(32)
    JWT_REFRESH_SECRET: string;

    @IsOptional()
    @IsInt()
    @IsPositive()
    JWT_ACCESS_TTL: number = 900;

    @IsOptional()
    @IsInt()
    @IsPositive()
    JWT_REFRESH_TTL: number = 604800;
}

export function validate(config: Record<string, unknown>): EnvironmentVariables {
    const validatedConfig = plainToInstance(EnvironmentVariables, config, { enableImplicitConversion: true });
    const errors = validateSync(validatedConfig, { skipMissingProperties: false });
    if (errors.length > 0) {
        throw new Error(errors.toString());
    }
    if (validatedConfig.JWT_ACCESS_SECRET === validatedConfig.JWT_REFRESH_SECRET) {
        throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different');
    }
    return validatedConfig;
}
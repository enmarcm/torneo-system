/// <reference types="node" />
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV?: string;
    TZ?: string;
    DATABASE_URL: string;
    BACKEND_PORT?: string;
    JWT_ACCESS_SECRET: string;
    JWT_REFRESH_SECRET: string;
    JWT_ACCESS_EXPIRES?: string;
    JWT_REFRESH_EXPIRES?: string;
    CORS_ORIGIN?: string;
    UPLOAD_MAX_MB?: string;
    ADMIN_EMAIL: string;
    ADMIN_PASSWORD: string;
    MINIO_ENDPOINT: string;
    MINIO_PORT?: string;
    MINIO_USE_SSL?: string;
    MINIO_ROOT_USER: string;
    MINIO_ROOT_PASSWORD: string;
    MINIO_PUBLIC_BUCKET: string;
    MINIO_PRIVATE_BUCKET: string;
  }
}

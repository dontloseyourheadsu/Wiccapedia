use anyhow::Result;
use config::{Config, ConfigError, Environment, File};
use serde::Deserialize;
use std::env;

#[derive(Debug, Deserialize, Clone)]
pub struct AppConfig {
    pub server: ServerConfig,
    pub database: DatabaseConfig,
    pub minio: MinioConfig,
}

#[derive(Debug, Deserialize, Clone)]
pub struct ServerConfig {
    pub host: String,
    pub port: u16,
    pub cors_origins: Vec<String>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct DatabaseConfig {
    pub url: String,
    pub max_connections: u32,
    pub min_connections: u32,
    pub connect_timeout: u64,
    pub idle_timeout: u64,
}

#[derive(Debug, Deserialize, Clone)]
pub struct MinioConfig {
    pub endpoint: String,
    pub access_key: String,
    pub secret_key: String,
    pub bucket_name: String,
    pub region: String,
}

impl AppConfig {
    pub fn from_env() -> Result<Self, ConfigError> {
        let config = Config::builder()
            .add_source(File::with_name("config/default").required(false))
            .add_source(File::with_name("config/local").required(false))
            .add_source(Environment::with_prefix("WICCAPEDIA"))
            .set_default("server.host", "127.0.0.1")?
            .set_default("server.port", 8080)?
            .set_default("server.cors_origins", vec!["http://localhost:4200", "http://127.0.0.1:4200"])?
            .set_default("database.url", "postgresql://wiccapedia_user:wiccapedia_password@localhost:5432/wiccapedia")?
            .set_default("database.max_connections", 10)?
            .set_default("database.min_connections", 5)?
            .set_default("database.connect_timeout", 30)?
            .set_default("database.idle_timeout", 600)?
            .set_default("minio.endpoint", "http://localhost:9000")?
            .set_default("minio.access_key", "wiccapedia_admin")?
            .set_default("minio.secret_key", "wiccapedia_admin_password")?
            .set_default("minio.region", "us-east-1")?
            .set_default("minio.bucket_name", "gem-images")?
            .build()?;

        // Override with environment variables if present
        let mut app_config: AppConfig = config.try_deserialize()?;
        
        // Database URL from environment
        if let Ok(db_url) = env::var("DATABASE_URL") {
            app_config.database.url = db_url;
        }
        
        // MinIO configuration from environment
        if let Ok(endpoint) = env::var("MINIO_ENDPOINT") {
            app_config.minio.endpoint = endpoint;
        }
        if let Ok(access_key) = env::var("MINIO_ACCESS_KEY") {
            app_config.minio.access_key = access_key;
        }
        if let Ok(secret_key) = env::var("MINIO_SECRET_KEY") {
            app_config.minio.secret_key = secret_key;
        }

        Ok(app_config)
    }
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            server: ServerConfig {
                host: "127.0.0.1".to_string(),
                port: 8080,
                cors_origins: vec![
                    "http://localhost:4200".to_string(),
                    "http://127.0.0.1:4200".to_string(),
                ],
            },
            database: DatabaseConfig {
                url: "postgresql://wiccapedia_user:wiccapedia_password@localhost:5432/wiccapedia".to_string(),
                max_connections: 10,
                min_connections: 5,
                connect_timeout: 30,
                idle_timeout: 600,
            },
            minio: MinioConfig {
                endpoint: "http://localhost:9000".to_string(),
                access_key: "wiccapedia_admin".to_string(),
                secret_key: "wiccapedia_admin_password".to_string(),
                bucket_name: "gem-images".to_string(),
                region: "us-east-1".to_string(),
            },
        }
    }
}

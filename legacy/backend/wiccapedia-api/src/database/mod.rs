use anyhow::Result;
use sqlx::{PgPool, postgres::PgPoolOptions};
use std::time::Duration;
use tracing::{info, error};

use crate::config::DatabaseConfig;

/// Database connection manager
pub struct Database {
    pool: PgPool,
}

impl Database {
    /// Create a new database connection pool
    pub async fn new(config: &DatabaseConfig) -> Result<Self> {
        info!("Connecting to database...");
        
        let pool = PgPoolOptions::new()
            .max_connections(config.max_connections)
            .min_connections(config.min_connections)
            .acquire_timeout(Duration::from_secs(config.connect_timeout))
            .idle_timeout(Duration::from_secs(config.idle_timeout))
            .connect(&config.url)
            .await?;

        // Run migrations
        Self::run_migrations(&pool).await?;

        info!("✅ Database connected successfully");
        
        Ok(Self { pool })
    }

    /// Get a reference to the connection pool
    pub fn pool(&self) -> &PgPool {
        &self.pool
    }

    /// Run database migrations
    async fn run_migrations(pool: &PgPool) -> Result<()> {
        info!("Running database migrations...");
        
        // Since we're using Docker with init scripts, we just verify the schema exists
        let result = sqlx::query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gems'")
            .fetch_optional(pool)
            .await?;

        if result.is_some() {
            info!("✅ Database schema verified");
        } else {
            error!("❌ Database schema not found. Ensure Docker containers are properly initialized.");
            return Err(anyhow::anyhow!("Database schema not initialized"));
        }

        Ok(())
    }

    /// Health check for the database
    pub async fn health_check(&self) -> Result<()> {
        sqlx::query("SELECT 1 as health_check")
            .fetch_one(&self.pool)
            .await?;
        Ok(())
    }
}

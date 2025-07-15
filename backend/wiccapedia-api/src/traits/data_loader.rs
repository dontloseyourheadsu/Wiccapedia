use async_trait::async_trait;
use anyhow::Result;
use crate::models::Gem;

/// Trait for loading data from various sources
#[async_trait]
pub trait DataLoader: Send + Sync {
    /// Load gems from data source
    async fn load_gems(&self) -> Result<Vec<Gem>>;
    
    /// Save gems to data source
    async fn save_gems(&self, gems: &[Gem]) -> Result<()>;
    
    /// Check if data source is available
    async fn is_available(&self) -> bool;
    
    /// Get data source type
    fn source_type(&self) -> &'static str;
}

/// Trait for image handling
#[async_trait]
pub trait ImageProvider: Send + Sync {
    /// Check if image exists
    async fn image_exists(&self, path: &str) -> bool;
    
    /// Get image URL
    async fn get_image_url(&self, path: &str) -> Result<String>;
    
    /// Save image
    async fn save_image(&self, path: &str, data: &[u8]) -> Result<()>;
    
    /// Delete image
    async fn delete_image(&self, path: &str) -> Result<()>;
}

use async_trait::async_trait;
use anyhow::Result;
use std::path::Path;
use tokio::fs;
use tracing::{info, error};

use crate::traits::ImageProvider;

/// File system-based image provider implementation
pub struct FileImageProvider {
    base_path: String,
    base_url: String,
}

impl FileImageProvider {
    pub fn new(base_path: &str, base_url: &str) -> Self {
        Self {
            base_path: base_path.to_string(),
            base_url: base_url.to_string(),
        }
    }

    /// Get the full file system path for an image
    fn get_full_path(&self, path: &str) -> String {
        // Remove leading slash if present
        let clean_path = path.trim_start_matches('/');
        format!("{}/{}", self.base_path.trim_end_matches('/'), clean_path)
    }

    /// Ensure directory exists for the given file path
    async fn ensure_directory_exists(&self, file_path: &str) -> Result<()> {
        if let Some(parent_dir) = Path::new(file_path).parent() {
            if !parent_dir.exists() {
                fs::create_dir_all(parent_dir).await?;
                info!("Created directory: {:?}", parent_dir);
            }
        }
        Ok(())
    }
}

#[async_trait]
impl ImageProvider for FileImageProvider {
    async fn image_exists(&self, path: &str) -> bool {
        let full_path = self.get_full_path(path);
        Path::new(&full_path).exists()
    }

    async fn get_image_url(&self, path: &str) -> Result<String> {
        let clean_path = path.trim_start_matches('/');
        let url = format!("{}/{}", self.base_url.trim_end_matches('/'), clean_path);
        
        // Check if image exists
        if self.image_exists(path).await {
            Ok(url)
        } else {
            // Return a default/placeholder image URL
            let default_url = format!("{}/default-gem.jpg", self.base_url.trim_end_matches('/'));
            info!("Image not found at {}, returning default: {}", path, default_url);
            Ok(default_url)
        }
    }

    async fn save_image(&self, path: &str, data: &[u8]) -> Result<()> {
        let full_path = self.get_full_path(path);
        
        // Ensure directory exists
        self.ensure_directory_exists(&full_path).await?;
        
        // Write the image data
        fs::write(&full_path, data).await?;
        
        info!("Saved image to: {}", full_path);
        Ok(())
    }

    async fn delete_image(&self, path: &str) -> Result<()> {
        let full_path = self.get_full_path(path);
        
        if Path::new(&full_path).exists() {
            fs::remove_file(&full_path).await?;
            info!("Deleted image: {}", full_path);
        } else {
            error!("Image not found for deletion: {}", full_path);
        }
        
        Ok(())
    }
}
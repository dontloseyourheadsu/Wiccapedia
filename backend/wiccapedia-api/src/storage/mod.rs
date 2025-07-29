use anyhow::Result;
use aws_config::{BehaviorVersion, Region};
use aws_credential_types::Credentials;
use aws_sdk_s3::{Client, config::Builder as S3ConfigBuilder};
use bytes::Bytes;
use tracing::{info, error, warn};
use uuid::Uuid;
use std::path::Path;

use crate::config::MinioConfig;

/// S3-compatible MinIO client
pub struct S3Client {
    client: Client,
    bucket_name: String,
}

impl S3Client {
    /// Create a new S3 client configured for MinIO
    pub async fn new(config: &MinioConfig) -> Result<Self> {
        info!("Initializing S3 client for MinIO...");

        let credentials = Credentials::new(
            &config.access_key,
            &config.secret_key,
            None,
            None,
            "wiccapedia-minio",
        );

        let s3_config = S3ConfigBuilder::new()
            .region(Region::new(config.region.clone()))
            .endpoint_url(&config.endpoint)
            .credentials_provider(credentials)
            .force_path_style(true) // Required for MinIO
            .behavior_version(BehaviorVersion::latest())
            .build();

        let client = Client::from_conf(s3_config);

        // Verify bucket exists
        let s3_client = Self {
            client,
            bucket_name: config.bucket_name.clone(),
        };

        s3_client.ensure_bucket_exists().await?;

        info!("✅ S3 client initialized successfully");
        Ok(s3_client)
    }

    /// Ensure the bucket exists
    async fn ensure_bucket_exists(&self) -> Result<()> {
        match self.client.head_bucket()
            .bucket(&self.bucket_name)
            .send()
            .await
        {
            Ok(_) => {
                info!("✅ Bucket '{}' exists", self.bucket_name);
                Ok(())
            }
            Err(_) => {
                warn!("Bucket '{}' does not exist or is not accessible", self.bucket_name);
                Err(anyhow::anyhow!("Bucket not accessible: {}", self.bucket_name))
            }
        }
    }

    /// Upload an image file
    pub async fn upload_image(&self, file_data: Bytes, content_type: &str) -> Result<String> {
        let file_extension = match content_type {
            "image/jpeg" => "jpg",
            "image/png" => "png",
            "image/gif" => "gif",
            "image/webp" => "webp",
            _ => "jpg", // Default to jpg
        };

        let file_key = format!("{}.{}", Uuid::new_v4(), file_extension);

        info!("📤 Uploading image: {}", file_key);

        self.client
            .put_object()
            .bucket(&self.bucket_name)
            .key(&file_key)
            .body(file_data.into())
            .content_type(content_type)
            .cache_control("public, max-age=31536000") // 1 year cache
            .send()
            .await?;

        let image_url = format!("{}/{}/{}", 
            self.get_endpoint_without_protocol(),
            self.bucket_name, 
            file_key
        );

        info!("✅ Image uploaded successfully: {}", image_url);
        Ok(image_url)
    }

    /// Upload an image with a specific filename
    pub async fn upload_image_with_name(&self, file_data: Bytes, filename: &str, content_type: &str) -> Result<String> {
        info!("📤 Uploading image with name: {}", filename);

        self.client
            .put_object()
            .bucket(&self.bucket_name)
            .key(filename)
            .body(file_data.into())
            .content_type(content_type)
            .cache_control("public, max-age=31536000") // 1 year cache
            .send()
            .await?;

        let image_url = format!("{}/{}/{}", 
            self.get_endpoint_without_protocol(),
            self.bucket_name, 
            filename
        );

        info!("✅ Image uploaded successfully: {}", image_url);
        Ok(image_url)
    }

    /// Delete an image
    pub async fn delete_image(&self, image_url: &str) -> Result<()> {
        let key = self.extract_key_from_url(image_url)?;
        
        info!("🗑️ Deleting image: {}", key);

        self.client
            .delete_object()
            .bucket(&self.bucket_name)
            .key(&key)
            .send()
            .await?;

        info!("✅ Image deleted successfully: {}", key);
        Ok(())
    }

    /// Check if an image exists
    pub async fn image_exists(&self, image_url: &str) -> bool {
        let key = match self.extract_key_from_url(image_url) {
            Ok(k) => k,
            Err(_) => return false,
        };

        self.client
            .head_object()
            .bucket(&self.bucket_name)
            .key(&key)
            .send()
            .await
            .is_ok()
    }

    /// Get the public URL for an image
    pub fn get_image_url(&self, filename: &str) -> String {
        format!("{}/{}/{}", 
            self.get_endpoint_without_protocol(),
            self.bucket_name, 
            filename
        )
    }

    /// Extract the S3 key from a full URL
    fn extract_key_from_url(&self, url: &str) -> Result<String> {
        let path = Path::new(url);
        let filename = path.file_name()
            .and_then(|name| name.to_str())
            .ok_or_else(|| anyhow::anyhow!("Invalid image URL: {}", url))?;
        Ok(filename.to_string())
    }

    /// Get endpoint without protocol for URL construction
    fn get_endpoint_without_protocol(&self) -> String {
        // The client endpoint should already be configured properly
        // For MinIO, we typically want http://localhost:9000 format
        "http://localhost:9000".to_string()
    }

    /// Health check for S3/MinIO
    pub async fn health_check(&self) -> Result<()> {
        self.client
            .head_bucket()
            .bucket(&self.bucket_name)
            .send()
            .await?;
        Ok(())
    }
}

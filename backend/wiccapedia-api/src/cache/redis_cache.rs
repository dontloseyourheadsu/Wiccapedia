use std::sync::Arc;
use anyhow::Result;
use redis::{AsyncCommands, Client};
use serde::{Serialize, de::DeserializeOwned};
use tracing::info;

use crate::config::RedisConfig;

#[derive(Clone)]
pub struct RedisCache {
    client: Client,
    namespace: String,
    default_ttl: usize,
}

impl RedisCache {
    pub async fn new(config: &RedisConfig) -> Result<Arc<Self>> {
        let client = Client::open(config.url.clone())?;
        // Try a ping to verify connectivity
        let mut conn = client.get_async_connection().await?;
        let _: String = redis::cmd("PING").query_async(&mut conn).await?;
        info!("✅ Connected to Redis cache");
        Ok(Arc::new(Self {
            client,
            namespace: config.namespace.clone(),
            default_ttl: config.default_ttl_seconds as usize,
        }))
    }

    fn make_key(&self, parts: &[&str]) -> String {
        let mut key = String::from(&self.namespace);
        for p in parts {
            key.push(':');
            key.push_str(p);
        }
        key
    }

    pub async fn get_json<T: DeserializeOwned>(&self, key: &str) -> Result<Option<T>> {
        let namespaced = self.make_key(&[key]);
        let mut conn = self.client.get_async_connection().await?;
        let data: Option<Vec<u8>> = conn.get(namespaced).await?;
        if let Some(bytes) = data {
            let value = serde_json::from_slice::<T>(&bytes)?;
            Ok(Some(value))
        } else {
            Ok(None)
        }
    }

    pub async fn set_json<T: Serialize>(&self, key: &str, value: &T, ttl: Option<usize>) -> Result<()> {
        let namespaced = self.make_key(&[key]);
        let mut conn = self.client.get_async_connection().await?;
        let bytes = serde_json::to_vec(value)?;
        let ttl = ttl.unwrap_or(self.default_ttl) as u64;
        let _: () = conn.set_ex(namespaced, bytes, ttl).await?;
        Ok(())
    }

    /// Versioning to invalidate groups without scanning keys
    pub async fn get_version(&self, group: &str) -> Result<u64> {
        let key = self.make_key(&["version", group]);
        let mut conn = self.client.get_async_connection().await?;
        let v: Option<u64> = conn.get(key).await?;
        Ok(v.unwrap_or(1))
    }

    pub async fn incr_version(&self, group: &str) -> Result<u64> {
        let key = self.make_key(&["version", group]);
        let mut conn = self.client.get_async_connection().await?;
        let v: u64 = conn.incr(key, 1_u64).await?;
        Ok(v)
    }

    pub async fn del(&self, key: &str) -> Result<()> {
        let namespaced = self.make_key(&[key]);
        let mut conn = self.client.get_async_connection().await?;
        let _: () = conn.del(namespaced).await?;
        Ok(())
    }
}


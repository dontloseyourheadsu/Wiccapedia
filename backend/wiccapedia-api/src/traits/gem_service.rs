use async_trait::async_trait;
use anyhow::Result;
use crate::models::{Gem, GemFilters, PaginationParams, PaginatedResponse};

/// Trait for gem service operations
#[async_trait]
pub trait GemService: Send + Sync {
    /// Get paginated list of gems with filters
    async fn get_gems(
        &self,
        filters: GemFilters,
        pagination: PaginationParams,
    ) -> Result<PaginatedResponse<Gem>>;

    /// Get a specific gem by ID
    async fn get_gem_by_id(&self, id: &str) -> Result<Option<Gem>>;

    /// Add a new gem
    async fn add_gem(&self, gem: Gem) -> Result<Gem>;

    /// Update an existing gem
    async fn update_gem(&self, id: &str, gem: Gem) -> Result<Option<Gem>>;

    /// Delete a gem
    async fn delete_gem(&self, id: &str) -> Result<bool>;

    /// Get all unique colors
    async fn get_unique_colors(&self) -> Result<Vec<String>>;

    /// Get all unique categories
    async fn get_unique_categories(&self) -> Result<Vec<String>>;

    /// Get all unique chemical formulas
    async fn get_unique_formulas(&self) -> Result<Vec<String>>;

    /// Search gems by term
    async fn search_gems(&self, term: &str) -> Result<Vec<Gem>>;
}

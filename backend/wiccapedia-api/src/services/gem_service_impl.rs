use async_trait::async_trait;
use anyhow::Result;
use std::sync::Arc;
use tokio::sync::RwLock;
use uuid::Uuid;

use crate::models::{Gem, GemFilters, PaginationParams, PaginatedResponse, Cursor, CursorDirection, SortOption};
use crate::traits::{GemService, DataLoader};

/// Implementation of GemService trait
pub struct GemServiceImpl {
    data_loader: Arc<dyn DataLoader>,
    gems_cache: Arc<RwLock<Vec<Gem>>>,
    cache_loaded: Arc<RwLock<bool>>,
}

impl GemServiceImpl {
    pub fn new(data_loader: Arc<dyn DataLoader>) -> Self {
        Self {
            data_loader,
            gems_cache: Arc::new(RwLock::new(Vec::new())),
            cache_loaded: Arc::new(RwLock::new(false)),
        }
    }

    /// Ensure cache is loaded
    async fn ensure_cache_loaded(&self) -> Result<()> {
        let cache_loaded = *self.cache_loaded.read().await;
        if !cache_loaded {
            let gems = self.data_loader.load_gems().await?;
            *self.gems_cache.write().await = gems;
            *self.cache_loaded.write().await = true;
        }
        Ok(())
    }

    /// Apply filters to gems
    fn apply_filters(&self, gems: &[Gem], filters: &GemFilters) -> Vec<Gem> {
        gems.iter()
            .filter(|gem| {
                // Apply search filter
                if let Some(search_term) = filters.get_search_term() {
                    if !gem.matches_search(search_term) {
                        return false;
                    }
                }

                // Apply color filter
                if !gem.matches_color(&filters.color) {
                    return false;
                }

                // Apply category filter
                if !gem.matches_category(&filters.category) {
                    return false;
                }

                // Apply chemical formula filter
                if !gem.matches_formula(&filters.chemical_formula) {
                    return false;
                }

                true
            })
            .cloned()
            .collect()
    }

    /// Apply sorting to gems
    fn apply_sorting(&self, mut gems: Vec<Gem>, order_by: &Option<String>) -> Vec<Gem> {
        if let Some(order_by_str) = order_by {
            let sort_options = SortOption::parse_orderby(order_by_str);
            
            for sort_option in sort_options.iter().rev() {
                gems.sort_by(|a, b| {
                    let comparison = match sort_option.field {
                        crate::models::SortField::Name => a.name.cmp(&b.name),
                        crate::models::SortField::Color => a.color.cmp(&b.color),
                        crate::models::SortField::Category => a.category.cmp(&b.category),
                        crate::models::SortField::ChemicalFormula => a.chemical_formula.cmp(&b.chemical_formula),
                    };

                    match sort_option.direction {
                        crate::models::SortDirection::Desc => comparison.reverse(),
                        crate::models::SortDirection::Asc => comparison,
                    }
                });
            }
        } else {
            // Default sort by name
            gems.sort_by(|a, b| a.name.cmp(&b.name));
        }

        gems
    }

    /// Apply pagination to gems
    fn apply_pagination(
        &self,
        gems: Vec<Gem>,
        pagination: &PaginationParams,
    ) -> PaginatedResponse<Gem> {
        let total_count = gems.len();
        let limit = pagination.limit.min(100); // Max 100 items per page

        let (start_offset, end_offset) = if let Some(cursor_str) = &pagination.cursor {
            match Cursor::decode(cursor_str) {
                Ok(cursor) => {
                    match cursor.direction {
                        CursorDirection::Forward => {
                            let start = cursor.offset;
                            let end = (start + limit).min(total_count);
                            (start, end)
                        }
                        CursorDirection::Backward => {
                            let end = cursor.offset;
                            let start = if end >= limit { end - limit } else { 0 };
                            (start, end)
                        }
                    }
                }
                Err(_) => (0, limit.min(total_count)), // Invalid cursor, start from beginning
            }
        } else {
            (0, limit.min(total_count))
        };

        let data = gems[start_offset..end_offset].to_vec();
        
        let has_next = end_offset < total_count;
        let has_previous = start_offset > 0;

        let next_cursor = if has_next {
            let cursor = Cursor::new(end_offset, CursorDirection::Forward);
            cursor.encode().ok()
        } else {
            None
        };

        let previous_cursor = if has_previous {
            let cursor = Cursor::new(start_offset, CursorDirection::Backward);
            cursor.encode().ok()
        } else {
            None
        };

        PaginatedResponse::new(
            data,
            has_next,
            has_previous,
            next_cursor,
            previous_cursor,
            total_count,
            limit,
        )
    }
}

#[async_trait]
impl GemService for GemServiceImpl {
    async fn get_gems(
        &self,
        mut filters: GemFilters,
        pagination: PaginationParams,
    ) -> Result<PaginatedResponse<Gem>> {
        self.ensure_cache_loaded().await?;
        
        // Parse OData filter if present
        filters.parse_odata_filter();

        let gems = self.gems_cache.read().await;
        let filtered_gems = self.apply_filters(&gems, &filters);
        let sorted_gems = self.apply_sorting(filtered_gems, &filters.order_by);
        
        drop(gems); // Release read lock

        Ok(self.apply_pagination(sorted_gems, &pagination))
    }

    async fn get_gem_by_id(&self, id: &str) -> Result<Option<Gem>> {
        self.ensure_cache_loaded().await?;
        
        let uuid = Uuid::parse_str(id)?;
        let gems = self.gems_cache.read().await;
        
        Ok(gems.iter().find(|gem| gem.id == uuid).cloned())
    }

    async fn add_gem(&self, gem: Gem) -> Result<Gem> {
        self.ensure_cache_loaded().await?;
        
        let mut gems = self.gems_cache.write().await;
        gems.push(gem.clone());
        
        // Save to data source
        self.data_loader.save_gems(&gems).await?;
        
        Ok(gem)
    }

    async fn update_gem(&self, id: &str, updated_gem: Gem) -> Result<Option<Gem>> {
        self.ensure_cache_loaded().await?;
        
        let uuid = Uuid::parse_str(id)?;
        let mut gems = self.gems_cache.write().await;
        
        if let Some(pos) = gems.iter().position(|gem| gem.id == uuid) {
            gems[pos] = updated_gem.clone();
            self.data_loader.save_gems(&gems).await?;
            Ok(Some(updated_gem))
        } else {
            Ok(None)
        }
    }

    async fn delete_gem(&self, id: &str) -> Result<bool> {
        self.ensure_cache_loaded().await?;
        
        let uuid = Uuid::parse_str(id)?;
        let mut gems = self.gems_cache.write().await;
        
        if let Some(pos) = gems.iter().position(|gem| gem.id == uuid) {
            gems.remove(pos);
            self.data_loader.save_gems(&gems).await?;
            Ok(true)
        } else {
            Ok(false)
        }
    }

    async fn get_unique_colors(&self) -> Result<Vec<String>> {
        self.ensure_cache_loaded().await?;
        
        let gems = self.gems_cache.read().await;
        let mut colors: Vec<String> = gems.iter()
            .map(|gem| gem.color.clone())
            .collect::<std::collections::HashSet<_>>()
            .into_iter()
            .collect();
        
        colors.sort();
        Ok(colors)
    }

    async fn get_unique_categories(&self) -> Result<Vec<String>> {
        self.ensure_cache_loaded().await?;
        
        let gems = self.gems_cache.read().await;
        let mut categories: Vec<String> = gems.iter()
            .map(|gem| gem.category.clone())
            .collect::<std::collections::HashSet<_>>()
            .into_iter()
            .collect();
        
        categories.sort();
        Ok(categories)
    }

    async fn get_unique_formulas(&self) -> Result<Vec<String>> {
        self.ensure_cache_loaded().await?;
        
        let gems = self.gems_cache.read().await;
        let mut formulas: Vec<String> = gems.iter()
            .map(|gem| gem.chemical_formula.clone())
            .collect::<std::collections::HashSet<_>>()
            .into_iter()
            .collect();
        
        formulas.sort();
        Ok(formulas)
    }

    async fn search_gems(&self, term: &str) -> Result<Vec<Gem>> {
        self.ensure_cache_loaded().await?;
        
        let gems = self.gems_cache.read().await;
        Ok(gems.iter()
            .filter(|gem| gem.matches_search(term))
            .cloned()
            .collect())
    }
}
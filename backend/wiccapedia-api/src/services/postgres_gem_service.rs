use async_trait::async_trait;
use anyhow::Result;
use sqlx::PgPool;
use uuid::Uuid;
use tracing::{info, error, warn};
use chrono::{DateTime, Utc};

use crate::models::{Gem, GemFilters, PaginationParams, PaginatedResponse, CreateGemRequest};
use crate::traits::GemService;

/// PostgreSQL implementation of GemService
pub struct PostgresGemService {
    pool: PgPool,
}

impl PostgresGemService {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    /// Build WHERE clause from filters
    fn build_where_clause(filters: &GemFilters) -> (String, Vec<String>) {
        let mut conditions = Vec::new();
        let mut params = Vec::new();
        let mut param_count = 1;

        if let Some(name) = &filters.name {
            conditions.push(format!("name ILIKE ${}", param_count));
            params.push(format!("%{}%", name));
            param_count += 1;
        }

        if let Some(color) = &filters.color {
            conditions.push(format!("color ILIKE ${}", param_count));
            params.push(format!("%{}%", color));
            param_count += 1;
        }

        if let Some(category) = &filters.category {
            conditions.push(format!("category ILIKE ${}", param_count));
            params.push(format!("%{}%", category));
            param_count += 1;
        }

        if let Some(formula) = &filters.chemical_formula {
            conditions.push(format!("chemical_formula ILIKE ${}", param_count));
            params.push(format!("%{}%", formula));
            param_count += 1;
        }

        // Handle search term
        if let Some(search) = filters.get_search_term() {
            conditions.push(format!(
                "(name ILIKE ${} OR magical_description ILIKE ${} OR category ILIKE ${} OR color ILIKE ${})",
                param_count, param_count + 1, param_count + 2, param_count + 3
            ));
            let search_pattern = format!("%{}%", search);
            params.push(search_pattern.clone());
            params.push(search_pattern.clone());
            params.push(search_pattern.clone());
            params.push(search_pattern);
        }

        let where_clause = if conditions.is_empty() {
            "".to_string()
        } else {
            format!("WHERE {}", conditions.join(" AND "))
        };

        (where_clause, params)
    }

    /// Build ORDER BY clause
    fn build_order_clause(order_by: &Option<String>) -> String {
        match order_by {
            Some(order) if !order.is_empty() => {
                // Parse order_by like "name asc" or "color desc"
                let parts: Vec<&str> = order.split_whitespace().collect();
                let field = parts.get(0).unwrap_or(&"name");
                let direction = parts.get(1).unwrap_or(&"asc");
                
                let safe_field = match *field {
                    "name" | "color" | "category" | "chemical_formula" | "created_at" => field,
                    _ => "name",
                };
                
                let safe_direction = match *direction {
                    "desc" | "DESC" => "DESC",
                    _ => "ASC",
                };
                
                format!("ORDER BY {} {}", safe_field, safe_direction)
            }
            _ => "ORDER BY name ASC".to_string(),
        }
    }
}

#[async_trait]
impl GemService for PostgresGemService {
    async fn get_gems(
        &self,
        filters: GemFilters,
        pagination: PaginationParams,
    ) -> Result<PaginatedResponse<Gem>> {
        info!("Fetching gems with filters: {:?}", filters);

        let (where_clause, params) = Self::build_where_clause(&filters);
        let order_clause = Self::build_order_clause(&filters.order_by);
        
        // Calculate offset from cursor
        let offset = if let Some(cursor) = &pagination.cursor {
            // Simple cursor implementation - in production, use more sophisticated cursor
            cursor.parse::<i64>().unwrap_or(0)
        } else {
            0
        };

        let limit = pagination.limit.min(100) as i64; // Cap at 100

        // Build the query
        let base_query = format!(
            "SELECT id, name, image, magical_description, category, color, chemical_formula, created_at, updated_at FROM gems {}",
            where_clause
        );
        
        let count_query = format!("SELECT COUNT(*) FROM gems {}", where_clause);
        let data_query = format!("{} {} LIMIT {} OFFSET {}", base_query, order_clause, limit, offset);

        // Execute count query
        let mut count_query_builder = sqlx::query_scalar::<_, i64>(&count_query);
        for param in &params {
            count_query_builder = count_query_builder.bind(param);
        }
        let total_count = count_query_builder.fetch_one(&self.pool).await? as usize;

        // Execute data query
        let mut data_query_builder = sqlx::query_as::<_, GemRow>(&data_query);
        for param in &params {
            data_query_builder = data_query_builder.bind(param);
        }
        let rows = data_query_builder.fetch_all(&self.pool).await?;

        let gems: Vec<Gem> = rows.into_iter().map(|row| row.into()).collect();

        // Calculate pagination info
        let has_next = (offset + limit) < total_count as i64;
        let has_previous = offset > 0;
        let next_cursor = if has_next {
            Some((offset + limit).to_string())
        } else {
            None
        };
        let previous_cursor = if has_previous {
            Some((offset - limit).max(0).to_string())
        } else {
            None
        };

        Ok(PaginatedResponse::new(
            gems,
            has_next,
            has_previous,
            next_cursor,
            previous_cursor,
            total_count,
            pagination.limit,
        ))
    }

    async fn get_gem_by_id(&self, id: &str) -> Result<Option<Gem>> {
        info!("Fetching gem by ID: {}", id);

        let uuid = Uuid::parse_str(id)?;
        
        let row = sqlx::query_as::<_, GemRow>(
            "SELECT id, name, image, magical_description, category, color, chemical_formula, created_at, updated_at 
             FROM gems WHERE id = $1"
        )
        .bind(uuid)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(|row| row.into()))
    }

    async fn add_gem(&self, gem: Gem) -> Result<Gem> {
        info!("Adding new gem: {}", gem.name);

        let row = sqlx::query_as::<_, GemRow>(
            "INSERT INTO gems (id, name, image, magical_description, category, color, chemical_formula) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) 
             RETURNING id, name, image, magical_description, category, color, chemical_formula, created_at, updated_at"
        )
        .bind(gem.id)
        .bind(&gem.name)
        .bind(&gem.image)
        .bind(&gem.magical_description)
        .bind(&gem.category)
        .bind(&gem.color)
        .bind(&gem.chemical_formula)
        .fetch_one(&self.pool)
        .await?;

        info!("✅ Gem added successfully: {}", gem.name);
        Ok(row.into())
    }

    async fn update_gem(&self, id: &str, updated_gem: Gem) -> Result<Option<Gem>> {
        info!("Updating gem: {}", id);

        let uuid = Uuid::parse_str(id)?;
        
        let row = sqlx::query_as::<_, GemRow>(
            "UPDATE gems 
             SET name = $2, image = $3, magical_description = $4, category = $5, color = $6, chemical_formula = $7
             WHERE id = $1 
             RETURNING id, name, image, magical_description, category, color, chemical_formula, created_at, updated_at"
        )
        .bind(uuid)
        .bind(&updated_gem.name)
        .bind(&updated_gem.image)
        .bind(&updated_gem.magical_description)
        .bind(&updated_gem.category)
        .bind(&updated_gem.color)
        .bind(&updated_gem.chemical_formula)
        .fetch_optional(&self.pool)
        .await?;

        match row {
            Some(row) => {
                info!("✅ Gem updated successfully: {}", id);
                Ok(Some(row.into()))
            }
            None => {
                warn!("Gem not found for update: {}", id);
                Ok(None)
            }
        }
    }

    async fn update_gem_by_name(&self, name: &str, updated_gem: Gem) -> Result<Option<Gem>> {
        info!("Updating gem by name: {}", name);

        let row = sqlx::query_as::<_, GemRow>(
            "UPDATE gems 
             SET name = $2, image = $3, magical_description = $4, category = $5, color = $6, chemical_formula = $7, updated_at = CURRENT_TIMESTAMP
             WHERE name = $1
             RETURNING *"
        )
        .bind(name)
        .bind(&updated_gem.name)
        .bind(&updated_gem.image)
        .bind(&updated_gem.magical_description)
        .bind(&updated_gem.category)
        .bind(&updated_gem.color)
        .bind(&updated_gem.chemical_formula)
        .fetch_optional(&self.pool)
        .await?;

        match row {
            Some(row) => {
                info!("✅ Gem updated successfully by name: {}", name);
                Ok(Some(row.into()))
            }
            None => {
                warn!("Gem not found for update by name: {}", name);
                Ok(None)
            }
        }
    }

    async fn delete_gem(&self, id: &str) -> Result<bool> {
        info!("Deleting gem: {}", id);

        let uuid = Uuid::parse_str(id)?;
        
        let result = sqlx::query("DELETE FROM gems WHERE id = $1")
            .bind(uuid)
            .execute(&self.pool)
            .await?;

        let deleted = result.rows_affected() > 0;
        if deleted {
            info!("✅ Gem deleted successfully: {}", id);
        } else {
            warn!("Gem not found for deletion: {}", id);
        }

        Ok(deleted)
    }

    async fn get_unique_colors(&self) -> Result<Vec<String>> {
        info!("Fetching unique colors");

        let colors = sqlx::query_scalar::<_, String>(
            "SELECT DISTINCT color FROM gems WHERE color IS NOT NULL AND color != '' ORDER BY color"
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(colors)
    }

    async fn get_unique_categories(&self) -> Result<Vec<String>> {
        info!("Fetching unique categories");

        let categories = sqlx::query_scalar::<_, String>(
            "SELECT DISTINCT category FROM gems WHERE category IS NOT NULL AND category != '' ORDER BY category"
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(categories)
    }

    async fn get_unique_formulas(&self) -> Result<Vec<String>> {
        info!("Fetching unique chemical formulas");

        let formulas = sqlx::query_scalar::<_, String>(
            "SELECT DISTINCT chemical_formula FROM gems WHERE chemical_formula IS NOT NULL AND chemical_formula != '' ORDER BY chemical_formula"
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(formulas)
    }

    async fn search_gems(&self, term: &str) -> Result<Vec<Gem>> {
        info!("Searching gems with term: {}", term);

        let rows = sqlx::query_as::<_, GemRow>(
            "SELECT g.id, g.name, g.image, g.magical_description, g.category, g.color, g.chemical_formula, g.created_at, g.updated_at
             FROM search_gems($1) g 
             ORDER BY g.rank DESC 
             LIMIT 50"
        )
        .bind(term)
        .fetch_all(&self.pool)
        .await?;

        let gems: Vec<Gem> = rows.into_iter().map(|row| row.into()).collect();
        Ok(gems)
    }
}

/// Database row representation
#[derive(sqlx::FromRow)]
struct GemRow {
    id: Uuid,
    name: String,
    image: String,
    magical_description: String,
    category: String,
    color: String,
    chemical_formula: String,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}

impl From<GemRow> for Gem {
    fn from(row: GemRow) -> Self {
        Self {
            id: row.id,
            name: row.name,
            image: row.image,
            magical_description: row.magical_description,
            category: row.category,
            color: row.color,
            chemical_formula: row.chemical_formula,
        }
    }
}

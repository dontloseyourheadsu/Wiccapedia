use actix_web::{web, HttpResponse, Result};
use std::sync::Arc;
use tracing::{info, error};

use crate::models::{GemFilters, PaginationParams, CreateGemRequest, Gem};
use crate::traits::GemService;

/// Handler for getting paginated gems with filters
pub async fn get_gems(
    gem_service: web::Data<Arc<dyn GemService>>,
    query: web::Query<GemFilters>,
    pagination: web::Query<PaginationParams>,
) -> Result<HttpResponse> {
    info!("GET /api/gems - Filters: {:?}, Pagination: {:?}", query, pagination);

    match gem_service.get_gems(query.into_inner(), pagination.into_inner()).await {
        Ok(response) => {
            info!("Successfully retrieved {} gems", response.data.len());
            Ok(HttpResponse::Ok().json(response))
        }
        Err(e) => {
            error!("Failed to get gems: {}", e);
            Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to retrieve gems",
                "message": e.to_string()
            })))
        }
    }
}

/// Handler for getting a specific gem by ID
pub async fn get_gem_by_id(
    gem_service: web::Data<Arc<dyn GemService>>,
    path: web::Path<String>,
) -> Result<HttpResponse> {
    let gem_id = path.into_inner();
    info!("GET /api/gems/{}", gem_id);

    match gem_service.get_gem_by_id(&gem_id).await {
        Ok(Some(gem)) => {
            info!("Successfully retrieved gem: {}", gem.name);
            Ok(HttpResponse::Ok().json(gem))
        }
        Ok(None) => {
            info!("Gem not found: {}", gem_id);
            Ok(HttpResponse::NotFound().json(serde_json::json!({
                "error": "Gem not found",
                "id": gem_id
            })))
        }
        Err(e) => {
            error!("Failed to get gem {}: {}", gem_id, e);
            Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to retrieve gem",
                "message": e.to_string()
            })))
        }
    }
}

/// Handler for creating a new gem
pub async fn create_gem(
    gem_service: web::Data<Arc<dyn GemService>>,
    gem_data: web::Json<CreateGemRequest>,
) -> Result<HttpResponse> {
    info!("POST /api/gems - Creating gem: {}", gem_data.name);

    let gem: Gem = gem_data.into_inner().into();

    match gem_service.add_gem(gem).await {
        Ok(created_gem) => {
            info!("Successfully created gem: {} (ID: {})", created_gem.name, created_gem.id);
            Ok(HttpResponse::Created().json(created_gem))
        }
        Err(e) => {
            error!("Failed to create gem: {}", e);
            Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to create gem",
                "message": e.to_string()
            })))
        }
    }
}

/// Handler for updating an existing gem
pub async fn update_gem(
    gem_service: web::Data<Arc<dyn GemService>>,
    path: web::Path<String>,
    gem_data: web::Json<CreateGemRequest>,
) -> Result<HttpResponse> {
    let gem_id = path.into_inner();
    info!("PUT /api/gems/{} - Updating gem", gem_id);

    // Convert CreateGemRequest to Gem, but preserve the ID from the path
    let mut gem: Gem = gem_data.into_inner().into();
    
    // Parse the ID from the path and set it
    match uuid::Uuid::parse_str(&gem_id) {
        Ok(uuid) => gem.id = uuid,
        Err(_) => {
            return Ok(HttpResponse::BadRequest().json(serde_json::json!({
                "error": "Invalid gem ID format"
            })));
        }
    }

    match gem_service.update_gem(&gem_id, gem).await {
        Ok(Some(updated_gem)) => {
            info!("Successfully updated gem: {} (ID: {})", updated_gem.name, updated_gem.id);
            Ok(HttpResponse::Ok().json(updated_gem))
        }
        Ok(None) => {
            info!("Gem not found for update: {}", gem_id);
            Ok(HttpResponse::NotFound().json(serde_json::json!({
                "error": "Gem not found",
                "id": gem_id
            })))
        }
        Err(e) => {
            error!("Failed to update gem {}: {}", gem_id, e);
            Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to update gem",
                "message": e.to_string()
            })))
        }
    }
}

/// Handler for deleting a gem
pub async fn delete_gem(
    gem_service: web::Data<Arc<dyn GemService>>,
    path: web::Path<String>,
) -> Result<HttpResponse> {
    let gem_id = path.into_inner();
    info!("DELETE /api/gems/{}", gem_id);

    match gem_service.delete_gem(&gem_id).await {
        Ok(true) => {
            info!("Successfully deleted gem: {}", gem_id);
            Ok(HttpResponse::NoContent().finish())
        }
        Ok(false) => {
            info!("Gem not found for deletion: {}", gem_id);
            Ok(HttpResponse::NotFound().json(serde_json::json!({
                "error": "Gem not found",
                "id": gem_id
            })))
        }
        Err(e) => {
            error!("Failed to delete gem {}: {}", gem_id, e);
            Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to delete gem",
                "message": e.to_string()
            })))
        }
    }
}

/// Handler for getting unique colors
pub async fn get_colors(
    gem_service: web::Data<Arc<dyn GemService>>,
) -> Result<HttpResponse> {
    info!("GET /api/gems/metadata/colors");

    match gem_service.get_unique_colors().await {
        Ok(colors) => {
            info!("Successfully retrieved {} unique colors", colors.len());
            Ok(HttpResponse::Ok().json(serde_json::json!({
                "colors": colors
            })))
        }
        Err(e) => {
            error!("Failed to get colors: {}", e);
            Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to retrieve colors",
                "message": e.to_string()
            })))
        }
    }
}

/// Handler for getting unique categories
pub async fn get_categories(
    gem_service: web::Data<Arc<dyn GemService>>,
) -> Result<HttpResponse> {
    info!("GET /api/gems/metadata/categories");

    match gem_service.get_unique_categories().await {
        Ok(categories) => {
            info!("Successfully retrieved {} unique categories", categories.len());
            Ok(HttpResponse::Ok().json(serde_json::json!({
                "categories": categories
            })))
        }
        Err(e) => {
            error!("Failed to get categories: {}", e);
            Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to retrieve categories",
                "message": e.to_string()
            })))
        }
    }
}

/// Handler for getting unique chemical formulas
pub async fn get_formulas(
    gem_service: web::Data<Arc<dyn GemService>>,
) -> Result<HttpResponse> {
    info!("GET /api/gems/metadata/formulas");

    match gem_service.get_unique_formulas().await {
        Ok(formulas) => {
            info!("Successfully retrieved {} unique formulas", formulas.len());
            Ok(HttpResponse::Ok().json(serde_json::json!({
                "formulas": formulas
            })))
        }
        Err(e) => {
            error!("Failed to get formulas: {}", e);
            Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to retrieve formulas",
                "message": e.to_string()
            })))
        }
    }
}

/// Handler for searching gems
pub async fn search_gems(
    gem_service: web::Data<Arc<dyn GemService>>,
    query: web::Query<serde_json::Value>,
) -> Result<HttpResponse> {
    let search_term = query
        .get("q")
        .and_then(|v| v.as_str())
        .unwrap_or("");

    info!("GET /api/gems/search?q={}", search_term);

    if search_term.is_empty() {
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({
            "error": "Search term is required",
            "parameter": "q"
        })));
    }

    match gem_service.search_gems(search_term).await {
        Ok(gems) => {
            info!("Successfully found {} gems matching '{}'", gems.len(), search_term);
            Ok(HttpResponse::Ok().json(serde_json::json!({
                "results": gems,
                "count": gems.len(),
                "query": search_term
            })))
        }
        Err(e) => {
            error!("Failed to search gems: {}", e);
            Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to search gems",
                "message": e.to_string()
            })))
        }
    }
}

use actix_web::{HttpResponse, Result};
use serde_json::json;

/// Health check endpoint
pub async fn health_check() -> Result<HttpResponse> {
    Ok(HttpResponse::Ok().json(json!({
        "status": "healthy",
        "service": "wiccapedia-api",
        "version": "0.1.0",
        "timestamp": chrono::Utc::now().to_rfc3339()
    })))
}

/// API information endpoint
pub async fn api_info() -> Result<HttpResponse> {
    Ok(HttpResponse::Ok().json(json!({
        "name": "Wiccapedia API",
        "description": "RESTful API for managing mystical gems collection",
        "version": "0.1.0",
        "endpoints": {
            "gems": {
                "GET /api/gems": "Get paginated list of gems with optional filters",
                "GET /api/gems/{id}": "Get a specific gem by ID",
                "POST /api/gems": "Create a new gem",
                "PUT /api/gems/{id}": "Update an existing gem",
                "DELETE /api/gems/{id}": "Delete a gem"
            },
            "metadata": {
                "GET /api/gems/metadata/colors": "Get unique colors",
                "GET /api/gems/metadata/categories": "Get unique categories",
                "GET /api/gems/metadata/formulas": "Get unique chemical formulas"
            },
            "search": {
                "GET /api/gems/search?q={term}": "Search gems by term"
            },
            "health": {
                "GET /health": "Health check",
                "GET /": "API information"
            }
        },
        "query_parameters": {
            "pagination": {
                "limit": "Number of items per page (default: 20, max: 100)",
                "cursor": "Cursor for pagination"
            },
            "filters": {
                "$search": "Search term for name, description, or category",
                "$filter": "OData-style filter (e.g., 'color eq Blue and category eq Quartz')",
                "$orderby": "Sort order (e.g., 'name asc, color desc')",
                "name": "Filter by gem name",
                "color": "Filter by color",
                "category": "Filter by category",
                "chemical_formula": "Filter by chemical formula"
            }
        },
        "examples": {
            "basic_query": "/api/gems?limit=10",
            "filtered_query": "/api/gems?color=Blue&category=Quartz&limit=5",
            "odata_query": "/api/gems?$filter=color eq 'Blue' and category eq 'Quartz'&$orderby=name asc",
            "search_query": "/api/gems/search?q=agata"
        }
    })))
}

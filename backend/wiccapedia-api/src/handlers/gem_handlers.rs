use actix_web::{web, HttpResponse, Result};
use actix_multipart::Multipart;
use std::sync::Arc;
use tracing::{info, error, warn};
use futures_util::StreamExt;
use bytes::Bytes;

use crate::models::{GemFilters, PaginationParams, CreateGemRequest, UpdateGemImageRequest, Gem};
use crate::traits::GemService;
use crate::cache::RedisCache;
use crate::storage::S3Client;

/// Handler for getting paginated gems with filters
pub async fn get_gems(
    gem_service: web::Data<Arc<dyn GemService>>,
    redis: web::Data<Option<Arc<RedisCache>>>,
    query: web::Query<GemFilters>,
    pagination: web::Query<PaginationParams>,
) -> Result<HttpResponse> {
    info!("GET /api/gems - Filters: {:?}, Pagination: {:?}", query, pagination);

    let filters = query.into_inner();
    let page = pagination.into_inner();

    if let Some(cache) = redis.as_ref().as_ref() {
        let version = cache.get_version("gems").await.unwrap_or(1);
        let key = format!(
            "v{}:gems:list:limit={}:cursor={}:name={}:color={}:category={}:formula={}:orderby={}",
            version,
            page.limit,
            page.cursor.clone().unwrap_or_default(),
            filters.name.clone().unwrap_or_default(),
            filters.color.clone().unwrap_or_default(),
            filters.category.clone().unwrap_or_default(),
            filters.chemical_formula.clone().unwrap_or_default(),
            filters.order_by.clone().unwrap_or_default(),
        );
        if let Ok(Some(resp)) = cache.get_json::<crate::models::PaginatedResponse<Gem>>(&key).await {
            return Ok(HttpResponse::Ok().json(resp));
        }
        match gem_service.get_gems(filters.clone(), page.clone()).await {
            Ok(response) => {
                let _ = cache.set_json(&key, &response, Some(60)).await;
                return Ok(HttpResponse::Ok().json(response));
            }
            Err(e) => {
                error!("Failed to get gems: {}", e);
                return Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                    "error": "Failed to retrieve gems",
                    "message": e.to_string()
                })));
            }
        }
    }

    match gem_service.get_gems(filters, page).await {
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
    redis: web::Data<Option<Arc<RedisCache>>>,
    path: web::Path<String>,
) -> Result<HttpResponse> {
    let gem_id = path.into_inner();
    info!("GET /api/gems/{}", gem_id);

    if let Some(cache) = redis.as_ref().as_ref() {
        let version = cache.get_version("gems").await.unwrap_or(1);
        let key = format!("v{}:gems:id:{}", version, gem_id);
        if let Ok(Some(gem)) = cache.get_json::<Gem>(&key).await {
            return Ok(HttpResponse::Ok().json(gem));
        }
        match gem_service.get_gem_by_id(&gem_id).await {
            Ok(Some(gem)) => {
                let _ = cache.set_json(&key, &gem, Some(300)).await;
                return Ok(HttpResponse::Ok().json(gem));
            }
            Ok(None) => {
                return Ok(HttpResponse::NotFound().json(serde_json::json!({
                    "error": "Gem not found",
                    "id": gem_id
                })));
            }
            Err(e) => {
                error!("Failed to get gem by ID {}: {}", gem_id, e);
                return Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                    "error": "Failed to retrieve gem",
                    "message": e.to_string(),
                    "id": gem_id
                })));
            }
        }
    }

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
            error!("Failed to get gem by ID {}: {}", gem_id, e);
            Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to retrieve gem",
                "message": e.to_string(),
                "id": gem_id
            })))
        }
    }
}

/// Handler for creating a new gem (JSON only, no file upload)
pub async fn create_gem(
    gem_service: web::Data<Arc<dyn GemService>>,
    redis: web::Data<Option<Arc<RedisCache>>>,
    gem_data: web::Json<CreateGemRequest>,
) -> Result<HttpResponse> {
    info!("POST /api/gems - Creating gem: {}", gem_data.name);

    // Convert CreateGemRequest to Gem
    let gem = Gem::from(gem_data.into_inner());

    match gem_service.add_gem(gem).await {
        Ok(created_gem) => {
            info!("Successfully created gem: {}", created_gem.name);
            if let Some(cache) = redis.as_ref().as_ref() { let _ = cache.incr_version("gems").await; }
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

/// Handler for creating a new gem with image upload (multipart/form-data)
pub async fn create_gem_with_image(
    gem_service: web::Data<Arc<dyn GemService>>,
    s3_client: web::Data<Arc<S3Client>>,
    redis: web::Data<Option<Arc<RedisCache>>>,
    mut payload: Multipart,
) -> Result<HttpResponse> {
    info!("POST /api/gems/upload - Creating gem with image upload");

    let mut gem_data: Option<CreateGemRequest> = None;
    let mut image_data: Option<(Bytes, String)> = None;

    // Process multipart fields
    while let Some(field) = payload.next().await {
        let mut field = field?;
        let field_name = field.name().unwrap_or("unknown").to_string();

        match field_name.as_str() {
            "image" => {
                // Handle image upload
                let content_disposition = field.content_disposition();
                let content_type = field.content_type()
                    .map(|ct| ct.to_string())
                    .unwrap_or_else(|| "image/jpeg".to_string());

                // Validate content type
                if !content_type.starts_with("image/") {
                    warn!("Invalid content type for image: {}", content_type);
                    return Ok(HttpResponse::BadRequest().json(serde_json::json!({
                        "error": "Invalid file type. Only images are allowed.",
                        "content_type": content_type
                    })));
                }

                // Read file data
                let mut file_data = Vec::new();
                while let Some(chunk) = field.next().await {
                    let chunk = chunk?;
                    if file_data.len() + chunk.len() > 10 * 1024 * 1024 { // 10MB limit
                        return Ok(HttpResponse::BadRequest().json(serde_json::json!({
                            "error": "File too large. Maximum size is 10MB."
                        })));
                    }
                    file_data.extend_from_slice(&chunk);
                }

                if file_data.is_empty() {
                    warn!("Empty image file received");
                    return Ok(HttpResponse::BadRequest().json(serde_json::json!({
                        "error": "Empty image file"
                    })));
                }

                image_data = Some((Bytes::from(file_data), content_type));
                info!("Image data received: {} bytes", image_data.as_ref().unwrap().0.len());
            }
            "gem_data" => {
                // Handle JSON gem data
                let mut json_data = Vec::new();
                while let Some(chunk) = field.next().await {
                    let chunk = chunk?;
                    json_data.extend_from_slice(&chunk);
                }

                let json_str = String::from_utf8(json_data).map_err(|e| {
                    actix_web::error::ErrorBadRequest(format!("Invalid UTF-8 in gem data: {}", e))
                })?;
                match serde_json::from_str::<CreateGemRequest>(&json_str) {
                    Ok(data) => {
                        gem_data = Some(data);
                        info!("Gem data received: {}", gem_data.as_ref().unwrap().name);
                    }
                    Err(e) => {
                        error!("Failed to parse gem data: {}", e);
                        return Ok(HttpResponse::BadRequest().json(serde_json::json!({
                            "error": "Invalid gem data format",
                            "message": e.to_string()
                        })));
                    }
                }
            }
            _ => {
                warn!("Unknown field in multipart: {}", field_name);
            }
        }
    }

    // Validate required data
    let gem_request = match gem_data {
        Some(data) => data,
        None => {
            return Ok(HttpResponse::BadRequest().json(serde_json::json!({
                "error": "Missing gem data in multipart request"
            })));
        }
    };

    // Upload image if provided
    let image_url = if let Some((file_data, content_type)) = image_data {
        info!("Uploading image to S3...");
        match s3_client.upload_image(file_data, &content_type).await {
            Ok(url) => {
                info!("Image uploaded successfully: {}", url);
                url
            }
            Err(e) => {
                error!("Failed to upload image: {}", e);
                return Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                    "error": "Failed to upload image",
                    "message": e.to_string()
                })));
            }
        }
    } else {
        // Generate default image filename if no image provided
        let temp_gem = Gem::from(gem_request.clone());
        let default_filename = temp_gem.create_image_filename();
        s3_client.get_image_url(&default_filename)
    };

    // Create gem with image URL
    let mut gem = Gem::from(gem_request);
    gem.image = image_url;

    match gem_service.add_gem(gem).await {
        Ok(created_gem) => {
            info!("Successfully created gem with image: {}", created_gem.name);
            if let Some(cache) = redis.as_ref().as_ref() { let _ = cache.incr_version("gems").await; }
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
    redis: web::Data<Option<Arc<RedisCache>>>,
    path: web::Path<String>,
    gem_data: web::Json<CreateGemRequest>,
) -> Result<HttpResponse> {
    let gem_id = path.into_inner();
    info!("PUT /api/gems/{} - Updating gem", gem_id);

    // Fetch existing to preserve fields like image when not changing it
    let existing = match gem_service.get_gem_by_id(&gem_id).await {
        Ok(Some(g)) => g,
        Ok(None) => {
            info!("Gem not found for update: {}", gem_id);
            return Ok(HttpResponse::NotFound().json(serde_json::json!({
                "error": "Gem not found",
                "id": gem_id
            })));
        }
        Err(e) => {
            error!("Failed to fetch gem {} for update: {}", gem_id, e);
            return Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to fetch gem",
                "message": e.to_string(),
                "id": gem_id
            })));
        }
    };

    let body = gem_data.into_inner();
    let merged = Gem {
        id: existing.id,
        // keep existing image unless an upload path is used
        image: existing.image,
        name: body.name,
        magical_description: body.magical_description,
        category: body.category,
        color: body.color,
        chemical_formula: body.chemical_formula,
    };

    match gem_service.update_gem(&gem_id, merged).await {
        Ok(Some(gem)) => {
            info!("Successfully updated gem: {}", gem.name);
            if let Some(cache) = redis.as_ref().as_ref() { let _ = cache.incr_version("gems").await; }
            Ok(HttpResponse::Ok().json(gem))
        }
        Ok(None) => {
            info!("Gem not found for update after merge: {}", gem_id);
            Ok(HttpResponse::NotFound().json(serde_json::json!({
                "error": "Gem not found",
                "id": gem_id
            })))
        }
        Err(e) => {
            error!("Failed to update gem {}: {}", gem_id, e);
            Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to update gem",
                "message": e.to_string(),
                "id": gem_id
            })))
        }
    }
}

/// Handler for updating an existing gem with image upload
pub async fn update_gem_with_image(
    gem_service: web::Data<Arc<dyn GemService>>,
    s3_client: web::Data<Arc<S3Client>>,
    redis: web::Data<Option<Arc<RedisCache>>>,
    path: web::Path<String>,
    mut payload: Multipart,
) -> Result<HttpResponse> {
    let gem_id = path.into_inner();
    info!("PUT /api/gems/{}/upload - Updating gem with image", gem_id);

    // First, check if gem exists
    let existing_gem = match gem_service.get_gem_by_id(&gem_id).await {
        Ok(Some(gem)) => gem,
        Ok(None) => {
            return Ok(HttpResponse::NotFound().json(serde_json::json!({
                "error": "Gem not found",
                "id": gem_id
            })));
        }
        Err(e) => {
            error!("Failed to fetch existing gem {}: {}", gem_id, e);
            return Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to fetch gem",
                "message": e.to_string(),
                "id": gem_id
            })));
        }
    };

    let mut gem_data: Option<CreateGemRequest> = None;
    let mut image_data: Option<(Bytes, String)> = None;

    // Process multipart fields (similar to create_gem_with_image)
    while let Some(field) = payload.next().await {
        let mut field = field?;
        let field_name = field.name().unwrap_or("unknown").to_string();

        match field_name.as_str() {
            "image" => {
                let content_type = field.content_type()
                    .map(|ct| ct.to_string())
                    .unwrap_or_else(|| "image/jpeg".to_string());

                if !content_type.starts_with("image/") {
                    return Ok(HttpResponse::BadRequest().json(serde_json::json!({
                        "error": "Invalid file type. Only images are allowed.",
                        "content_type": content_type
                    })));
                }

                let mut file_data = Vec::new();
                while let Some(chunk) = field.next().await {
                    let chunk = chunk?;
                    if file_data.len() + chunk.len() > 10 * 1024 * 1024 {
                        return Ok(HttpResponse::BadRequest().json(serde_json::json!({
                            "error": "File too large. Maximum size is 10MB."
                        })));
                    }
                    file_data.extend_from_slice(&chunk);
                }

                if !file_data.is_empty() {
                    image_data = Some((Bytes::from(file_data), content_type));
                }
            }
            "gem_data" => {
                let mut json_data = Vec::new();
                while let Some(chunk) = field.next().await {
                    let chunk = chunk?;
                    json_data.extend_from_slice(&chunk);
                }

                let json_str = String::from_utf8(json_data).map_err(|e| {
                    actix_web::error::ErrorBadRequest(format!("Invalid UTF-8 in gem data: {}", e))
                })?;
                match serde_json::from_str::<CreateGemRequest>(&json_str) {
                    Ok(data) => gem_data = Some(data),
                    Err(e) => {
                        return Ok(HttpResponse::BadRequest().json(serde_json::json!({
                            "error": "Invalid gem data format",
                            "message": e.to_string()
                        })));
                    }
                }
            }
            _ => {}
        }
    }

    // Use existing gem data as base, update with provided data
    let mut updated_gem = existing_gem;
    if let Some(new_data) = gem_data {
        updated_gem.name = new_data.name;
        updated_gem.magical_description = new_data.magical_description;
        updated_gem.category = new_data.category;
        updated_gem.color = new_data.color;
        updated_gem.chemical_formula = new_data.chemical_formula;
    }

    // Upload new image if provided
    if let Some((file_data, content_type)) = image_data {
        // Delete old image if it exists and is not a default
        if !updated_gem.image.is_empty() && s3_client.image_exists(&updated_gem.image).await {
            if let Err(e) = s3_client.delete_image(&updated_gem.image).await {
                warn!("Failed to delete old image: {}", e);
            }
        }

        // Upload new image
        match s3_client.upload_image(file_data, &content_type).await {
            Ok(url) => updated_gem.image = url,
            Err(e) => {
                return Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                    "error": "Failed to upload new image",
                    "message": e.to_string()
                })));
            }
        }
    }

    // Update gem in database
    match gem_service.update_gem(&gem_id, updated_gem).await {
        Ok(Some(gem)) => {
            info!("Successfully updated gem with image: {}", gem.name);
            if let Some(cache) = redis.as_ref().as_ref() { let _ = cache.incr_version("gems").await; }
            Ok(HttpResponse::Ok().json(gem))
        }
        Ok(None) => {
            Ok(HttpResponse::NotFound().json(serde_json::json!({
                "error": "Gem not found",
                "id": gem_id
            })))
        }
        Err(e) => {
            error!("Failed to update gem: {}", e);
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
    s3_client: web::Data<Arc<S3Client>>,
    redis: web::Data<Option<Arc<RedisCache>>>,
    path: web::Path<String>,
) -> Result<HttpResponse> {
    let gem_id = path.into_inner();
    info!("DELETE /api/gems/{}", gem_id);

    // Get gem first to delete associated image
    if let Ok(Some(gem)) = gem_service.get_gem_by_id(&gem_id).await {
        // Delete image from S3 if it exists
        if !gem.image.is_empty() && s3_client.image_exists(&gem.image).await {
            if let Err(e) = s3_client.delete_image(&gem.image).await {
                warn!("Failed to delete gem image: {}", e);
            }
        }
    }

    match gem_service.delete_gem(&gem_id).await {
        Ok(true) => {
            info!("Successfully deleted gem: {}", gem_id);
            if let Some(cache) = redis.as_ref().as_ref() { let _ = cache.incr_version("gems").await; }
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
                "message": e.to_string(),
                "id": gem_id
            })))
        }
    }
}

/// Handler for getting unique colors
pub async fn get_colors(
    gem_service: web::Data<Arc<dyn GemService>>,
    redis: web::Data<Option<Arc<RedisCache>>>,
) -> Result<HttpResponse> {
    info!("GET /api/gems/metadata/colors");

    if let Some(cache) = redis.as_ref().as_ref() {
        let version = cache.get_version("gems").await.unwrap_or(1);
        let key = format!("v{}:metadata:colors", version);
        if let Ok(Some(colors)) = cache.get_json::<Vec<String>>(&key).await {
            return Ok(HttpResponse::Ok().json(serde_json::json!({ "colors": colors })));
        }
        match gem_service.get_unique_colors().await {
            Ok(colors) => {
                let _ = cache.set_json(&key, &colors, Some(600)).await;
                return Ok(HttpResponse::Ok().json(serde_json::json!({ "colors": colors })));
            }
            Err(e) => {
                error!("Failed to get colors: {}", e);
                return Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                    "error": "Failed to retrieve colors",
                    "message": e.to_string()
                })));
            }
        }
    }

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
    redis: web::Data<Option<Arc<RedisCache>>>,
) -> Result<HttpResponse> {
    info!("GET /api/gems/metadata/categories");

    if let Some(cache) = redis.as_ref().as_ref() {
        let version = cache.get_version("gems").await.unwrap_or(1);
        let key = format!("v{}:metadata:categories", version);
        if let Ok(Some(categories)) = cache.get_json::<Vec<String>>(&key).await {
            return Ok(HttpResponse::Ok().json(serde_json::json!({ "categories": categories })));
        }
        match gem_service.get_unique_categories().await {
            Ok(categories) => {
                let _ = cache.set_json(&key, &categories, Some(600)).await;
                return Ok(HttpResponse::Ok().json(serde_json::json!({ "categories": categories })));
            }
            Err(e) => {
                error!("Failed to get categories: {}", e);
                return Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                    "error": "Failed to retrieve categories",
                    "message": e.to_string()
                })));
            }
        }
    }

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
    redis: web::Data<Option<Arc<crate::cache::RedisCache>>>,
) -> Result<HttpResponse> {
    info!("GET /api/gems/metadata/formulas");

    if let Some(cache) = redis.as_ref().as_ref() {
        let version = cache.get_version("gems").await.unwrap_or(1);
        let key = format!("v{}:metadata:formulas", version);
        if let Ok(Some(formulas)) = cache.get_json::<Vec<String>>(&key).await {
            return Ok(HttpResponse::Ok().json(serde_json::json!({ "formulas": formulas })));
        }
        match gem_service.get_unique_formulas().await {
            Ok(formulas) => {
                let _ = cache.set_json(&key, &formulas, Some(600)).await;
                return Ok(HttpResponse::Ok().json(serde_json::json!({ "formulas": formulas })));
            }
            Err(e) => {
                error!("Failed to get formulas: {}", e);
                return Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                    "error": "Failed to retrieve formulas",
                    "message": e.to_string()
                })));
            }
        }
    }

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
    redis: web::Data<Option<Arc<RedisCache>>>,
    query: web::Query<serde_json::Value>,
) -> Result<HttpResponse> {
    let search_term = match query.get("q").and_then(|v| v.as_str()) {
        Some(term) if !term.is_empty() => term,
        _ => {
            return Ok(HttpResponse::BadRequest().json(serde_json::json!({
                "error": "Missing or empty search term 'q'"
            })));
        }
    };

    info!("GET /api/gems/search?q={}", search_term);

    if let Some(cache) = redis.as_ref().as_ref() {
        let version = cache.get_version("gems").await.unwrap_or(1);
        let key = format!("v{}:search:q={}", version, search_term);
        if let Ok(Some(resp)) = cache.get_json::<serde_json::Value>(&key).await {
            return Ok(HttpResponse::Ok().json(resp));
        }
        match gem_service.search_gems(search_term).await {
            Ok(gems) => {
                let resp = serde_json::json!({
                    "results": gems,
                    "count": gems.len(),
                    "query": search_term
                });
                let _ = cache.set_json(&key, &resp, Some(45)).await;
                return Ok(HttpResponse::Ok().json(resp));
            }
            Err(e) => {
                error!("Failed to search gems: {}", e);
                return Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                    "error": "Failed to search gems",
                    "message": e.to_string()
                })));
            }
        }
    }

    match gem_service.search_gems(search_term).await {
        Ok(gems) => {
            info!("Search returned {} gems for term: {}", gems.len(), search_term);
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

/// Handler for updating an existing gem by name
pub async fn update_gem_by_name(
    gem_service: web::Data<Arc<dyn GemService>>,
    redis: web::Data<Option<Arc<crate::cache::RedisCache>>>,
    path: web::Path<String>,
    gem_data: web::Json<CreateGemRequest>,
) -> Result<HttpResponse> {
    let name = path.into_inner();
    info!("PUT /api/gems/name/{} - Updating gem by name", name);

    // Fetch existing by name to preserve image
    let existing = match gem_service.get_gems(
        crate::models::GemFilters { name: Some(name.clone()), ..Default::default() },
        crate::models::PaginationParams { limit: 1, cursor: None }
    ).await {
        Ok(resp) => resp.data.into_iter().next(),
        Err(e) => {
            error!("Failed to fetch gem by name {} for update: {}", name, e);
            return Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to fetch gem",
                "message": e.to_string()
            })));
        }
    };

    let Some(existing) = existing else {
        warn!("Gem not found for update by name: {}", name);
        return Ok(HttpResponse::NotFound().json(serde_json::json!({
            "error": "Gem not found",
            "name": name
        })));
    };

    let body = gem_data.into_inner();
    let merged = Gem {
        id: existing.id,
        name: name.clone(),
        image: existing.image, // preserve
        magical_description: body.magical_description,
        category: body.category,
        color: body.color,
        chemical_formula: body.chemical_formula,
    };

    match gem_service.update_gem_by_name(&name, merged).await {
        Ok(Some(updated_gem)) => {
            info!("✅ Gem updated successfully by name: {}", name);
            if let Some(cache) = redis.as_ref().as_ref() { let _ = cache.incr_version("gems").await; }
            {
                        if let Some(cache) = redis.as_ref().as_ref() { let _ = cache.incr_version("gems").await; }
                        Ok(HttpResponse::Ok().json(updated_gem))
                    }
        }
        Ok(None) => {
            warn!("Gem not found for update by name after merge: {}", name);
            Ok(HttpResponse::NotFound().json(serde_json::json!({
                "error": "Gem not found",
                "name": name
            })))
        }
        Err(e) => {
            error!("Failed to update gem by name {}: {}", name, e);
            Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to update gem",
                "message": e.to_string()
            })))
        }
    }
}

/// Handler for updating gem image URL by name
pub async fn update_gem_image_by_name(
    gem_service: web::Data<Arc<dyn GemService>>,
    redis: web::Data<Option<Arc<crate::cache::RedisCache>>>,
    path: web::Path<String>,
    image_data: web::Json<UpdateGemImageRequest>,
) -> Result<HttpResponse> {
    let name = path.into_inner();
    let image_url = image_data.image_url.clone();
    info!("PATCH /api/gems/name/{}/image - Updating gem image URL", name);

    // First get the existing gem
    match gem_service.get_gems(
        crate::models::GemFilters {
            name: Some(name.clone()),
            ..Default::default()
        },
        crate::models::PaginationParams { limit: 1, cursor: None }
    ).await {
        Ok(response) => {
            if let Some(mut existing_gem) = response.data.into_iter().next() {
                // Update only the image field
                existing_gem.image = image_url;
                
                // Update the gem
                match gem_service.update_gem_by_name(&name, existing_gem).await {
                    Ok(Some(updated_gem)) => {
                        info!("✅ Gem image updated successfully: {}", name);
                        {
                        if let Some(cache) = redis.as_ref().as_ref() { let _ = cache.incr_version("gems").await; }
                        Ok(HttpResponse::Ok().json(updated_gem))
                    }
                    }
                    Ok(None) => {
                        warn!("Gem not found for image update: {}", name);
                        Ok(HttpResponse::NotFound().json(serde_json::json!({
                            "error": "Gem not found",
                            "name": name
                        })))
                    }
                    Err(e) => {
                        error!("Failed to update gem image {}: {}", name, e);
                        Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                            "error": "Failed to update gem image",
                            "message": e.to_string()
                        })))
                    }
                }
            } else {
                warn!("Gem not found for image update: {}", name);
                Ok(HttpResponse::NotFound().json(serde_json::json!({
                    "error": "Gem not found",
                    "name": name
                })))
            }
        }
        Err(e) => {
            error!("Failed to fetch gem for image update {}: {}", name, e);
            Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to fetch gem",
                "message": e.to_string()
            })))
        }
    }
}

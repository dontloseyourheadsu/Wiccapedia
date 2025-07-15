use actix_web::{web, HttpResponse, Result};
use std::path::Path;
use tokio::fs;
use tracing::{info, error, warn};

/// Serve static gem images
pub async fn serve_gem_image(path: web::Path<String>) -> Result<HttpResponse> {
    let image_name = path.into_inner();
    let image_path = format!("../data/assets/gems/{}", image_name);
    
    info!("Serving image: {}", image_path);

    if !Path::new(&image_path).exists() {
        warn!("Image not found: {}", image_path);
        return Ok(HttpResponse::NotFound().json(serde_json::json!({
            "error": "Image not found",
            "path": image_name
        })));
    }

    match fs::read(&image_path).await {
        Ok(contents) => {
            let content_type = match Path::new(&image_name)
                .extension()
                .and_then(|ext| ext.to_str())
            {
                Some("jpg") | Some("jpeg") => "image/jpeg",
                Some("png") => "image/png",
                Some("gif") => "image/gif",
                Some("webp") => "image/webp",
                _ => "application/octet-stream",
            };

            Ok(HttpResponse::Ok()
                .content_type(content_type)
                .body(contents))
        }
        Err(e) => {
            error!("Failed to read image file {}: {}", image_path, e);
            Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to read image",
                "message": e.to_string()
            })))
        }
    }
}

use actix_web::{middleware::Logger, web, App, HttpServer};
use std::sync::Arc;
use tracing::info;

mod models;
mod traits;
mod services;
mod handlers;
mod utils;

use services::{GemServiceImpl, JsonDataLoader};
use handlers::{
    get_gems, get_gem_by_id, create_gem, update_gem, delete_gem,
    get_colors, get_categories, get_formulas, search_gems,
    health_check, api_info, serve_gem_image
};
use traits::GemService;
use utils::{configure_cors, init_logging};

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Initialize logging
    if let Err(e) = init_logging() {
        eprintln!("Failed to initialize logging: {}", e);
        std::process::exit(1);
    }

    info!("Starting Wiccapedia API server...");

    // Initialize services using dependency injection with traits
    let data_loader = Arc::new(JsonDataLoader::new("../data/gems-description.json"));
    let gem_service: Arc<dyn GemService> = Arc::new(GemServiceImpl::new(data_loader));
    
    info!("Services initialized successfully");

    // Configure and start the HTTP server
    let server = HttpServer::new(move || {
        App::new()
            // Add CORS middleware
            .wrap(configure_cors())
            // Add request logging
            .wrap(Logger::default())
            // Inject services
            .app_data(web::Data::new(gem_service.clone()))
            // Health and info endpoints
            .route("/", web::get().to(api_info))
            .route("/health", web::get().to(health_check))
            // Static file serving
            .route("/images/{filename}", web::get().to(serve_gem_image))
            // Gem endpoints
            .service(
                web::scope("/api/gems")
                    .route("", web::get().to(get_gems))
                    .route("", web::post().to(create_gem))
                    .route("/{id}", web::get().to(get_gem_by_id))
                    .route("/{id}", web::put().to(update_gem))
                    .route("/{id}", web::delete().to(delete_gem))
                    .route("/search", web::get().to(search_gems))
                    .service(
                        web::scope("/metadata")
                            .route("/colors", web::get().to(get_colors))
                            .route("/categories", web::get().to(get_categories))
                            .route("/formulas", web::get().to(get_formulas))
                    )
            )
    })
    .bind("127.0.0.1:8080")?;

    info!("🚀 Wiccapedia API server started at http://127.0.0.1:8080");
    info!("📖 API documentation available at http://127.0.0.1:8080");
    info!("❤️  Health check available at http://127.0.0.1:8080/health");
    info!("🖼️  Gem images available at http://127.0.0.1:8080/images/{{filename}}");
    
    server.run().await
}

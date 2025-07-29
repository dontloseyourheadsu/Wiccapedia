use actix_web::{middleware::Logger, web, App, HttpServer};
use std::sync::Arc;
use tracing::info;

mod models;
mod traits;
mod services;
mod handlers;
mod utils;
mod config;
mod database;
mod storage;

use config::AppConfig;
use database::Database;
use storage::S3Client;
use services::PostgresGemService;
use handlers::{
    get_gems, get_gem_by_id, create_gem, create_gem_with_image, 
    update_gem, update_gem_with_image, delete_gem,
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
    }

    info!("🌟 Starting Wiccapedia API server...");

    // Load configuration
    let config = AppConfig::from_env().map_err(|e| {
        eprintln!("Failed to load configuration: {}", e);
        std::io::Error::new(std::io::ErrorKind::InvalidData, e)
    })?;

    info!("📋 Configuration loaded successfully");

    // Initialize database connection
    let database = Database::new(&config.database).await.map_err(|e| {
        eprintln!("Failed to connect to database: {}", e);
        std::io::Error::new(std::io::ErrorKind::ConnectionRefused, e)
    })?;

    // Initialize S3/MinIO client
    let s3_client = Arc::new(S3Client::new(&config.minio).await.map_err(|e| {
        eprintln!("Failed to initialize S3 client: {}", e);
        std::io::Error::new(std::io::ErrorKind::ConnectionRefused, e)
    })?);

    // Initialize services using dependency injection with traits
    let gem_service: Arc<dyn GemService> = Arc::new(PostgresGemService::new(database.pool().clone()));
    
    info!("✅ Services initialized successfully");

    // Get server configuration
    let host = config.server.host.clone();
    let port = config.server.port;
    let bind_address = format!("{}:{}", host, port);

    // Configure and start the HTTP server
    let server = HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(gem_service.clone()))
            .app_data(web::Data::new(s3_client.clone()))
            .wrap(Logger::default())
            .wrap(configure_cors())
            .service(
                web::scope("/api/gems")
                    .route("", web::get().to(get_gems))
                    .route("", web::post().to(create_gem))
                    .route("/upload", web::post().to(create_gem_with_image))
                    .route("/{id}", web::get().to(get_gem_by_id))
                    .route("/{id}", web::put().to(update_gem))
                    .route("/{id}/upload", web::put().to(update_gem_with_image))
                    .route("/{id}", web::delete().to(delete_gem))
                    .route("/metadata/colors", web::get().to(get_colors))
                    .route("/metadata/categories", web::get().to(get_categories))
                    .route("/metadata/formulas", web::get().to(get_formulas))
                    .route("/search", web::get().to(search_gems))
            )
            .route("/health", web::get().to(health_check))
            .route("/", web::get().to(api_info))
            .route("/images/{filename}", web::get().to(serve_gem_image))
    })
    .bind(&bind_address)?;

    info!("🚀 Wiccapedia API server started at http://{}", bind_address);
    info!("📖 API documentation available at http://{}", bind_address);
    info!("❤️  Health check available at http://{}/health", bind_address);
    info!("🖼️  Gem images available at http://{}/images/{{filename}}", bind_address);
    info!("📤 Upload endpoint available at http://{}/api/gems/upload", bind_address);
    
    server.run().await
}

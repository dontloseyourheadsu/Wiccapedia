use actix_cors::Cors;
use actix_web::http;

/// Configure CORS settings for the API
pub fn configure_cors() -> Cors {
    Cors::default()
        .allowed_origin("http://localhost:4200") // Angular dev server
        .allowed_origin("http://localhost:3000") // Alternative frontend port
        .allowed_origin("http://127.0.0.1:4200")
        .allowed_origin("http://127.0.0.1:3000")
        .allowed_methods(vec!["GET", "POST", "PUT", "DELETE", "OPTIONS"])
        .allowed_headers(vec![
            http::header::AUTHORIZATION,
            http::header::ACCEPT,
            http::header::CONTENT_TYPE,
        ])
        .expose_headers(vec![
            http::header::CONTENT_TYPE,
            http::header::CONTENT_LENGTH,
        ])
        .max_age(3600)
        .supports_credentials()
}

/// Configure CORS for production
#[allow(dead_code)]
pub fn configure_cors_production(allowed_origins: Vec<&str>) -> Cors {
    let mut cors = Cors::default()
        .allowed_methods(vec!["GET", "POST", "PUT", "DELETE", "OPTIONS"])
        .allowed_headers(vec![
            http::header::AUTHORIZATION,
            http::header::ACCEPT,
            http::header::CONTENT_TYPE,
        ])
        .expose_headers(vec![
            http::header::CONTENT_TYPE,
            http::header::CONTENT_LENGTH,
        ])
        .max_age(3600);

    for origin in allowed_origins {
        cors = cors.allowed_origin(origin);
    }

    cors
}

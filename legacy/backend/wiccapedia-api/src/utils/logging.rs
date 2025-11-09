use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use anyhow::Result;

/// Initialize logging configuration
pub fn init_logging() -> Result<()> {
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "wiccapedia_api=debug,actix_web=info".into())
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    Ok(())
}

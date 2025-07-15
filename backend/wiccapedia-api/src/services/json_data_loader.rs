use async_trait::async_trait;
use anyhow::Result;
use std::path::Path;
use tokio::fs;
use tracing::{info, error, warn};

use crate::models::Gem;
use crate::traits::DataLoader;

/// JSON file-based data loader implementation
pub struct JsonDataLoader {
    file_path: String,
}

impl JsonDataLoader {
    pub fn new(file_path: &str) -> Self {
        Self {
            file_path: file_path.to_string(),
        }
    }

    /// Validate gem data and fix missing fields
    fn validate_and_fix_gem(&self, mut gem: Gem) -> Gem {
        // Ensure all required fields are present
        if gem.name.is_empty() {
            warn!("Gem with empty name found, skipping");
        }

        // If image path is missing, generate it from name
        if gem.image.is_empty() || gem.image == "images/.jpg" {
            gem.image = format!("images/{}.jpg", gem.create_image_filename());
        }

        // Ensure magical_description is not empty
        if gem.magical_description.is_empty() {
            gem.magical_description = "Una gema con propiedades místicas especiales.".to_string();
        }

        // Ensure category is not empty
        if gem.category.is_empty() {
            gem.category = "Mineral".to_string();
        }

        // Ensure color is not empty
        if gem.color.is_empty() {
            gem.color = "Desconocido".to_string();
        }

        // Ensure chemical formula is not empty
        if gem.chemical_formula.is_empty() {
            gem.chemical_formula = "N/A".to_string();
        }

        gem
    }
}

#[async_trait]
impl DataLoader for JsonDataLoader {
    async fn load_gems(&self) -> Result<Vec<Gem>> {
        info!("Loading gems from JSON file: {}", self.file_path);

        if !Path::new(&self.file_path).exists() {
            error!("JSON file not found: {}", self.file_path);
            return Ok(Vec::new());
        }

        let content = fs::read_to_string(&self.file_path).await?;
        
        // Parse JSON with error handling for malformed entries
        let raw_gems: Result<Vec<serde_json::Value>, _> = serde_json::from_str(&content);
        
        match raw_gems {
            Ok(gem_values) => {
                let mut gems = Vec::new();
                
                for (index, value) in gem_values.into_iter().enumerate() {
                    match serde_json::from_value::<Gem>(value.clone()) {
                        Ok(gem) => {
                            // Validate and fix the gem data
                            let fixed_gem = self.validate_and_fix_gem(gem);
                            
                            // Only add gems with valid names
                            if !fixed_gem.name.is_empty() {
                                gems.push(fixed_gem);
                            } else {
                                warn!("Skipping gem at index {} due to empty name", index);
                            }
                        }
                        Err(e) => {
                            warn!("Failed to parse gem at index {}: {}. Raw value: {:?}", index, e, value);
                            
                            // Try to extract partial data
                            if let Some(name) = value.get("name").and_then(|v| v.as_str()) {
                                if !name.is_empty() {
                                    let partial_gem = Gem::new(
                                        name.to_string(),
                                        value.get("image")
                                            .and_then(|v| v.as_str())
                                            .unwrap_or("")
                                            .to_string(),
                                        value.get("magical_description")
                                            .and_then(|v| v.as_str())
                                            .unwrap_or("Una gema con propiedades místicas especiales.")
                                            .to_string(),
                                        value.get("category")
                                            .and_then(|v| v.as_str())
                                            .unwrap_or("Mineral")
                                            .to_string(),
                                        value.get("color")
                                            .and_then(|v| v.as_str())
                                            .unwrap_or("Desconocido")
                                            .to_string(),
                                        value.get("chemical_formula")
                                            .and_then(|v| v.as_str())
                                            .unwrap_or("N/A")
                                            .to_string(),
                                    );
                                    
                                    let fixed_gem = self.validate_and_fix_gem(partial_gem);
                                    gems.push(fixed_gem);
                                    info!("Recovered partial gem data for: {}", name);
                                }
                            }
                        }
                    }
                }
                
                info!("Successfully loaded {} gems from JSON file", gems.len());
                Ok(gems)
            }
            Err(e) => {
                error!("Failed to parse JSON file {}: {}", self.file_path, e);
                Err(anyhow::anyhow!("Failed to parse JSON: {}", e))
            }
        }
    }

    async fn save_gems(&self, gems: &[Gem]) -> Result<()> {
        info!("Saving {} gems to JSON file: {}", gems.len(), self.file_path);

        let json_content = serde_json::to_string_pretty(gems)?;
        
        // Create directory if it doesn't exist
        if let Some(parent_dir) = Path::new(&self.file_path).parent() {
            fs::create_dir_all(parent_dir).await?;
        }

        fs::write(&self.file_path, json_content).await?;
        
        info!("Successfully saved gems to JSON file");
        Ok(())
    }

    async fn is_available(&self) -> bool {
        Path::new(&self.file_path).exists()
    }

    fn source_type(&self) -> &'static str {
        "JSON File"
    }
}


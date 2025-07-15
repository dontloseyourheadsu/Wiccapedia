use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Represents a mystical gem with its properties and magical attributes
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Gem {
    #[serde(default = "Uuid::new_v4")]
    pub id: Uuid,
    pub name: String,
    pub image: String,
    pub magical_description: String,
    pub category: String,
    pub color: String,
    pub chemical_formula: String,
}

impl Gem {
    /// Create a new gem with generated ID
    pub fn new(
        name: String,
        image: String,
        magical_description: String,
        category: String,
        color: String,
        chemical_formula: String,
    ) -> Self {
        Self {
            id: Uuid::new_v4(),
            name,
            image,
            magical_description,
            category,
            color,
            chemical_formula,
        }
    }

    /// Create image filename from gem name (matching frontend logic)
    pub fn create_image_filename(&self) -> String {
        self.name
            .to_lowercase()
            .replace(' ', "-")
            .replace('á', "a")
            .replace('é', "e")
            .replace('í', "i")
            .replace('ó', "o")
            .replace('ú', "u")
            .replace('ñ', "n")
    }

    /// Get the full image path
    pub fn get_image_path(&self) -> String {
        format!("assets/gems/{}.jpg", self.create_image_filename())
    }

    /// Normalize text for searching (matching frontend logic)
    pub fn normalize_text(text: &str) -> String {
        text.to_lowercase()
            .replace('á', "a")
            .replace('é', "e")
            .replace('í', "i")
            .replace('ó', "o")
            .replace('ú', "u")
            .replace('ñ', "n")
    }

    /// Check if gem matches search term
    pub fn matches_search(&self, search_term: &str) -> bool {
        if search_term.is_empty() {
            return true;
        }
        let normalized_search = Self::normalize_text(search_term);
        let normalized_name = Self::normalize_text(&self.name);
        let normalized_description = Self::normalize_text(&self.magical_description);
        let normalized_category = Self::normalize_text(&self.category);
        
        normalized_name.contains(&normalized_search)
            || normalized_description.contains(&normalized_search)
            || normalized_category.contains(&normalized_search)
    }

    /// Check if gem matches color filter
    pub fn matches_color(&self, color_filter: &Option<String>) -> bool {
        match color_filter {
            Some(color) if !color.is_empty() => {
                Self::normalize_text(&self.color) == Self::normalize_text(color)
            }
            _ => true,
        }
    }

    /// Check if gem matches category filter
    pub fn matches_category(&self, category_filter: &Option<String>) -> bool {
        match category_filter {
            Some(category) if !category.is_empty() => {
                Self::normalize_text(&self.category) == Self::normalize_text(category)
            }
            _ => true,
        }
    }

    /// Check if gem matches chemical formula filter
    pub fn matches_formula(&self, formula_filter: &Option<String>) -> bool {
        match formula_filter {
            Some(formula) if !formula.is_empty() => {
                Self::normalize_text(&self.chemical_formula) == Self::normalize_text(formula)
            }
            _ => true,
        }
    }
}

/// DTO for creating a new gem
#[derive(Debug, Deserialize)]
pub struct CreateGemRequest {
    pub name: String,
    pub magical_description: String,
    pub category: String,
    pub color: String,
    pub chemical_formula: String,
}

impl From<CreateGemRequest> for Gem {
    fn from(request: CreateGemRequest) -> Self {
        let image_filename = request.name
            .to_lowercase()
            .replace(' ', "-")
            .replace('á', "a")
            .replace('é', "e")
            .replace('í', "i")
            .replace('ó', "o")
            .replace('ú', "u")
            .replace('ñ', "n");
        
        Self::new(
            request.name,
            format!("images/{}.jpg", image_filename),
            request.magical_description,
            request.category,
            request.color,
            request.chemical_formula,
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_gem_creation() {
        let gem = Gem::new(
            "Test Gem".to_string(),
            "images/test.jpg".to_string(),
            "A mystical test gem".to_string(),
            "Test Category".to_string(),
            "Blue".to_string(),
            "H2O".to_string(),
        );

        assert_eq!(gem.name, "Test Gem");
        assert_eq!(gem.category, "Test Category");
    }

    #[test]
    fn test_normalize_text() {
        assert_eq!(Gem::normalize_text("Ágata Azúl"), "agata azul");
        assert_eq!(Gem::normalize_text("Niño"), "nino");
    }

    #[test]
    fn test_image_filename_creation() {
        let gem = Gem::new(
            "Ágata Azul".to_string(),
            "".to_string(),
            "".to_string(),
            "".to_string(),
            "".to_string(),
            "".to_string(),
        );
        assert_eq!(gem.create_image_filename(), "agata-azul");
    }

    #[test]
    fn test_search_matching() {
        let gem = Gem::new(
            "Ágata Azul".to_string(),
            "".to_string(),
            "Una gema hermosa".to_string(),
            "Calcedonia".to_string(),
            "Azul".to_string(),
            "SiO₂".to_string(),
        );

        assert!(gem.matches_search("agata"));
        assert!(gem.matches_search("azul"));
        assert!(gem.matches_search("hermosa"));
        assert!(gem.matches_search("calcedonia"));
        assert!(!gem.matches_search("verde"));
    }
}

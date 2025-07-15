use serde::Deserialize;

/// OData-style filter parameters for gems
#[derive(Debug, Deserialize, Clone)]
pub struct GemFilters {
    #[serde(rename = "$search")]
    pub search: Option<String>,
    
    #[serde(rename = "$filter")]
    pub filter: Option<String>,
    
    // Individual filter parameters (more user-friendly)
    pub name: Option<String>,
    pub color: Option<String>,
    pub category: Option<String>,
    pub chemical_formula: Option<String>,
    
    #[serde(rename = "$orderby")]
    pub order_by: Option<String>,
}

impl Default for GemFilters {
    fn default() -> Self {
        Self {
            search: None,
            filter: None,
            name: None,
            color: None,
            category: None,
            chemical_formula: None,
            order_by: None,
        }
    }
}

impl GemFilters {
    /// Parse OData filter string into individual filters
    /// Example: "color eq 'Blue' and category eq 'Quartz'"
    pub fn parse_odata_filter(&mut self) {
        if let Some(filter_str) = &self.filter {
            let conditions: Vec<&str> = filter_str.split(" and ").collect();
            
            for condition in conditions {
                if let Some((field, value)) = self.parse_condition(condition) {
                    match field.as_str() {
                        "name" => self.name = Some(value),
                        "color" => self.color = Some(value),
                        "category" => self.category = Some(value),
                        "chemical_formula" => self.chemical_formula = Some(value),
                        _ => {} // Ignore unknown fields
                    }
                }
            }
        }
    }

    /// Parse individual condition like "color eq 'Blue'"
    fn parse_condition(&self, condition: &str) -> Option<(String, String)> {
        let parts: Vec<&str> = condition.trim().split_whitespace().collect();
        if parts.len() >= 3 && parts[1] == "eq" {
            let field = parts[0].to_string();
            let value = parts[2..].join(" ")
                .trim_matches('\'')
                .trim_matches('"')
                .to_string();
            Some((field, value))
        } else {
            None
        }
    }

    /// Get search term from either search parameter or name filter
    pub fn get_search_term(&self) -> Option<&String> {
        self.search.as_ref().or(self.name.as_ref())
    }

    /// Check if filters are empty
    pub fn is_empty(&self) -> bool {
        self.search.is_none()
            && self.filter.is_none()
            && self.name.is_none()
            && self.color.is_none()
            && self.category.is_none()
            && self.chemical_formula.is_none()
            && self.order_by.is_none()
    }
}

/// Sorting options
#[derive(Debug, Clone)]
pub enum SortField {
    Name,
    Color,
    Category,
    ChemicalFormula,
}

#[derive(Debug, Clone)]
pub enum SortDirection {
    Asc,
    Desc,
}

#[derive(Debug, Clone)]
pub struct SortOption {
    pub field: SortField,
    pub direction: SortDirection,
}

impl SortOption {
    /// Parse OData orderby string like "name asc" or "color desc"
    pub fn parse_orderby(orderby: &str) -> Vec<SortOption> {
        orderby
            .split(',')
            .filter_map(|part| {
                let tokens: Vec<&str> = part.trim().split_whitespace().collect();
                if tokens.is_empty() {
                    return None;
                }

                let field = match tokens[0] {
                    "name" => SortField::Name,
                    "color" => SortField::Color,
                    "category" => SortField::Category,
                    "chemical_formula" => SortField::ChemicalFormula,
                    _ => return None,
                };

                let direction = if tokens.len() > 1 && tokens[1] == "desc" {
                    SortDirection::Desc
                } else {
                    SortDirection::Asc
                };

                Some(SortOption { field, direction })
            })
            .collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_odata_filter() {
        let mut filters = GemFilters {
            filter: Some("color eq 'Blue' and category eq 'Quartz'".to_string()),
            ..Default::default()
        };
        
        filters.parse_odata_filter();
        
        assert_eq!(filters.color, Some("Blue".to_string()));
        assert_eq!(filters.category, Some("Quartz".to_string()));
    }

    #[test]
    fn test_parse_orderby() {
        let sort_options = SortOption::parse_orderby("name asc, color desc");
        
        assert_eq!(sort_options.len(), 2);
        match &sort_options[0].field {
            SortField::Name => (),
            _ => panic!("Expected Name field"),
        }
        match &sort_options[0].direction {
            SortDirection::Asc => (),
            _ => panic!("Expected Asc direction"),
        }
    }

    #[test]
    fn test_get_search_term() {
        let filters1 = GemFilters {
            search: Some("test".to_string()),
            name: Some("name".to_string()),
            ..Default::default()
        };
        assert_eq!(filters1.get_search_term(), Some(&"test".to_string()));

        let filters2 = GemFilters {
            search: None,
            name: Some("name".to_string()),
            ..Default::default()
        };
        assert_eq!(filters2.get_search_term(), Some(&"name".to_string()));
    }
}

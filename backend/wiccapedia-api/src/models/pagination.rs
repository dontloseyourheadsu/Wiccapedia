use serde::{Deserialize, Serialize};

/// Cursor-based pagination parameters
#[derive(Debug, Deserialize)]
pub struct PaginationParams {
    #[serde(default = "default_limit")]
    pub limit: usize,
    pub cursor: Option<String>,
}

fn default_limit() -> usize {
    20
}

impl Default for PaginationParams {
    fn default() -> Self {
        Self {
            limit: default_limit(),
            cursor: None,
        }
    }
}

/// Paginated response with cursor information
#[derive(Debug, Serialize)]
pub struct PaginatedResponse<T> {
    pub data: Vec<T>,
    pub pagination: PaginationInfo,
}

#[derive(Debug, Serialize)]
pub struct PaginationInfo {
    pub has_next: bool,
    pub has_previous: bool,
    pub next_cursor: Option<String>,
    pub previous_cursor: Option<String>,
    pub total_count: usize,
    pub page_size: usize,
}

impl<T> PaginatedResponse<T> {
    pub fn new(
        data: Vec<T>,
        has_next: bool,
        has_previous: bool,
        next_cursor: Option<String>,
        previous_cursor: Option<String>,
        total_count: usize,
        page_size: usize,
    ) -> Self {
        Self {
            data,
            pagination: PaginationInfo {
                has_next,
                has_previous,
                next_cursor,
                previous_cursor,
                total_count,
                page_size,
            },
        }
    }
}

/// Cursor for pagination - encodes the position in the dataset
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Cursor {
    pub offset: usize,
    pub direction: CursorDirection,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CursorDirection {
    Forward,
    Backward,
}

impl Cursor {
    pub fn new(offset: usize, direction: CursorDirection) -> Self {
        Self { offset, direction }
    }

    pub fn encode(&self) -> Result<String, serde_json::Error> {
        let json = serde_json::to_string(self)?;
        Ok(base64::encode(json))
    }

    pub fn decode(cursor: &str) -> Result<Self, Box<dyn std::error::Error>> {
        let decoded = base64::decode(cursor)?;
        let cursor: Cursor = serde_json::from_slice(&decoded)?;
        Ok(cursor)
    }
}

// Simple base64 encoding/decoding for cursor
mod base64 {
    use std::fmt;

    #[derive(Debug)]
    pub struct DecodeError;

    impl fmt::Display for DecodeError {
        fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
            write!(f, "Base64 decode error")
        }
    }

    impl std::error::Error for DecodeError {}

    pub fn encode(input: String) -> String {
        // Simple hex encoding (for demo purposes)
        hex::encode(input.as_bytes())
    }

    pub fn decode(input: &str) -> Result<Vec<u8>, DecodeError> {
        hex::decode(input).map_err(|_| DecodeError)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cursor_encoding() {
        let cursor = Cursor::new(10, CursorDirection::Forward);
        let encoded = cursor.encode().unwrap();
        let decoded = Cursor::decode(&encoded).unwrap();
        
        assert_eq!(cursor.offset, decoded.offset);
        match (cursor.direction, decoded.direction) {
            (CursorDirection::Forward, CursorDirection::Forward) => (),
            (CursorDirection::Backward, CursorDirection::Backward) => (),
            _ => panic!("Direction mismatch"),
        }
    }

    #[test]
    fn test_pagination_params_default() {
        let params = PaginationParams::default();
        assert_eq!(params.limit, 20);
        assert!(params.cursor.is_none());
    }
}

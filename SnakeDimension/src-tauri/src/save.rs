use serde::{Deserialize, Serialize};
use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameSave {
    pub version: String,
    pub timestamp: u64,
    pub level_data: LevelSave,
    pub snake_data: SnakeSave,
    pub game_state: GameStateSave,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LevelSave {
    pub width: i32,
    pub height: i32,
    pub depth: i32,
    pub cells: Vec<CellSave>,
    pub tiles: Vec<TileSave>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CellSave {
    pub x: i32,
    pub y: i32,
    pub z: i32,
    pub tile_id: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TileSave {
    pub id: usize,
    pub name: String,
    pub weight: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SnakeSave {
    pub segments: Vec<SegmentSave>,
    pub direction: [f32; 3],
    pub speed: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SegmentSave {
    pub position: [f32; 3],
    pub rotation: [f32; 4],
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameStateSave {
    pub score: u32,
    pub level: u32,
    pub lives: u32,
    pub food_position: [f32; 3],
    pub is_paused: bool,
    pub is_game_over: bool,
}

fn get_save_directory() -> Result<PathBuf, String> {
    if let Some(mut dir) = dirs::document_dir() {
        dir.push("SnakeDimension");
        dir.push("saves");
        
        if !dir.exists() {
            fs::create_dir_all(&dir)
                .map_err(|e| format!("Failed to create save directory: {}", e))?;
        }
        
        Ok(dir)
    } else {
        Err("Could not find documents directory".to_string())
    }
}

#[tauri::command]
pub fn save_game(save_data: GameSave, filename: String) -> Result<(), String> {
    let save_dir = get_save_directory()?;
    let mut save_path = save_dir.join(filename);
    
    if !save_path.extension().is_some() {
        save_path.set_extension("snakesave");
    }
    
    let json_data = serde_json::to_string_pretty(&save_data)
        .map_err(|e| format!("Failed to serialize save data: {}", e))?;
    
    let mut file = File::create(&save_path)
        .map_err(|e| format!("Failed to create save file: {}", e))?;
    
    file.write_all(json_data.as_bytes())
        .map_err(|e| format!("Failed to write save file: {}", e))?;
    
    Ok(())
}

#[tauri::command]
pub fn load_game(filename: String) -> Result<GameSave, String> {
    let save_dir = get_save_directory()?;
    let mut save_path = save_dir.join(filename);
    
    if !save_path.extension().is_some() {
        save_path.set_extension("snakesave");
    }
    
    if !save_path.exists() {
        return Err(format!("Save file not found: {:?}", save_path));
    }
    
    let mut file = File::open(&save_path)
        .map_err(|e| format!("Failed to open save file: {}", e))?;
    
    let mut json_data = String::new();
    file.read_to_string(&mut json_data)
        .map_err(|e| format!("Failed to read save file: {}", e))?;
    
    let save_data: GameSave = serde_json::from_str(&json_data)
        .map_err(|e| format!("Failed to deserialize save data: {}", e))?;
    
    Ok(save_data)
}

#[tauri::command]
pub fn list_saves() -> Result<Vec<String>, String> {
    let save_dir = get_save_directory()?;
    
    if !save_dir.exists() {
        return Ok(Vec::new());
    }
    
    let mut saves = Vec::new();
    
    let entries = fs::read_dir(&save_dir)
        .map_err(|e| format!("Failed to read save directory: {}", e))?;
    
    for entry in entries {
        if let Ok(entry) = entry {
            let path = entry.path();
            
            if path.extension().map_or(false, |ext| ext == "snakesave") {
                if let Some(filename) = path.file_name() {
                    if let Some(filename_str) = filename.to_str() {
                        saves.push(filename_str.to_string());
                    }
                }
            }
        }
    }
    
    Ok(saves)
}

#[tauri::command]
pub fn delete_save(filename: String) -> Result<(), String> {
    let save_dir = get_save_directory()?;
    let mut save_path = save_dir.join(filename);
    
    if !save_path.extension().is_some() {
        save_path.set_extension("snakesave");
    }
    
    if !save_path.exists() {
        return Err(format!("Save file not found: {:?}", save_path));
    }
    
    fs::remove_file(&save_path)
        .map_err(|e| format!("Failed to delete save file: {}", e))?;
    
    Ok(())
}

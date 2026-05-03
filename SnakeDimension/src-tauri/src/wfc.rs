use rand::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Tile {
    pub id: usize,
    pub name: String,
    pub weight: f32,
    pub connections: [Vec<usize>; 6], // 6个方向: +x, -x, +y, -y, +z, -z
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Cell {
    pub x: i32,
    pub y: i32,
    pub z: i32,
    pub possible_tiles: Vec<usize>,
    pub collapsed: bool,
    pub tile_id: Option<usize>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LevelData {
    pub width: i32,
    pub height: i32,
    pub depth: i32,
    pub cells: Vec<Cell>,
    pub tiles: Vec<Tile>,
    pub snake_start: (i32, i32, i32),
    pub food_position: (i32, i32, i32),
}

fn get_default_tiles() -> Vec<Tile> {
    vec![
        Tile {
            id: 0,
            name: "floor".to_string(),
            weight: 1.0,
            connections: [
                vec![0, 1, 2], // +x
                vec![0, 1, 2], // -x
                vec![0, 1, 2], // +y
                vec![0, 1, 2], // -y
                vec![0, 1, 2], // +z
                vec![0, 1, 2], // -z
            ],
        },
        Tile {
            id: 1,
            name: "wall".to_string(),
            weight: 0.3,
            connections: [vec![], vec![], vec![], vec![], vec![], vec![]],
        },
        Tile {
            id: 2,
            name: "corridor".to_string(),
            weight: 0.7,
            connections: [
                vec![0, 2], // +x
                vec![0, 2], // -x
                vec![],     // +y
                vec![],     // -y
                vec![0, 2], // +z
                vec![0, 2], // -z
            ],
        },
        Tile {
            id: 3,
            name: "room_center".to_string(),
            weight: 0.5,
            connections: [
                vec![0, 2, 3], // +x
                vec![0, 2, 3], // -x
                vec![],         // +y
                vec![],         // -y
                vec![0, 2, 3], // +z
                vec![0, 2, 3], // -z
            ],
        },
    ]
}

fn get_opposite_direction(dir: usize) -> usize {
    match dir {
        0 => 1, // +x -> -x
        1 => 0, // -x -> +x
        2 => 3, // +y -> -y
        3 => 2, // -y -> +y
        4 => 5, // +z -> -z
        5 => 4, // -z -> +z
        _ => 0,
    }
}

fn get_direction_offset(dir: usize) -> (i32, i32, i32) {
    match dir {
        0 => (1, 0, 0),  // +x
        1 => (-1, 0, 0), // -x
        2 => (0, 1, 0),  // +y
        3 => (0, -1, 0), // -y
        4 => (0, 0, 1),  // +z
        5 => (0, 0, -1), // -z
        _ => (0, 0, 0),
    }
}

fn get_cell_index(x: i32, y: i32, z: i32, width: i32, height: i32) -> usize {
    (z * width * height + y * width + x) as usize
}

fn get_neighbor(
    x: i32,
    y: i32,
    z: i32,
    dir: usize,
    width: i32,
    height: i32,
    depth: i32,
) -> Option<(i32, i32, i32)> {
    let (dx, dy, dz) = get_direction_offset(dir);
    let nx = x + dx;
    let ny = y + dy;
    let nz = z + dz;

    if nx >= 0 && nx < width && ny >= 0 && ny < height && nz >= 0 && nz < depth {
        Some((nx, ny, nz))
    } else {
        None
    }
}

fn choose_weighted_tile(possible_tiles: &[usize], tiles: &[Tile], rng: &mut ThreadRng) -> usize {
    let total_weight: f32 = possible_tiles
        .iter()
        .map(|&id| tiles[id].weight)
        .sum();
    
    let mut random = rng.gen::<f32>() * total_weight;
    
    for &tile_id in possible_tiles {
        random -= tiles[tile_id].weight;
        if random <= 0.0 {
            return tile_id;
        }
    }
    
    *possible_tiles.last().unwrap()
}

fn propagate(
    cells: &mut Vec<Cell>,
    tiles: &[Tile],
    width: i32,
    height: i32,
    depth: i32,
    start_x: i32,
    start_y: i32,
    start_z: i32,
) {
    let mut stack = vec![(start_x, start_y, start_z)];
    
    while let Some((x, y, z)) = stack.pop() {
        let cell_index = get_cell_index(x, y, z, width, height);
        let cell = &cells[cell_index];
        
        if cell.collapsed {
            let tile_id = cell.tile_id.unwrap();
            let tile = &tiles[tile_id];
            
            for dir in 0..6 {
                if let Some((nx, ny, nz)) = get_neighbor(x, y, z, dir, width, height, depth) {
                    let neighbor_index = get_cell_index(nx, ny, nz, width, height);
                    let neighbor = &mut cells[neighbor_index];
                    
                    if !neighbor.collapsed {
                        let opposite_dir = get_opposite_direction(dir);
                        let allowed_tiles = &tile.connections[dir];
                        
                        let original_len = neighbor.possible_tiles.len();
                        neighbor.possible_tiles.retain(|&id| allowed_tiles.contains(&id) && tiles[id].connections[opposite_dir].contains(&tile_id));
                        
                        if neighbor.possible_tiles.len() != original_len {
                            stack.push((nx, ny, nz));
                        }
                    }
                }
            }
        } else {
            for dir in 0..6 {
                if let Some((nx, ny, nz)) = get_neighbor(x, y, z, dir, width, height, depth) {
                    let neighbor_index = get_cell_index(nx, ny, nz, width, height);
                    let neighbor = &cells[neighbor_index];
                    
                    if neighbor.collapsed {
                        let neighbor_tile_id = neighbor.tile_id.unwrap();
                        let neighbor_tile = &tiles[neighbor_tile_id];
                        let opposite_dir = get_opposite_direction(dir);
                        let allowed_tiles = &neighbor_tile.connections[opposite_dir];
                        
                        let cell = &mut cells[cell_index];
                        let original_len = cell.possible_tiles.len();
                        cell.possible_tiles.retain(|&id| allowed_tiles.contains(&id) && tiles[id].connections[dir].contains(&neighbor_tile_id));
                        
                        if cell.possible_tiles.len() != original_len {
                            stack.push((x, y, z));
                        }
                    }
                }
            }
        }
    }
}

fn find_lowest_entropy_cell(cells: &[Cell]) -> Option<usize> {
    let mut min_entropy = f32::INFINITY;
    let mut selected_index: Option<usize> = None;
    
    for (index, cell) in cells.iter().enumerate() {
        if !cell.collapsed && !cell.possible_tiles.is_empty() {
            let entropy = cell.possible_tiles.len() as f32;
            if entropy < min_entropy {
                min_entropy = entropy;
                selected_index = Some(index);
            }
        }
    }
    
    selected_index
}

#[tauri::command]
pub fn generate_level(width: i32, height: i32, depth: i32) -> LevelData {
    let tiles = get_default_tiles();
    let mut rng = thread_rng();
    
    let mut cells = Vec::with_capacity((width * height * depth) as usize);
    let all_tile_ids: Vec<usize> = (0..tiles.len()).collect();
    
    for z in 0..depth {
        for y in 0..height {
            for x in 0..width {
                cells.push(Cell {
                    x,
                    y,
                    z,
                    possible_tiles: all_tile_ids.clone(),
                    collapsed: false,
                    tile_id: None,
                });
            }
        }
    }
    
    loop {
        match find_lowest_entropy_cell(&cells) {
            Some(cell_index) => {
                let cell = &mut cells[cell_index];
                
                if cell.possible_tiles.is_empty() {
                    break;
                }
                
                let selected_tile_id = choose_weighted_tile(&cell.possible_tiles, &tiles, &mut rng);
                cell.collapsed = true;
                cell.tile_id = Some(selected_tile_id);
                cell.possible_tiles = vec![selected_tile_id];
                
                let x = cell.x;
                let y = cell.y;
                let z = cell.z;
                
                propagate(&mut cells, &tiles, width, height, depth, x, y, z);
            }
            None => break,
        }
    }
    
    let mut floor_cells = Vec::new();
    for (index, cell) in cells.iter().enumerate() {
        if let Some(tile_id) = cell.tile_id {
            if tiles[tile_id].name == "floor" || tiles[tile_id].name == "corridor" {
                floor_cells.push(index);
            }
        }
    }
    
    let snake_start_index = *floor_cells.choose(&mut rng).unwrap();
    let snake_start_x = cells[snake_start_index].x;
    let snake_start_y = cells[snake_start_index].y;
    let snake_start_z = cells[snake_start_index].z;
    
    let food_candidates: Vec<&usize> = floor_cells
        .iter()
        .filter(|&&idx| {
            let cell = &cells[idx];
            (cell.x - snake_start_x).abs() > 3
                || (cell.y - snake_start_y).abs() > 3
                || (cell.z - snake_start_z).abs() > 3
        })
        .collect();
    
    let food_position = if !food_candidates.is_empty() {
        let food_index = *food_candidates.choose(&mut rng).unwrap();
        let food_cell = &cells[*food_index];
        (food_cell.x, food_cell.y, food_cell.z)
    } else {
        (
            snake_start_x + 5,
            snake_start_y,
            snake_start_z,
        )
    };
    
    LevelData {
        width,
        height,
        depth,
        cells,
        tiles,
        snake_start: (snake_start_x, snake_start_y, snake_start_z),
        food_position,
    }
}

#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod wfc;
mod audio;
mod save;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let _app_handle = app.handle();
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            wfc::generate_level,
            audio::play_sound,
            audio::play_music,
            save::save_game,
            save::load_game
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// Copyright (c) 2026 Adrián Romero
// SPDX-License-Identifier: MIT

mod app_error;
mod commands;
mod paths;

use commands::AppState;
use std::path::PathBuf;
use tauri::Manager;

pub fn run_with_path(basepath: PathBuf, filename: String) {
    tauri::Builder::default()
        .manage(AppState::new(basepath, filename))
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            if let (Some(window), Some(icon)) =
                (app.get_webview_window("main"), app.default_window_icon())
            {
                window.set_icon(icon.clone())?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::initial_config,
            commands::path_kind,
            commands::resolve_link,
            commands::list_directory,
            commands::read_file,
            commands::open_file,
            commands::write_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let basepath = std::env::current_dir().expect("failed to get current directory");
    run_with_path(basepath, String::new());
}

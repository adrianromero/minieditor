// Copyright (c) 2026 Adrián Romero
// SPDX-License-Identifier: MIT

mod app_error;
mod commands;
mod paths;
mod properties;

use commands::AppState;
use properties::WindowProperties;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tauri::{LogicalSize, Manager, WindowEvent};
use tracing::{error, info};

#[derive(Debug)]
struct WindowPropertiesState {
    path: Option<PathBuf>,
    dimensions: WindowProperties,
}

impl Default for WindowPropertiesState {
    fn default() -> Self {
        Self {
            path: None,
            dimensions: WindowProperties::default(),
        }
    }
}

pub fn run_with_path(basepath: PathBuf, filename: String) {
    let window_properties = Arc::new(Mutex::new(WindowPropertiesState::default()));
    let setup_window_properties = Arc::clone(&window_properties);
    let event_window_properties = Arc::clone(&window_properties);

    tauri::Builder::default()
        .manage(AppState::new(basepath, filename))
        .plugin(tauri_plugin_opener::init())
        .setup(move |app| {
            let (properties_path, dimensions) = match app.path().home_dir() {
                Ok(home) => {
                    let path = properties::properties_path(&home);
                    let dimensions = match properties::load(&path) {
                        Ok(Some(properties)) => properties,
                        Ok(None) => WindowProperties::default(),
                        Err(message) => {
                            error!("Failed to load window properties: {message}");
                            WindowProperties::default()
                        }
                    };
                    (Some(path), dimensions)
                }
                Err(error) => {
                    error!("Failed to resolve the home directory: {error}");
                    (None, WindowProperties::default())
                }
            };

            match setup_window_properties.lock() {
                Ok(mut state) => {
                    state.path = properties_path;
                    state.dimensions = dimensions;
                }
                Err(error) => error!("Failed to initialize window properties state: {error}"),
            }

            if let Some(window) = app.get_webview_window("main") {
                if let Err(error) = window.set_size(LogicalSize::new(
                    f64::from(dimensions.width),
                    f64::from(dimensions.height),
                )) {
                    error!("Failed to set the initial window size: {error}");
                }

                if let Some(icon) = app.default_window_icon() {
                    window.set_icon(icon.clone())?;
                }
            }
            Ok(())
        })
        .on_window_event(move |window, event| {
            if window.label() != "main" {
                return;
            }

            match event {
                WindowEvent::CloseRequested { .. } => {
                    let Some(webview_window) =
                        window.app_handle().get_webview_window(window.label())
                    else {
                        error!("Failed to find the main webview window before closing");
                        return;
                    };
                    let scale_factor = match webview_window.scale_factor() {
                        Ok(scale_factor) => scale_factor,
                        Err(error) => {
                            error!("Failed to read the window scale factor: {error}");
                            return;
                        }
                    };
                    let size = match webview_window.as_ref().size() {
                        Ok(size) => size,
                        Err(error) => {
                            error!("Failed to read the webview size before closing: {error}");
                            return;
                        }
                    };
                    let logical_size = size.to_logical::<f64>(scale_factor);
                    let dimensions = WindowProperties::new(
                        logical_size.width.round().max(1.0) as u32,
                        logical_size.height.round().max(1.0) as u32,
                    );

                    match event_window_properties.lock() {
                        Ok(mut state) => state.dimensions = dimensions,
                        Err(error) => error!("Failed to update window properties state: {error}"),
                    }
                }
                WindowEvent::Destroyed => {
                    let (path, dimensions) = match event_window_properties.lock() {
                        Ok(state) => (state.path.clone(), state.dimensions),
                        Err(error) => {
                            error!("Failed to read window properties state: {error}");
                            return;
                        }
                    };

                    let Some(path) = path else {
                        return;
                    };
                    match properties::save(&path, dimensions) {
                        Ok(()) => info!(
                            "Saved window dimensions {}x{} to {}",
                            dimensions.width,
                            dimensions.height,
                            path.display()
                        ),
                        Err(message) => error!("Failed to save window properties: {message}"),
                    }
                }
                _ => {}
            }
        })
        .invoke_handler(tauri::generate_handler![
            commands::initial_config,
            commands::path_kind,
            commands::resolve_link,
            commands::list_directory,
            commands::read_file,
            commands::read_binary_file,
            commands::read_linked_binary_file,
            commands::write_binary_file,
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

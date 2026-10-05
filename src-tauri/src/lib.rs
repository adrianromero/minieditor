// Copyright (c) 2026 Adrián Romero
// SPDX-License-Identifier: MIT

mod app_error;
mod commands;
mod paths;
mod properties;

use commands::AppState;
use properties::Properties;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tauri::{LogicalSize, Manager, WindowEvent};
use tracing::{error, info};

#[derive(Debug, Default)]
struct PropertiesState {
    path: Option<PathBuf>,
    properties: Properties,
}

pub fn run_with_path(basepath: PathBuf, filename: String) {
    let application_properties = Arc::new(Mutex::new(PropertiesState::default()));
    let setup_properties = Arc::clone(&application_properties);
    let event_properties = Arc::clone(&application_properties);

    tauri::Builder::default()
        .manage(AppState::new(basepath, filename))
        .plugin(tauri_plugin_opener::init())
        .setup(move |app| {
            let (properties_path, application_properties) = match app.path().home_dir() {
                Ok(home) => {
                    let path = properties::properties_path(&home);
                    let application_properties = match properties::load(&path) {
                        Ok(Some(properties)) => properties,
                        Ok(None) => Properties::default(),
                        Err(message) => {
                            error!("Failed to load application properties: {message}");
                            Properties::default()
                        }
                    };
                    (Some(path), application_properties)
                }
                Err(error) => {
                    error!("Failed to resolve the home directory: {error}");
                    (None, Properties::default())
                }
            };

            let app_state = app.state::<AppState>();
            match app_state.filename() {
                Ok(filename) if filename.is_empty() => {
                    if let Some(saved_filename) =
                        application_properties.filename_for(app_state.basepath())
                    {
                        if paths::validate_relative_filename(saved_filename).is_ok() {
                            if let Err(message) = app_state.set_filename(saved_filename.to_owned()) {
                                error!("Failed to restore the saved filename: {message}");
                            }
                        } else {
                            error!(
                                filename = saved_filename,
                                "Ignored an invalid saved filename"
                            );
                        }
                    }
                }
                Ok(_) => {}
                Err(message) => error!("Failed to read the initial filename: {message}"),
            }

            let width = application_properties.width;
            let height = application_properties.height;
            match setup_properties.lock() {
                Ok(mut state) => {
                    state.path = properties_path;
                    state.properties = application_properties;
                }
                Err(error) => error!("Failed to initialize application properties state: {error}"),
            }

            if let Some(window) = app.get_webview_window("main") {
                if let Err(error) = window.set_size(LogicalSize::new(
                    f64::from(width),
                    f64::from(height),
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
                    let dimensions = window
                        .app_handle()
                        .get_webview_window(window.label())
                        .and_then(|webview_window| {
                            let scale_factor = match webview_window.scale_factor() {
                                Ok(scale_factor) => scale_factor,
                                Err(error) => {
                                    error!("Failed to read the window scale factor: {error}");
                                    return None;
                                }
                            };
                            let size = match webview_window.as_ref().size() {
                                Ok(size) => size,
                                Err(error) => {
                                    error!("Failed to read the webview size before closing: {error}");
                                    return None;
                                }
                            };
                            let logical_size = size.to_logical::<f64>(scale_factor);
                            Some((
                                logical_size.width.round().max(1.0) as u32,
                                logical_size.height.round().max(1.0) as u32,
                            ))
                        });

                    if dimensions.is_none() {
                        error!("Failed to read the main window dimensions before closing");
                    }

                    let app_state = window.app_handle().state::<AppState>();
                    let filename = match app_state.filename() {
                        Ok(filename) => Some(filename),
                        Err(message) => {
                            error!("Failed to read the current filename before closing: {message}");
                            None
                        }
                    };

                    match event_properties.lock() {
                        Ok(mut state) => {
                            if let Some((width, height)) = dimensions {
                                state.properties.width = width;
                                state.properties.height = height;
                            }
                            if let Some(filename) = filename {
                                state.properties.set_filename(app_state.basepath(), filename);
                            }
                        }
                        Err(error) => {
                            error!("Failed to update application properties state: {error}")
                        }
                    }
                }
                WindowEvent::Destroyed => {
                    let (path, application_properties) = match event_properties.lock() {
                        Ok(state) => (state.path.clone(), state.properties.clone()),
                        Err(error) => {
                            error!("Failed to read application properties state: {error}");
                            return;
                        }
                    };

                    let Some(path) = path else {
                        return;
                    };
                    match properties::save(&path, &application_properties) {
                        Ok(()) => info!(
                            "Saved application properties, including window dimensions {}x{}, to {}",
                            application_properties.width,
                            application_properties.height,
                            path.display()
                        ),
                        Err(message) => error!("Failed to save application properties: {message}"),
                    }
                }
                _ => {}
            }
        })
        .invoke_handler(tauri::generate_handler![
            commands::initial_config,
            commands::set_current_filename,
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

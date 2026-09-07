// Copyright (c) 2026 Adrián Romero
// SPDX-License-Identifier: MIT

use std::path::{Component, Path, PathBuf};
use tauri::Manager;
use tokio;
use tracing::info;

struct AppState {
    basepath: PathBuf,
    filename: String,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct InitialConfig {
    basepath: String,
    filename: String,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "lowercase")]
enum PathKind {
    File,
    Directory,
    Other,
}

impl PathKind {
    fn sort_order(&self) -> u8 {
        match self {
            Self::Directory => 0,
            Self::File => 1,
            Self::Other => 2,
        }
    }
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct DirectoryEntry {
    name: String,
    filename: String,
    kind: PathKind,
}

fn validate_relative_filename(filename: &str) -> Result<&Path, String> {
    let path = Path::new(filename);
    if path.is_absolute()
        || path.components().any(|component| {
            matches!(
                component,
                Component::ParentDir | Component::RootDir | Component::Prefix(_)
            )
        })
    {
        return Err(format!(
            "Filename must be a path relative to the base path: '{}'",
            filename
        ));
    }
    Ok(path)
}

async fn canonical_basepath(basepath: &str) -> Result<PathBuf, String> {
    let path = Path::new(basepath);
    if !path.is_absolute() {
        return Err(format!("Base path must be absolute: '{}'", basepath));
    }

    tokio::fs::canonicalize(path)
        .await
        .map_err(|e| format!("Failed to resolve base path '{}': {}", basepath, e))
}

async fn resolve_existing_path(
    basepath: &str,
    filename: &str,
) -> Result<(PathBuf, PathBuf), String> {
    let relative = validate_relative_filename(filename)?;
    let base = canonical_basepath(basepath).await?;
    let path = tokio::fs::canonicalize(base.join(relative))
        .await
        .map_err(|e| format!("Failed to resolve '{}': {}", filename, e))?;

    if !path.starts_with(&base) {
        return Err(format!("Filename escapes the base path: '{}'", filename));
    }

    Ok((base, path))
}

async fn resolve_write_path(basepath: &str, filename: &str) -> Result<PathBuf, String> {
    let relative = validate_relative_filename(filename)?;
    let base = canonical_basepath(basepath).await?;
    let requested_path = base.join(relative);

    let path = match tokio::fs::canonicalize(&requested_path).await {
        Ok(path) => path,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
            let parent = requested_path
                .parent()
                .ok_or_else(|| format!("Filename has no parent directory: '{}'", filename))?;
            let canonical_parent = tokio::fs::canonicalize(parent)
                .await
                .map_err(|e| format!("Failed to resolve parent of '{}': {}", filename, e))?;
            let name = requested_path
                .file_name()
                .ok_or_else(|| format!("Filename has no file name: '{}'", filename))?;
            canonical_parent.join(name)
        }
        Err(error) => {
            return Err(format!("Failed to resolve '{}': {}", filename, error));
        }
    };

    if !path.starts_with(&base) {
        return Err(format!("Filename escapes the base path: '{}'", filename));
    }

    Ok(path)
}

#[tauri::command]
fn initial_config(state: tauri::State<'_, AppState>) -> InitialConfig {
    InitialConfig {
        basepath: state.basepath.to_string_lossy().into_owned(),
        filename: state.filename.clone(),
    }
}

#[tauri::command]
async fn path_kind(basepath: String, filename: String) -> Result<PathKind, String> {
    // Artificial delay to test UI loading states
    // tokio::time::sleep(std::time::Duration::from_millis(2000)).await;

    let (_, path) = resolve_existing_path(&basepath, &filename).await?;
    let metadata = tokio::fs::metadata(path)
        .await
        .map_err(|e| format!("Failed to inspect '{}': {}", filename, e))?;

    if metadata.is_file() {
        Ok(PathKind::File)
    } else if metadata.is_dir() {
        Ok(PathKind::Directory)
    } else {
        Ok(PathKind::Other)
    }
}

#[tauri::command]
async fn list_directory(basepath: String, filename: String) -> Result<Vec<DirectoryEntry>, String> {
    let (base, path) = resolve_existing_path(&basepath, &filename).await?;

    let mut directory = tokio::fs::read_dir(&path)
        .await
        .map_err(|e| format!("Failed to read directory '{}': {}", filename, e))?;
    let mut entries = Vec::new();

    while let Some(entry) = directory
        .next_entry()
        .await
        .map_err(|e| format!("Failed to read an entry in '{}': {}", filename, e))?
    {
        let entry_path = entry.path();
        let metadata = tokio::fs::metadata(&entry_path)
            .await
            .map_err(|e| format!("Failed to inspect '{}': {}", entry_path.display(), e))?;
        let kind = if metadata.is_dir() {
            PathKind::Directory
        } else if metadata.is_file() {
            PathKind::File
        } else {
            continue;
        };

        entries.push(DirectoryEntry {
            name: entry.file_name().to_string_lossy().into_owned(),
            filename: entry_path
                .strip_prefix(&base)
                .map_err(|e| format!("Failed to make '{}' relative: {}", entry_path.display(), e))?
                .to_string_lossy()
                .into_owned(),
            kind,
        });
    }

    entries.sort_by(|left, right| {
        left.kind
            .sort_order()
            .cmp(&right.kind.sort_order())
            .then_with(|| left.name.to_lowercase().cmp(&right.name.to_lowercase()))
            .then_with(|| left.name.cmp(&right.name))
    });

    Ok(entries)
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
async fn read_file(basepath: String, filename: String) -> Result<String, String> {
    info!("Reading {}", &filename);

    // Artificial delay to test UI loading states
    // tokio::time::sleep(std::time::Duration::from_millis(500)).await;

    let (_, path) = resolve_existing_path(&basepath, &filename).await?;
    tokio::fs::read_to_string(path)
        .await
        .map_err(|e| format!("Failed to read file '{}': {}", filename, e))
}

#[tauri::command]
async fn write_file(basepath: String, filename: String, content: String) -> Result<(), String> {
    info!("Writing {}", &filename);

    // Artificial delay of 2 seconds to test UI loading states
    // tokio::time::sleep(std::time::Duration::from_millis(500)).await;

    let path = resolve_write_path(&basepath, &filename).await?;
    tokio::fs::write(path, content)
        .await
        .map_err(|e| format!("Failed to write file '{}': {}", filename, e))
}

pub fn run_with_path(basepath: PathBuf, filename: String) {
    tauri::Builder::default()
        .manage(AppState { basepath, filename })
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
            initial_config,
            path_kind,
            list_directory,
            read_file,
            write_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let basepath = std::env::current_dir().expect("failed to get current directory");
    run_with_path(basepath, String::new());
}

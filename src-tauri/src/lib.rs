// Copyright (c) 2026 Adrián Romero
// SPDX-License-Identifier: MIT

use std::path::{Component, Path, PathBuf};
use tauri::Manager;
use tokio;
use tracing::{error, info};

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

#[derive(Clone, Copy, Debug, serde::Serialize)]
#[serde(rename_all = "snake_case")]
enum AppErrorCode {
    InvalidPath,
    PathNotFound,
    PermissionDenied,
    InspectPathFailed,
    ReadDirectoryFailed,
    ReadFileFailed,
    WriteFileFailed,
}

#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct AppError {
    code: AppErrorCode,
    #[serde(skip_serializing_if = "Option::is_none")]
    path: Option<String>,
}

impl AppError {
    fn new(code: AppErrorCode, filename: &str) -> Self {
        Self {
            code,
            path: (!filename.is_empty()).then(|| filename.to_owned()),
        }
    }

    fn invalid_path(filename: &str, reason: &str) -> Self {
        error!(path = filename, reason, "Invalid path");
        Self::new(AppErrorCode::InvalidPath, filename)
    }

    fn io(operation: &str, filename: &str, source: std::io::Error, fallback: AppErrorCode) -> Self {
        let code = match source.kind() {
            std::io::ErrorKind::NotFound => AppErrorCode::PathNotFound,
            std::io::ErrorKind::PermissionDenied => AppErrorCode::PermissionDenied,
            _ => fallback,
        };
        error!(operation, path = filename, error = %source, "Filesystem operation failed");
        Self::new(code, filename)
    }

    fn internal(code: AppErrorCode, operation: &str, filename: &str, reason: &str) -> Self {
        error!(operation, path = filename, reason, "Path operation failed");
        Self::new(code, filename)
    }
}

fn validate_relative_filename(filename: &str) -> Result<&Path, AppError> {
    let path = Path::new(filename);
    if path.is_absolute()
        || path.components().any(|component| {
            matches!(
                component,
                Component::ParentDir | Component::RootDir | Component::Prefix(_)
            )
        })
    {
        return Err(AppError::invalid_path(
            filename,
            "filename must be relative to the base path",
        ));
    }
    Ok(path)
}

async fn canonical_basepath(basepath: &str, filename: &str) -> Result<PathBuf, AppError> {
    let path = Path::new(basepath);
    if !path.is_absolute() {
        return Err(AppError::invalid_path(
            filename,
            "base path must be absolute",
        ));
    }

    tokio::fs::canonicalize(path).await.map_err(|error| {
        AppError::io(
            "resolve_base_path",
            filename,
            error,
            AppErrorCode::InvalidPath,
        )
    })
}

async fn resolve_existing_path(
    basepath: &str,
    filename: &str,
) -> Result<(PathBuf, PathBuf), AppError> {
    let relative = validate_relative_filename(filename)?;
    let base = canonical_basepath(basepath, filename).await?;
    let path = tokio::fs::canonicalize(base.join(relative))
        .await
        .map_err(|error| {
            AppError::io(
                "resolve_existing_path",
                filename,
                error,
                AppErrorCode::InspectPathFailed,
            )
        })?;

    if !path.starts_with(&base) {
        return Err(AppError::invalid_path(
            filename,
            "filename escapes the base path",
        ));
    }

    Ok((base, path))
}

async fn resolve_write_path(basepath: &str, filename: &str) -> Result<PathBuf, AppError> {
    let relative = validate_relative_filename(filename)?;
    let base = canonical_basepath(basepath, filename).await?;
    let requested_path = base.join(relative);

    let path = match tokio::fs::canonicalize(&requested_path).await {
        Ok(path) => path,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
            let parent = requested_path
                .parent()
                .ok_or_else(|| AppError::invalid_path(filename, "filename has no parent"))?;
            let canonical_parent = tokio::fs::canonicalize(parent).await.map_err(|error| {
                AppError::io(
                    "resolve_parent_path",
                    filename,
                    error,
                    AppErrorCode::WriteFileFailed,
                )
            })?;
            let name = requested_path
                .file_name()
                .ok_or_else(|| AppError::invalid_path(filename, "filename has no file name"))?;
            canonical_parent.join(name)
        }
        Err(error) => {
            return Err(AppError::io(
                "resolve_write_path",
                filename,
                error,
                AppErrorCode::WriteFileFailed,
            ));
        }
    };

    if !path.starts_with(&base) {
        return Err(AppError::invalid_path(
            filename,
            "filename escapes the base path",
        ));
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
async fn path_kind(basepath: String, filename: String) -> Result<PathKind, AppError> {
    // Artificial delay to test UI loading states
    // tokio::time::sleep(std::time::Duration::from_millis(2000)).await;

    let (_, path) = resolve_existing_path(&basepath, &filename).await?;
    let metadata = tokio::fs::metadata(path).await.map_err(|error| {
        AppError::io(
            "inspect_path",
            &filename,
            error,
            AppErrorCode::InspectPathFailed,
        )
    })?;

    if metadata.is_file() {
        Ok(PathKind::File)
    } else if metadata.is_dir() {
        Ok(PathKind::Directory)
    } else {
        Ok(PathKind::Other)
    }
}

#[tauri::command]
async fn list_directory(
    basepath: String,
    filename: String,
) -> Result<Vec<DirectoryEntry>, AppError> {
    let (base, path) = resolve_existing_path(&basepath, &filename).await?;

    let mut directory = tokio::fs::read_dir(&path).await.map_err(|error| {
        AppError::io(
            "read_directory",
            &filename,
            error,
            AppErrorCode::ReadDirectoryFailed,
        )
    })?;
    let mut entries = Vec::new();

    while let Some(entry) = directory.next_entry().await.map_err(|error| {
        AppError::io(
            "read_directory_entry",
            &filename,
            error,
            AppErrorCode::ReadDirectoryFailed,
        )
    })? {
        let entry_path = entry.path();
        let metadata = tokio::fs::metadata(&entry_path).await.map_err(|error| {
            AppError::io(
                "inspect_directory_entry",
                &filename,
                error,
                AppErrorCode::ReadDirectoryFailed,
            )
        })?;
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
                .map_err(|strip_error| {
                    AppError::internal(
                        AppErrorCode::ReadDirectoryFailed,
                        "make_directory_entry_relative",
                        &filename,
                        &strip_error.to_string(),
                    )
                })?
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
async fn read_file(basepath: String, filename: String) -> Result<String, AppError> {
    info!("Reading {}", &filename);

    // Artificial delay to test UI loading states
    // tokio::time::sleep(std::time::Duration::from_millis(500)).await;

    let (_, path) = resolve_existing_path(&basepath, &filename).await?;
    tokio::fs::read_to_string(path)
        .await
        .map_err(|error| AppError::io("read_file", &filename, error, AppErrorCode::ReadFileFailed))
}

#[tauri::command]
async fn write_file(basepath: String, filename: String, content: String) -> Result<(), AppError> {
    info!("Writing {}", &filename);

    // Artificial delay of 2 seconds to test UI loading states
    // tokio::time::sleep(std::time::Duration::from_millis(500)).await;

    let path = resolve_write_path(&basepath, &filename).await?;
    tokio::fs::write(path, content).await.map_err(|error| {
        AppError::io(
            "write_file",
            &filename,
            error,
            AppErrorCode::WriteFileFailed,
        )
    })
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

#[cfg(test)]
mod tests {
    use super::{AppError, AppErrorCode};

    #[test]
    fn app_error_serializes_only_safe_client_fields() {
        let error = AppError::new(AppErrorCode::ReadFileFailed, "notes/private.md");
        let value = serde_json::to_value(error).unwrap();

        assert_eq!(value["code"], "read_file_failed");
        assert_eq!(value["path"], "notes/private.md");
        assert_eq!(value.as_object().unwrap().len(), 2);
    }

    #[test]
    fn app_error_omits_an_empty_relative_path() {
        let error = AppError::new(AppErrorCode::ReadDirectoryFailed, "");
        let value = serde_json::to_value(error).unwrap();

        assert_eq!(value["code"], "read_directory_failed");
        assert!(value.get("path").is_none());
    }
}

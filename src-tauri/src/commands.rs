// Copyright (c) 2026 Adrián Romero
// SPDX-License-Identifier: MIT

use crate::app_error::{AppError, AppErrorCode};
use crate::paths::{
    canonical_basepath, normalize_link_filename, resolve_existing_path, resolve_write_path,
};
use std::path::PathBuf;
use tauri_plugin_opener::OpenerExt;
use tracing::info;

pub(crate) struct AppState {
    basepath: PathBuf,
    filename: String,
}

impl AppState {
    pub(crate) fn new(basepath: PathBuf, filename: String) -> Self {
        Self { basepath, filename }
    }
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct InitialConfig {
    basepath: String,
    filename: String,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "lowercase")]
pub(crate) enum PathKind {
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
pub(crate) struct DirectoryEntry {
    name: String,
    filename: String,
    kind: PathKind,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ReadFileResult {
    content: String,
    is_new: bool,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ReadBinaryFileResult {
    content: Vec<u8>,
    is_new: bool,
}

#[tauri::command]
pub(crate) fn initial_config(state: tauri::State<'_, AppState>) -> InitialConfig {
    InitialConfig {
        basepath: state.basepath.to_string_lossy().into_owned(),
        filename: state.filename.clone(),
    }
}

#[tauri::command]
pub(crate) async fn path_kind(basepath: String, filename: String) -> Result<PathKind, AppError> {
    let path = resolve_write_path(&basepath, &filename).await?;
    let metadata = match tokio::fs::metadata(path).await {
        Ok(metadata) => metadata,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(PathKind::File),
        Err(error) => {
            return Err(AppError::io(
                "inspect_path",
                &filename,
                error,
                AppErrorCode::InspectPathFailed,
            ));
        }
    };

    if metadata.is_file() {
        Ok(PathKind::File)
    } else if metadata.is_dir() {
        Ok(PathKind::Directory)
    } else {
        Ok(PathKind::Other)
    }
}

#[tauri::command]
pub(crate) async fn resolve_link(
    app: tauri::AppHandle,
    basepath: String,
    filename: String,
    href: String,
) -> Result<Option<String>, AppError> {
    if href.split_once(':').is_some_and(|(scheme, _)| {
        ["http", "https", "mailto"]
            .iter()
            .any(|allowed| scheme.eq_ignore_ascii_case(allowed))
    }) {
        app.opener()
            .open_url(&href, None::<&str>)
            .map_err(|error| {
                AppError::internal(
                    AppErrorCode::OpenFileFailed,
                    "open_link",
                    &href,
                    &error.to_string(),
                )
            })?;
        return Ok(None);
    }

    let normalized_filename = normalize_link_filename(&filename, &href)?
        .to_string_lossy()
        .into_owned();
    let path = resolve_write_path(&basepath, &normalized_filename).await?;
    let base = canonical_basepath(&basepath, &normalized_filename).await?;

    path.strip_prefix(base)
        .map(|relative| Some(relative.to_string_lossy().into_owned()))
        .map_err(|error| {
            AppError::internal(
                AppErrorCode::InvalidPath,
                "make_link_target_relative",
                &normalized_filename,
                &error.to_string(),
            )
        })
}

#[tauri::command]
pub(crate) async fn list_directory(
    basepath: String,
    filename: String,
    show_hidden: bool,
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
        let entry_name = entry.file_name().to_string_lossy().into_owned();
        if !show_hidden && entry_name.starts_with('.') {
            continue;
        }

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
            name: entry_name,
            filename: entry_path
                .strip_prefix(&base)
                .map_err(|error| {
                    AppError::internal(
                        AppErrorCode::ReadDirectoryFailed,
                        "make_directory_entry_relative",
                        &filename,
                        &error.to_string(),
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

#[tauri::command]
pub(crate) async fn read_file(
    basepath: String,
    filename: String,
) -> Result<ReadFileResult, AppError> {
    info!("Reading {}", &filename);
    let path = resolve_write_path(&basepath, &filename).await?;
    match tokio::fs::read_to_string(path).await {
        Ok(content) => Ok(ReadFileResult {
            content,
            is_new: false,
        }),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(ReadFileResult {
            content: String::new(),
            is_new: true,
        }),
        Err(error) => Err(AppError::io(
            "read_file",
            &filename,
            error,
            AppErrorCode::ReadFileFailed,
        )),
    }
}

#[tauri::command]
pub(crate) async fn read_binary_file(
    basepath: String,
    filename: String,
) -> Result<ReadBinaryFileResult, AppError> {
    info!("Reading binary file {}", &filename);
    let path = resolve_write_path(&basepath, &filename).await?;
    match tokio::fs::read(path).await {
        Ok(content) => Ok(ReadBinaryFileResult {
            content,
            is_new: false,
        }),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(ReadBinaryFileResult {
            content: Vec::new(),
            is_new: true,
        }),
        Err(error) => Err(AppError::io(
            "read_binary_file",
            &filename,
            error,
            AppErrorCode::ReadFileFailed,
        )),
    }
}

#[tauri::command]
pub(crate) async fn write_binary_file(
    basepath: String,
    filename: String,
    content: Vec<u8>,
    create_if_empty: bool,
) -> Result<(), AppError> {
    info!("Writing binary file {}", &filename);
    let path = resolve_write_path(&basepath, &filename).await?;

    if !create_if_empty && tokio::fs::metadata(&path).await.is_err() {
        return Ok(());
    }

    tokio::fs::write(path, content).await.map_err(|error| {
        AppError::io(
            "write_binary_file",
            &filename,
            error,
            AppErrorCode::WriteFileFailed,
        )
    })
}

#[tauri::command]
pub(crate) async fn open_file(
    app: tauri::AppHandle,
    basepath: String,
    filename: String,
) -> Result<(), AppError> {
    let (_, path) = resolve_existing_path(&basepath, &filename).await?;
    info!(path = %path.display(), "Opening file with its default application");

    app.opener()
        .open_path(path.to_string_lossy(), None::<&str>)
        .map_err(|error| {
            AppError::internal(
                AppErrorCode::OpenFileFailed,
                "open_file",
                &filename,
                &error.to_string(),
            )
        })
}

#[tauri::command]
pub(crate) async fn write_file(
    basepath: String,
    filename: String,
    content: String,
    create_if_empty: bool,
) -> Result<(), AppError> {
    info!("Writing {}", &filename);
    let path = resolve_write_path(&basepath, &filename).await?;

    if content.is_empty() && !create_if_empty {
        return match tokio::fs::OpenOptions::new()
            .write(true)
            .truncate(true)
            .open(path)
            .await
        {
            Ok(_) => Ok(()),
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(()),
            Err(error) => Err(AppError::io(
                "write_file",
                &filename,
                error,
                AppErrorCode::WriteFileFailed,
            )),
        };
    }

    tokio::fs::write(path, content).await.map_err(|error| {
        AppError::io(
            "write_file",
            &filename,
            error,
            AppErrorCode::WriteFileFailed,
        )
    })
}

#[cfg(test)]
mod tests;

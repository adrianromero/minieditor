// Copyright (c) 2026 Adrián Romero
// SPDX-License-Identifier: MIT

use crate::app_error::{AppError, AppErrorCode};
use std::path::{Component, Path, PathBuf};

pub(crate) fn validate_relative_filename(filename: &str) -> Result<&Path, AppError> {
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

fn has_uri_scheme(href: &str) -> bool {
    let mut characters = href.chars();
    if !characters
        .next()
        .is_some_and(|character| character.is_ascii_alphabetic())
    {
        return false;
    }

    characters
        .take_while(|character| *character != ':')
        .all(|character| character.is_ascii_alphanumeric() || matches!(character, '+' | '-' | '.'))
        && href.contains(':')
}

pub(crate) fn normalize_link_filename(filename: &str, href: &str) -> Result<PathBuf, AppError> {
    let current = validate_relative_filename(filename)?;
    let link = Path::new(href);
    if has_uri_scheme(href) || href.starts_with("//") {
        return Err(AppError::unsupported_link(href));
    }
    if href.is_empty() || link.is_absolute() {
        return Err(AppError::invalid_path(
            href,
            "link target must be a relative path",
        ));
    }

    let mut normalized = PathBuf::new();
    let target = current.parent().unwrap_or_else(|| Path::new("")).join(link);

    for component in target.components() {
        match component {
            Component::CurDir => {}
            Component::Normal(part) => normalized.push(part),
            Component::ParentDir => {
                if !normalized.pop() {
                    return Err(AppError::invalid_path(
                        href,
                        "link target escapes the base path",
                    ));
                }
            }
            Component::RootDir | Component::Prefix(_) => {
                return Err(AppError::invalid_path(
                    href,
                    "link target must be a relative path",
                ));
            }
        }
    }

    if normalized.as_os_str().is_empty() {
        return Err(AppError::invalid_path(href, "link target is empty"));
    }

    Ok(normalized)
}

pub(crate) async fn canonical_basepath(
    basepath: &str,
    filename: &str,
) -> Result<PathBuf, AppError> {
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

pub(crate) async fn resolve_existing_path(
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

pub(crate) async fn resolve_write_path(
    basepath: &str,
    filename: &str,
) -> Result<PathBuf, AppError> {
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

#[cfg(test)]
mod tests;

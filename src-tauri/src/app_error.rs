// Copyright (c) 2026 Adrián Romero
// SPDX-License-Identifier: MIT

use tracing::error;

#[derive(Clone, Copy, Debug, serde::Serialize)]
#[serde(rename_all = "snake_case")]
pub(crate) enum AppErrorCode {
    InvalidPath,
    UnsupportedLink,
    PathNotFound,
    PermissionDenied,
    InspectPathFailed,
    ReadDirectoryFailed,
    ReadFileFailed,
    OpenFileFailed,
    WriteFileFailed,
}

#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct AppError {
    code: AppErrorCode,
    #[serde(skip_serializing_if = "Option::is_none")]
    path: Option<String>,
}

impl AppError {
    pub(crate) fn new(code: AppErrorCode, filename: &str) -> Self {
        Self {
            code,
            path: (!filename.is_empty()).then(|| filename.to_owned()),
        }
    }

    pub(crate) fn invalid_path(filename: &str, reason: &str) -> Self {
        error!(path = filename, reason, "Invalid path");
        Self::new(AppErrorCode::InvalidPath, filename)
    }

    pub(crate) fn unsupported_link(href: &str) -> Self {
        error!(href, "Unsupported link");
        Self::new(AppErrorCode::UnsupportedLink, href)
    }

    pub(crate) fn io(
        operation: &str,
        filename: &str,
        source: std::io::Error,
        fallback: AppErrorCode,
    ) -> Self {
        let code = match source.kind() {
            std::io::ErrorKind::NotFound => AppErrorCode::PathNotFound,
            std::io::ErrorKind::PermissionDenied => AppErrorCode::PermissionDenied,
            _ => fallback,
        };
        error!(operation, path = filename, error = %source, "Filesystem operation failed");
        Self::new(code, filename)
    }

    pub(crate) fn internal(
        code: AppErrorCode,
        operation: &str,
        filename: &str,
        reason: &str,
    ) -> Self {
        error!(operation, path = filename, reason, "Path operation failed");
        Self::new(code, filename)
    }
}

#[cfg(test)]
mod tests;

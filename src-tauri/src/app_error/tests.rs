// Copyright (c) 2026 Adrián Romero
// SPDX-License-Identifier: MIT

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

// Copyright (c) 2026 Adrián Romero
// SPDX-License-Identifier: MIT

use super::resolve_path_from;
use std::path::PathBuf;

#[test]
fn no_arguments_use_current_directory_and_empty_filename() {
    let current_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let (basepath, filename) = resolve_path_from(None, None, &current_dir).unwrap();

    assert_eq!(basepath, std::fs::canonicalize(current_dir).unwrap());
    assert!(filename.is_empty());
}

#[test]
fn filename_uses_current_directory_as_base_path() {
    let current_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let (basepath, filename) =
        resolve_path_from(Some(PathBuf::from("Cargo.toml")), None, &current_dir).unwrap();

    assert_eq!(basepath, std::fs::canonicalize(current_dir).unwrap());
    assert_eq!(filename, "Cargo.toml");
}

#[test]
fn absolute_base_path_can_be_used_without_a_filename() {
    let current_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let (basepath, filename) =
        resolve_path_from(None, Some(current_dir.clone()), &current_dir).unwrap();

    assert_eq!(basepath, std::fs::canonicalize(current_dir).unwrap());
    assert!(filename.is_empty());
}

#[test]
fn relative_base_path_can_be_used_without_a_filename() {
    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let current_dir = manifest_dir.parent().unwrap();
    let (basepath, filename) =
        resolve_path_from(None, Some(PathBuf::from("src-tauri")), current_dir).unwrap();

    assert_eq!(basepath, std::fs::canonicalize(manifest_dir).unwrap());
    assert!(filename.is_empty());
}

#[test]
fn relative_base_path_is_resolved_from_current_directory() {
    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let current_dir = manifest_dir.parent().unwrap();
    let (basepath, filename) = resolve_path_from(
        Some(PathBuf::from("Cargo.toml")),
        Some(PathBuf::from("src-tauri")),
        current_dir,
    )
    .unwrap();

    assert_eq!(basepath, std::fs::canonicalize(manifest_dir).unwrap());
    assert_eq!(filename, "Cargo.toml");
}

#[test]
fn absolute_filename_is_rejected() {
    let current_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let error =
        resolve_path_from(Some(current_dir.join("Cargo.toml")), None, &current_dir).unwrap_err();

    assert!(error.contains("Filename must be relative"));
}

#[test]
fn filename_cannot_escape_the_base_path() {
    let current_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let error =
        resolve_path_from(Some(PathBuf::from("../Cargo.toml")), None, &current_dir).unwrap_err();

    assert!(error.contains("Filename must be relative"));
}

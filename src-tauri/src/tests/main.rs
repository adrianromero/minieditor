// Copyright (c) 2026 Adrián Romero
// SPDX-License-Identifier: MIT

use super::resolve_path;
use std::path::PathBuf;

#[test]
fn directory_path_has_an_empty_filename() {
    let directory = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let (basepath, filename) = resolve_path(Some(directory.clone())).unwrap();

    assert_eq!(basepath, std::fs::canonicalize(directory).unwrap());
    assert!(filename.is_empty());
}

#[test]
fn file_path_is_split_into_parent_and_filename() {
    let file = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("Cargo.toml");
    let canonical_file = std::fs::canonicalize(&file).unwrap();
    let (basepath, filename) = resolve_path(Some(file)).unwrap();

    assert_eq!(basepath, canonical_file.parent().unwrap());
    assert_eq!(filename, "Cargo.toml");
}

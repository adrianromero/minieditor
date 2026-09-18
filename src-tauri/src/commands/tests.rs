// Copyright (c) 2026 Adrián Romero
// SPDX-License-Identifier: MIT

use super::{read_file, write_file};
use std::time::{SystemTime, UNIX_EPOCH};

#[test]
fn missing_file_is_unsaved_until_written() {
    tauri::async_runtime::block_on(async {
        let unique = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let base = std::env::temp_dir().join(format!("minieditor-read-file-{unique}"));
        std::fs::create_dir(&base).unwrap();
        let path = base.join("new.md");
        let basepath = base.to_string_lossy().into_owned();

        let result = read_file(basepath.clone(), "new.md".to_owned())
            .await
            .unwrap();

        assert!(result.content.is_empty());
        assert!(result.is_new);
        assert!(!path.exists());

        write_file(
            basepath.clone(),
            "new.md".to_owned(),
            "New content".to_owned(),
            false,
        )
        .await
        .unwrap();

        let result = read_file(basepath, "new.md".to_owned()).await.unwrap();
        assert_eq!(result.content, "New content");
        assert!(!result.is_new);

        std::fs::remove_dir_all(base).unwrap();
    });
}

#[test]
fn empty_missing_file_is_only_created_by_explicit_save() {
    tauri::async_runtime::block_on(async {
        let unique = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let base = std::env::temp_dir().join(format!("minieditor-empty-file-{unique}"));
        std::fs::create_dir(&base).unwrap();
        let path = base.join("empty.md");
        let basepath = base.to_string_lossy().into_owned();

        write_file(
            basepath.clone(),
            "empty.md".to_owned(),
            String::new(),
            false,
        )
        .await
        .unwrap();
        assert!(!path.exists());

        write_file(basepath.clone(), "empty.md".to_owned(), String::new(), true)
            .await
            .unwrap();
        assert!(path.is_file());

        std::fs::write(&path, "content").unwrap();
        write_file(basepath, "empty.md".to_owned(), String::new(), false)
            .await
            .unwrap();
        assert!(path.is_file());
        assert!(std::fs::read_to_string(&path).unwrap().is_empty());

        std::fs::remove_dir_all(base).unwrap();
    });
}

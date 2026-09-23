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

#[test]
fn link_paths_accept_new_files_and_directories_but_remain_inside_base() {
    tauri::async_runtime::block_on(async {
        let unique = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let base = std::env::temp_dir().join(format!("minieditor-links-{unique}"));
        std::fs::create_dir_all(base.join("docs")).unwrap();
        std::fs::write(base.join("existing.md"), "Existing").unwrap();
        let basepath = base.to_string_lossy().into_owned();

        for (href, expected) in [
            ("./newfile.md", "newfile.md"),
            ("./docs", "docs"),
            ("./existing.md", "existing.md"),
            ("./docs/new.md", "docs/new.md"),
        ] {
            let resolved =
                resolve_local_link(basepath.clone(), "index.md".to_owned(), href.to_owned())
                    .await
                    .unwrap();
            assert_eq!(
                std::path::Path::new(&resolved),
                std::path::Path::new(expected)
            );
        }
        let result = read_file(basepath.clone(), "newfile.md".to_owned())
            .await
            .unwrap();
        assert!(result.is_new);
        assert!(result.content.is_empty());
        assert!(!base.join("newfile.md").exists());
        assert!(crate::paths::resolve_existing_path(&basepath, "newfile.md")
            .await
            .is_err());
        assert!(
            super::list_directory(basepath.clone(), "missing".to_owned())
                .await
                .is_err()
        );

        #[cfg(unix)]
        {
            std::os::unix::fs::symlink(std::env::temp_dir(), base.join("outside")).unwrap();
            assert!(resolve_local_link(
                basepath.clone(),
                "index.md".to_owned(),
                "./outside/newfile.md".to_owned(),
            )
            .await
            .is_err());
            std::os::unix::fs::symlink(base.join("docs"), base.join("alias")).unwrap();
            assert_eq!(
                resolve_local_link(
                    basepath.clone(),
                    "index.md".to_owned(),
                    "./alias/newfile.md".to_owned(),
                )
                .await
                .unwrap(),
                "docs/newfile.md"
            );
        }

        std::fs::remove_dir_all(base).unwrap();
    });
}

#[test]
fn missing_binary_file_is_empty_and_new_until_explicitly_saved() {
    tauri::async_runtime::block_on(async {
        let unique = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let base = std::env::temp_dir().join(format!("minieditor-binary-file-{unique}"));
        std::fs::create_dir(&base).unwrap();
        let basepath = base.to_string_lossy().into_owned();
        let filename = "new.png".to_owned();
        let result = super::read_binary_file(basepath.clone(), filename.clone())
            .await
            .unwrap();
        assert!(result.content.is_empty());
        assert!(result.is_new);
        assert_eq!(serde_json::to_value(&result).unwrap()["isNew"], true);
        assert!(!base.join(&filename).exists());

        super::write_binary_file(basepath.clone(), filename.clone(), vec![], false)
            .await
            .unwrap();
        assert!(!base.join(&filename).exists());
        super::write_binary_file(basepath.clone(), filename.clone(), vec![], true)
            .await
            .unwrap();
        let result = super::read_binary_file(basepath.clone(), filename.clone())
            .await
            .unwrap();
        assert!(result.content.is_empty());
        assert!(!result.is_new);

        let bytes = vec![0, 128, 255];
        super::write_binary_file(basepath.clone(), filename.clone(), bytes.clone(), true)
            .await
            .unwrap();
        let result = super::read_binary_file(basepath.clone(), filename)
            .await
            .unwrap();
        assert_eq!(result.content, bytes);
        assert!(!result.is_new);
        assert!(super::read_binary_file(basepath, "".to_owned())
            .await
            .is_err());
        std::fs::remove_dir_all(base).unwrap();
    });
}

async fn resolve_local_link(
    basepath: String,
    filename: String,
    href: String,
) -> Result<String, crate::app_error::AppError> {
    let normalized = crate::paths::normalize_link_filename(&filename, &href)?;
    let normalized = normalized.to_string_lossy();
    let path = crate::paths::resolve_write_path(&basepath, &normalized).await?;
    let base = crate::paths::canonical_basepath(&basepath, &normalized).await?;
    Ok(path
        .strip_prefix(base)
        .unwrap()
        .to_string_lossy()
        .into_owned())
}

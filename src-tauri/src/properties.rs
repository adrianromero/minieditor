// Copyright (c) 2026 Adrián Romero
// SPDX-License-Identifier: MIT

use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use std::fs;
use std::path::{Path, PathBuf};

const CONFIG_DIRECTORY: &str = ".minieditor";
const PROPERTIES_FILENAME: &str = "properties.toml";

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
pub(crate) struct Properties {
    pub(crate) width: u32,
    pub(crate) height: u32,
    #[serde(default, skip_serializing_if = "BTreeMap::is_empty")]
    basepaths: BTreeMap<String, String>,
}

impl Properties {
    pub(crate) fn new(width: u32, height: u32) -> Self {
        Self {
            width,
            height,
            basepaths: BTreeMap::new(),
        }
    }

    pub(crate) fn filename_for(&self, basepath: &Path) -> Option<&str> {
        self.basepaths
            .get(basepath.to_string_lossy().as_ref())
            .map(String::as_str)
    }

    pub(crate) fn set_filename(&mut self, basepath: &Path, filename: String) {
        self.basepaths
            .insert(basepath.to_string_lossy().into_owned(), filename);
    }

    fn validate(self) -> Result<Self, String> {
        if self.width == 0 || self.height == 0 {
            return Err("window dimensions must be greater than zero".to_owned());
        }
        Ok(self)
    }
}

impl Default for Properties {
    fn default() -> Self {
        Self::new(800, 600)
    }
}

pub(crate) fn properties_path(home: &Path) -> PathBuf {
    home.join(CONFIG_DIRECTORY).join(PROPERTIES_FILENAME)
}

pub(crate) fn load(path: &Path) -> Result<Option<Properties>, String> {
    let contents = match fs::read_to_string(path) {
        Ok(contents) => contents,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(None),
        Err(error) => return Err(format!("unable to read '{}': {error}", path.display())),
    };

    toml::from_str::<Properties>(&contents)
        .map_err(|error| format!("unable to parse '{}': {error}", path.display()))?
        .validate()
        .map(Some)
}

pub(crate) fn save(path: &Path, properties: &Properties) -> Result<(), String> {
    let parent = path
        .parent()
        .ok_or_else(|| format!("properties path '{}' has no parent", path.display()))?;
    fs::create_dir_all(parent)
        .map_err(|error| format!("unable to create '{}': {error}", parent.display()))?;

    let contents = toml::to_string_pretty(&properties)
        .map_err(|error| format!("unable to serialize window properties: {error}"))?;
    fs::write(path, contents)
        .map_err(|error| format!("unable to write '{}': {error}", path.display()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::atomic::{AtomicU64, Ordering};

    static NEXT_TEST_DIRECTORY: AtomicU64 = AtomicU64::new(0);

    fn test_home() -> PathBuf {
        let sequence = NEXT_TEST_DIRECTORY.fetch_add(1, Ordering::Relaxed);
        std::env::temp_dir().join(format!(
            "minieditor-properties-{}-{sequence}",
            std::process::id()
        ))
    }

    #[test]
    fn missing_properties_use_the_default_dimensions() {
        let home = test_home();
        let path = properties_path(&home);

        assert_eq!(
            load(&path).unwrap().unwrap_or_default(),
            Properties::default()
        );
    }

    #[test]
    fn properties_are_created_and_loaded() {
        let home = test_home();
        let path = properties_path(&home);
        let mut expected = Properties::new(1280, 720);
        expected.set_filename(
            Path::new("/home/user/documents"),
            "notes/today.md".to_owned(),
        );

        save(&path, &expected).unwrap();

        assert_eq!(load(&path).unwrap(), Some(expected));
        assert!(path.is_file());
        fs::remove_dir_all(home).unwrap();
    }

    #[test]
    fn invalid_dimensions_are_rejected() {
        let home = test_home();
        let path = properties_path(&home);
        fs::create_dir_all(path.parent().unwrap()).unwrap();
        fs::write(&path, "width = 0\nheight = 600\n").unwrap();

        assert!(load(&path).is_err());
        fs::remove_dir_all(home).unwrap();
    }

    #[test]
    fn legacy_dimension_only_properties_are_supported() {
        let home = test_home();
        let path = properties_path(&home);
        fs::create_dir_all(path.parent().unwrap()).unwrap();
        fs::write(&path, "width = 1024\nheight = 768\n").unwrap();

        let properties = load(&path).unwrap().unwrap();

        assert_eq!(properties.width, 1024);
        assert_eq!(properties.height, 768);
        assert_eq!(properties.filename_for(Path::new("/missing")), None);
        fs::remove_dir_all(home).unwrap();
    }

    #[test]
    fn filenames_are_stored_per_basepath() {
        let mut properties = Properties::default();

        properties.set_filename(Path::new("/documents/one"), "first.md".to_owned());
        properties.set_filename(Path::new("/documents/two"), "folder/second.md".to_owned());

        assert_eq!(
            properties.filename_for(Path::new("/documents/one")),
            Some("first.md")
        );
        assert_eq!(
            properties.filename_for(Path::new("/documents/two")),
            Some("folder/second.md")
        );
    }
}

// Copyright (c) 2026 Adrián Romero
// SPDX-License-Identifier: MIT

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use clap::Parser;
use std::path::PathBuf;
use tracing::info;
use tracing_subscriber;

#[derive(Debug, Parser)]
#[command(version, about = "A lightweight Markdown editor")]
struct Cli {
    /// File to open or base directory containing the files that can be opened
    #[arg(value_name = "PATH", value_hint = clap::ValueHint::AnyPath)]
    path: Option<PathBuf>,
}

fn resolve_path(path: Option<PathBuf>) -> Result<(PathBuf, String), String> {
    let requested_path = match path {
        Some(path) => path,
        None => std::env::current_dir()
            .map_err(|error| format!("Failed to get current directory: {}", error))?,
    };
    let canonical_path = std::fs::canonicalize(&requested_path).map_err(|error| {
        format!(
            "Failed to resolve base path '{}': {}",
            requested_path.display(),
            error
        )
    })?;

    if canonical_path.is_dir() {
        return Ok((canonical_path, String::new()));
    }

    if canonical_path.is_file() {
        let basepath = canonical_path.parent().ok_or_else(|| {
            format!(
                "File path has no parent directory: '{}'",
                canonical_path.display()
            )
        })?;
        let filename = canonical_path
            .file_name()
            .ok_or_else(|| format!("File path has no filename: '{}'", canonical_path.display()))?;
        return Ok((
            basepath.to_path_buf(),
            filename.to_string_lossy().into_owned(),
        ));
    }

    Err(format!(
        "Path is not a regular file or directory: '{}'",
        canonical_path.display()
    ))
}

fn main() {
    tracing_subscriber::fmt::init();
    let cli = Cli::parse();
    let (basepath, filename) = resolve_path(cli.path).unwrap_or_else(|error| {
        eprintln!("Error: {}", error);
        std::process::exit(2);
    });

    info!(
        "Starting MiniEditor with base path {} and filename {}",
        basepath.display(),
        filename
    );
    minieditor_lib::run_with_path(basepath, filename)
}

#[cfg(test)]
#[path = "tests/main.rs"]
mod tests;

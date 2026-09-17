// Copyright (c) 2026 Adrián Romero
// SPDX-License-Identifier: MIT

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use clap::Parser;
use std::path::{Component, Path, PathBuf};
use tracing::info;
use tracing_subscriber;

#[derive(Debug, Parser)]
#[command(version, about = "A lightweight Markdown editor")]
struct Cli {
    /// Relative file or directory to open
    #[arg(value_name = "FILENAME", value_hint = clap::ValueHint::AnyPath)]
    filename: Option<PathBuf>,

    /// Root directory containing the files that can be opened
    #[arg(long, value_name = "BASEPATH", value_hint = clap::ValueHint::DirPath)]
    base_path: Option<PathBuf>,
}

fn resolve_path(
    filename: Option<PathBuf>,
    base_path: Option<PathBuf>,
) -> Result<(PathBuf, String), String> {
    let current_dir = std::env::current_dir()
        .map_err(|error| format!("Failed to get current directory: {}", error))?;
    resolve_path_from(filename, base_path, &current_dir)
}

fn resolve_path_from(
    filename: Option<PathBuf>,
    base_path: Option<PathBuf>,
    current_dir: &Path,
) -> Result<(PathBuf, String), String> {
    let requested_base = base_path.unwrap_or_else(|| current_dir.to_path_buf());
    let requested_base = if requested_base.is_absolute() {
        requested_base
    } else {
        current_dir.join(requested_base)
    };
    let canonical_base = std::fs::canonicalize(&requested_base).map_err(|error| {
        format!(
            "Failed to resolve base path '{}': {}",
            requested_base.display(),
            error
        )
    })?;

    if !canonical_base.is_dir() {
        return Err(format!(
            "Base path is not a directory: '{}'",
            canonical_base.display()
        ));
    }

    let Some(filename) = filename else {
        return Ok((canonical_base, String::new()));
    };

    if filename.is_absolute()
        || filename.components().any(|component| {
            matches!(
                component,
                Component::ParentDir | Component::RootDir | Component::Prefix(_)
            )
        })
    {
        return Err(format!(
            "Filename must be relative to the base path: '{}'",
            filename.display()
        ));
    }

    Ok((canonical_base, filename.to_string_lossy().into_owned()))
}

fn main() {
    tracing_subscriber::fmt::init();
    let cli = Cli::parse();
    let (basepath, filename) = resolve_path(cli.filename, cli.base_path).unwrap_or_else(|error| {
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

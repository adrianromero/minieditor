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
    /// Base directory containing the files that can be opened
    #[arg(value_name = "BASEPATH", value_hint = clap::ValueHint::DirPath)]
    basepath: Option<PathBuf>,
}

fn resolve_basepath(basepath: Option<PathBuf>) -> Result<PathBuf, String> {
    let requested_path = match basepath {
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

    if !canonical_path.is_dir() {
        return Err(format!(
            "Base path is not a directory: '{}'",
            canonical_path.display()
        ));
    }

    Ok(canonical_path)
}

fn main() {
    tracing_subscriber::fmt::init();
    let cli = Cli::parse();
    let basepath = resolve_basepath(cli.basepath).unwrap_or_else(|error| {
        eprintln!("Error: {}", error);
        std::process::exit(2);
    });

    info!("Starting MiniEditor with base path {}", basepath.display());
    minieditor_lib::run_with_basepath(basepath)
}

use tauri::Manager;

fn is_linux() -> bool {
    cfg!(target_os = "linux")
}

fn is_macos() -> bool {
    cfg!(target_os = "macos")
}

fn is_windows() -> bool {
    cfg!(target_os = "windows")
}

fn should_disable_native_decorations() -> bool {
    if is_macos() || is_windows() {
        return false;
    }

    is_linux()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            if should_disable_native_decorations() {
                if let Some(window) = app.get_webview_window("main") {
                    window.set_decorations(false)?;
                }
            }

            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

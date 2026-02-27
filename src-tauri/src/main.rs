#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // On Wayland, prevent the AppImage's GTK hook from forcing GDK_BACKEND=x11,
    // which causes pixelated rendering due to XWayland not supporting fractional scaling.
    #[cfg(target_os = "linux")]
    if std::env::var("WAYLAND_DISPLAY").is_ok() {
        std::env::set_var("GDK_BACKEND", "wayland");
    }

    conduit_lib::run()
}

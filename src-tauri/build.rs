// 这些常量由 scripts/sync-version.cjs 从 .env.local / constants.ts 同步，勿手改
const VITE_API_URL: &str = "https://izxkjyexmkgslzndlnjc.supabase.co";
const VITE_API_KEY: &str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6eGtqeWV4bWtnc2x6bmRsbmpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5OTkwMDQsImV4cCI6MjA3OTU3NTAwNH0.3w2r8rPjgA0axyp7VQofN3z41cFw1_qc0m7x-QlFjFw";
const APP_VERSION: &str = "1.1.0";

fn main() {
    let mut windows = tauri_build::WindowsAttributes::new();
    windows = windows.app_manifest(include_str!("src/manifest.xml"));

    // 暴露给 Rust 编译期（后端更新检测用，与前端 VITE_* 同源）
    println!("cargo:rustc-env=VITE_API_URL={VITE_API_URL}");
    println!("cargo:rustc-env=VITE_API_KEY={VITE_API_KEY}");
    println!("cargo:rustc-env=APP_VERSION={APP_VERSION}");
    println!("cargo:rerun-if-changed=build.rs");

    tauri_build::try_build(
        tauri_build::Attributes::new()
            .windows_attributes(windows)
    ).expect("failed to run tauri-build");
}

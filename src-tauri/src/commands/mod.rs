pub mod scripts;
pub mod categories;
pub mod runner;
pub mod scheduler;
pub mod history;
pub mod settings;

/// Resolve which PowerShell executable runs .ps1 scripts from the settings
/// value: 'ps5' = Windows PowerShell 5.1, anything else = PowerShell 7.
/// Falls back to powershell.exe when pwsh.exe isn't installed.
pub fn powershell_exe(version: &str) -> &'static str {
    if version == "ps5" {
        return "powershell.exe";
    }
    #[cfg(target_os = "windows")]
    {
        static PWSH_AVAILABLE: std::sync::OnceLock<bool> = std::sync::OnceLock::new();
        if *PWSH_AVAILABLE.get_or_init(|| {
            std::process::Command::new("where.exe")
                .arg("pwsh.exe")
                .stdout(std::process::Stdio::null())
                .stderr(std::process::Stdio::null())
                .status()
                .map(|s| s.success())
                .unwrap_or(false)
        }) {
            "pwsh.exe"
        } else {
            "powershell.exe"
        }
    }
    #[cfg(not(target_os = "windows"))]
    {
        "pwsh"
    }
}

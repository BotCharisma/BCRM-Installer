use crate::app::models::{InstalledRecord, PackageDetails, PackageItem};
use std::collections::HashMap;
use std::path::PathBuf;
use std::process::Command;

#[cfg(windows)]
use std::os::windows::process::CommandExt;

#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x0800_0000;

pub fn resolve_winget_binary() -> String {
    if let Some(local) = std::env::var_os("LOCALAPPDATA") {
        let candidate = PathBuf::from(local)
            .join("Microsoft")
            .join("WindowsApps")
            .join("winget.exe");
        if candidate.exists() {
            return candidate.to_string_lossy().to_string();
        }
    }
    "winget".to_string()
}

pub fn create_winget_command(args: &[String]) -> Command {
    let bin = resolve_winget_binary();
    let mut cmd = Command::new(bin);
    cmd.args(args);
    #[cfg(windows)]
    cmd.creation_flags(CREATE_NO_WINDOW);
    cmd
}

pub fn run_winget_capture(args: &[String]) -> Result<String, String> {
    let output = create_winget_command(args)
        .output()
        .map_err(|e| format!("Không thể chạy winget.exe: {e}"))?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    if stdout.trim().is_empty() && !output.status.success() {
        return Err(if stderr.trim().is_empty() {
            format!("winget trả về mã lỗi {:?}", output.status.code())
        } else {
            stderr.trim().to_string()
        });
    }

    Ok(stdout)
}

pub fn get_winget_version() -> Result<String, String> {
    let out = run_winget_capture(&["--version".to_string()])?;
    Ok(out.lines().last().unwrap_or("").trim().to_string())
}

pub fn search_packages(
    query: &str,
    source: &str,
    installed_map: &HashMap<String, InstalledRecord>,
) -> Result<Vec<PackageItem>, String> {
    let trimmed = query.trim();
    if trimmed.is_empty() {
        return Ok(Vec::new());
    }

    let mut args = vec![
        "search".to_string(),
        "--query".to_string(),
        trimmed.to_string(),
        "--accept-source-agreements".to_string(),
    ];

    if source == "winget" || source == "msstore" {
        args.push("--source".to_string());
        args.push(source.to_string());
    }

    let raw = run_winget_capture(&args)?;
    let mut items = parse_search_output(&raw, source);

    for item in &mut items {
        if let Some(inst) = installed_map
            .get(&item.id)
            .or_else(|| installed_map.get(&item.id.to_lowercase()))
        {
            item.is_installed = true;
            item.available_version = inst.available_version.clone();
            item.has_update = inst.available_version.is_some();
        }
        if item.source == "msstore" {
            item.store_url = Some(format!("ms-windows-store://pdp/?ProductId={}", item.id));
        }
    }

    Ok(items)
}

pub fn list_installed_packages() -> Result<Vec<InstalledRecord>, String> {
    let list_args = vec![
        "list".to_string(),
        "--accept-source-agreements".to_string(),
    ];
    let raw_list = run_winget_capture(&list_args)?;
    let mut records = parse_list_output(&raw_list);

    // Cross-check with `winget upgrade` so only true, actionable upgrades are flagged.
    let upgrade_args = vec![
        "upgrade".to_string(),
        "--accept-source-agreements".to_string(),
    ];
    if let Ok(raw_upgrades) = run_winget_capture(&upgrade_args) {
        let upgrade_rows = parse_list_output(&raw_upgrades);
        let mut upgrade_map: HashMap<String, String> = HashMap::new();
        for row in upgrade_rows {
            if let Some(avail) = row.available_version {
                if is_valid_upgrade_version(&row.version, &avail) {
                    upgrade_map.insert(row.id.to_lowercase(), avail);
                }
            }
        }
        for rec in &mut records {
            rec.available_version = upgrade_map.get(&rec.id.to_lowercase()).cloned();
        }
    } else {
        for rec in &mut records {
            if let Some(avail) = &rec.available_version {
                if !is_valid_upgrade_version(&rec.version, avail) {
                    rec.available_version = None;
                }
            }
        }
    }

    Ok(records)
}

fn is_valid_upgrade_version(current: &str, available: &str) -> bool {
    let cur = current.trim();
    let avail = available.trim();
    if avail.is_empty() || avail.eq_ignore_ascii_case("unknown") || avail == cur {
        return false;
    }
    if avail.starts_with('<') || avail.starts_with('>') {
        return false;
    }
    true
}

pub fn show_package_details(id: &str, source: &str) -> Result<PackageDetails, String> {
    let mut args = vec![
        "show".to_string(),
        "--id".to_string(),
        id.to_string(),
        "--exact".to_string(),
        "--accept-source-agreements".to_string(),
    ];
    if source == "winget" || source == "msstore" {
        args.push("--source".to_string());
        args.push(source.to_string());
    }

    let raw = run_winget_capture(&args)?;
    Ok(parse_show_output(id, source, &raw))
}

fn clean_terminal_line(raw_line: &str) -> String {
    raw_line
        .split('\r')
        .map(|part| part.trim_end())
        .filter(|part| {
            let t = part.trim();
            !t.is_empty() && t != "-" && t != "\\" && t != "|" && t != "/"
        })
        .last()
        .unwrap_or("")
        .to_string()
}

fn char_slice(chars: &[char], start: usize, end: Option<usize>) -> String {
    if start >= chars.len() {
        return String::new();
    }
    let stop = end.unwrap_or(chars.len()).min(chars.len());
    if stop <= start {
        return String::new();
    }
    chars[start..stop].iter().collect::<String>().trim().to_string()
}

fn find_header_columns(lines: &[String]) -> Option<(usize, Vec<(String, usize)>)> {
    for idx in 0..lines.len().saturating_sub(1) {
        let header = &lines[idx];
        let sep = lines[idx + 1].trim();
        let is_sep = sep.len() >= 10 && sep.chars().all(|c| c == '-' || c == ' ');
        if !is_sep {
            continue;
        }
        if !header.contains("Name") || !header.contains("Id") {
            continue;
        }

        let header_chars: Vec<char> = header.chars().collect();
        let mut cols: Vec<(String, usize)> = Vec::new();
        for key in ["Name", "Id", "Version", "Available", "Match", "Source"] {
            if let Some(byte_pos) = header.find(key) {
                let char_pos = header[..byte_pos].chars().count();
                cols.push((key.to_string(), char_pos));
            }
        }
        cols.sort_by_key(|(_, pos)| *pos);
        if cols.len() >= 3 && !header_chars.is_empty() {
            return Some((idx + 2, cols));
        }
    }
    None
}

pub fn parse_search_output(raw: &str, requested_source: &str) -> Vec<PackageItem> {
    let lines: Vec<String> = raw.lines().map(clean_terminal_line).filter(|l| !l.is_empty()).collect();
    let Some((start_idx, cols)) = find_header_columns(&lines) else {
        return Vec::new();
    };

    let col_pos = |name: &str| -> Option<(usize, Option<usize>)> {
        let i = cols.iter().position(|(k, _)| k == name)?;
        let start = cols[i].1;
        let end = cols.get(i + 1).map(|(_, p)| *p);
        Some((start, end))
    };

    let mut results = Vec::new();
    for line in &lines[start_idx..] {
        let trimmed = line.trim();
        if trimmed.is_empty() || trimmed.starts_with("No package found") {
            continue;
        }
        let chars: Vec<char> = line.chars().collect();
        let name = col_pos("Name").map(|(s, e)| char_slice(&chars, s, e)).unwrap_or_default();
        let id = col_pos("Id").map(|(s, e)| char_slice(&chars, s, e)).unwrap_or_default();
        let version = col_pos("Version").map(|(s, e)| char_slice(&chars, s, e)).unwrap_or_default();
        let source_col = col_pos("Source").map(|(s, e)| char_slice(&chars, s, e)).unwrap_or_default();

        if id.is_empty() || id.contains(' ') {
            continue;
        }

        let source = if !source_col.is_empty() {
            source_col
        } else if requested_source == "msstore" || (id.len() == 12 && id.chars().all(|c| c.is_ascii_alphanumeric()) && !id.contains('.')) {
            "msstore".to_string()
        } else {
            "winget".to_string()
        };

        let store_url = if source == "msstore" {
            Some(format!("ms-windows-store://pdp/?ProductId={id}"))
        } else {
            None
        };

        results.push(PackageItem {
            id,
            name: if name.is_empty() { "Unnamed".to_string() } else { name },
            version: if version.is_empty() { "Latest".to_string() } else { version },
            available_version: None,
            source,
            is_installed: false,
            has_update: false,
            category: None,
            summary: None,
            publisher: None,
            tags: Vec::new(),
            store_url,
        });
    }

    results
}

pub fn parse_list_output(raw: &str) -> Vec<InstalledRecord> {
    let lines: Vec<String> = raw.lines().map(clean_terminal_line).filter(|l| !l.is_empty()).collect();
    let Some((start_idx, cols)) = find_header_columns(&lines) else {
        return Vec::new();
    };

    let col_pos = |name: &str| -> Option<(usize, Option<usize>)> {
        let i = cols.iter().position(|(k, _)| k == name)?;
        let start = cols[i].1;
        let end = cols.get(i + 1).map(|(_, p)| *p);
        Some((start, end))
    };

    let mut records = Vec::new();
    let mut seen = std::collections::HashSet::new();
    for line in &lines[start_idx..] {
        let trimmed = line.trim();
        if trimmed.is_empty()
            || trimmed.starts_with("No installed package")
            || trimmed.ends_with("upgrades available.")
            || trimmed.ends_with("upgrade available.")
            || trimmed.contains("package(s) have version numbers")
            || trimmed.contains("cannot be determined")
        {
            continue;
        }
        let chars: Vec<char> = line.chars().collect();
        let name = col_pos("Name").map(|(s, e)| char_slice(&chars, s, e)).unwrap_or_default();
        let id = col_pos("Id").map(|(s, e)| char_slice(&chars, s, e)).unwrap_or_default();
        let version = col_pos("Version").map(|(s, e)| char_slice(&chars, s, e)).unwrap_or_default();
        let available = col_pos("Available")
            .map(|(s, e)| char_slice(&chars, s, e))
            .filter(|v| is_valid_upgrade_version(&version, v));
        let source = col_pos("Source")
            .map(|(s, e)| char_slice(&chars, s, e))
            .filter(|s| !s.is_empty())
            .unwrap_or_else(|| "local".to_string());

        if id.is_empty() || id.contains(' ') {
            continue;
        }

        let dedup_key = format!("{}|{}|{}", id.to_lowercase(), version, source.to_lowercase());
        if !seen.insert(dedup_key) {
            continue;
        }

        records.push(InstalledRecord {
            id,
            name: if name.is_empty() { "Unknown".to_string() } else { name },
            version: if version.is_empty() { "-".to_string() } else { version },
            available_version: available,
            source,
        });
    }

    records
}

pub fn parse_show_output(id: &str, source: &str, raw: &str) -> PackageDetails {
    let mut name = id.to_string();
    let mut version = "Latest".to_string();
    let mut publisher = None;
    let mut publisher_url = None;
    let mut homepage = None;
    let mut license = None;
    let mut description = None;
    let mut installer_type = None;
    let mut installer_url = None;

    for raw_line in raw.lines() {
        let line = clean_terminal_line(raw_line);
        if let Some(rest) = line.strip_prefix("Found ") {
            if let Some((pkg_name, _)) = rest.rsplit_once('[') {
                name = pkg_name.trim().to_string();
            }
        } else if let Some((k, v)) = line.split_once(':') {
            let key = k.trim();
            let val = v.trim();
            if val.is_empty() {
                continue;
            }
            match key {
                "Version" => version = val.to_string(),
                "Publisher" => publisher = Some(val.to_string()),
                "Publisher Url" => publisher_url = Some(val.to_string()),
                "Homepage" => homepage = Some(val.to_string()),
                "License" => license = Some(val.to_string()),
                "Description" | "Short Description" => {
                    if description.is_none() {
                        description = Some(val.to_string());
                    }
                }
                "Installer Type" => installer_type = Some(val.to_string()),
                "Installer Url" => installer_url = Some(val.to_string()),
                _ => {}
            }
        }
    }

    let store_url = if source == "msstore" {
        Some(format!("ms-windows-store://pdp/?ProductId={id}"))
    } else {
        None
    };

    PackageDetails {
        id: id.to_string(),
        name,
        version,
        publisher,
        publisher_url,
        homepage,
        license,
        description,
        installer_type,
        installer_url,
        source: source.to_string(),
        store_url,
        raw_output: raw.to_string(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_winget_search_with_spinners_and_msstore() {
        let sample = "\r   - \r   \\ \rName                             Id                               Version          Match            Source\n----------------------------------------------------------------------------------------------------------\nVisual Studio Code               Microsoft.VisualStudioCode       1.95.2                            winget\nWhatsApp                         9NKSQGP7F2NH                     Unknown                           msstore\n7-Zip 24.08 (x64)                7zip.7zip                        24.08            Tag: zip         winget\n";
        let items = parse_search_output(sample, "all");
        assert_eq!(items.len(), 3);
        assert_eq!(items[0].id, "Microsoft.VisualStudioCode");
        assert_eq!(items[0].source, "winget");
        assert_eq!(items[1].id, "9NKSQGP7F2NH");
        assert_eq!(items[1].source, "msstore");
        assert_eq!(
            items[1].store_url.as_deref(),
            Some("ms-windows-store://pdp/?ProductId=9NKSQGP7F2NH")
        );
        assert_eq!(items[2].version, "24.08");
    }

    #[test]
    fn parses_winget_list_with_available_updates() {
        let sample = "Name                             Id                               Version          Available        Source\n----------------------------------------------------------------------------------------------------------\nGoogle Chrome                    Google.Chrome                    130.0.1          131.0.2          winget\nEarTrumpet                       9NBLGGH5L9XT                     2.3.0.0                           msstore\n";
        let rows = parse_list_output(sample);
        assert_eq!(rows.len(), 2);
        assert_eq!(rows[0].id, "Google.Chrome");
        assert_eq!(rows[0].available_version.as_deref(), Some("131.0.2"));
        assert_eq!(rows[1].id, "9NBLGGH5L9XT");
        assert_eq!(rows[1].available_version, None);
        assert_eq!(rows[1].source, "msstore");
    }

    #[test]
    fn parses_winget_show_metadata() {
        let sample = "Found Microsoft PowerToys [Microsoft.PowerToys]\nVersion: 0.86.0\nPublisher: Microsoft Corporation\nHomepage: https://aka.ms/powertoys\nLicense: MIT\nDescription: Windows system utilities to maximize productivity\nInstaller Type: burn\n";
        let details = parse_show_output("Microsoft.PowerToys", "winget", sample);
        assert_eq!(details.name, "Microsoft PowerToys");
        assert_eq!(details.version, "0.86.0");
        assert_eq!(details.license.as_deref(), Some("MIT"));
        assert_eq!(details.installer_type.as_deref(), Some("burn"));
        assert_eq!(details.store_url, None);
    }

    #[test]
    fn strips_footer_invalid_versions_and_duplicates() {
        let sample = "Name                             Id                               Version          Available        Source\n----------------------------------------------------------------------------------------------------------\nApp Installer                    Microsoft.AppInstaller           1.29.379.0       1.29.380         winget\nWindowsAppRuntime.1.8            Microsoft.WindowsAppRuntime.1.8  1.8.10           1.8.10           winget\nWindowsAppRuntime.1.8            Microsoft.WindowsAppRuntime.1.8  1.8.10           1.8.10           winget\nUnknown Pkg                      Acme.Unknown                     Unknown          < 2.0.0          winget\n1 upgrades available.\n";
        let rows = parse_list_output(sample);
        assert_eq!(rows.len(), 3);
        assert_eq!(rows[0].available_version.as_deref(), Some("1.29.380"));
        assert_eq!(rows[1].available_version, None);
        assert_eq!(rows[2].available_version, None);
    }
}

const fs = require('fs');
let c = fs.readFileSync('src-tauri/src/lib.rs', 'utf8');

c = c.split(/\r?\n/).join('\n'); // Normalize

c = c.replace(
`    let mut system = System::new_all();
    system.refresh_all();`,
`    let mut system = System::new();
    system.refresh_cpu_specifics(sysinfo::CpuRefreshKind::everything());
    system.refresh_memory();`
);

c = c.replace(
`    let mut system = System::new_all();
    system.refresh_all();`,
`    let mut system = System::new();
    system.refresh_cpu_specifics(sysinfo::CpuRefreshKind::everything());
    system.refresh_processes();`
);

c = c.replace(
`    let output = std::process::Command::new("schtasks")
        .args(["/query", "/tn", "FuckACE_AutoStart"])
        .output()
        .map_err(|_| "查询计划任务失败".to_string())?;

    Ok(output.status.success())`,
`    let task_path = std::path::Path::new("C:\\\\Windows\\\\System32\\\\Tasks\\\\FuckACE_AutoStart");
    Ok(task_path.exists())`
);

fs.writeFileSync('src-tauri/src/lib.rs', c);

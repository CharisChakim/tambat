mod hosts;
mod panel;
mod secrets;
mod ssh;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(ssh::SshState::default())
        .manage(panel::PanelState::default())
        .invoke_handler(tauri::generate_handler![
            ssh::ssh_connect,
            ssh::ssh_send,
            ssh::ssh_resize,
            ssh::ssh_disconnect,
            hosts::hosts_list,
            hosts::hosts_save,
            hosts::hosts_delete,
            panel::panel_open,
            panel::panel_list,
            panel::panel_stats,
            panel::panel_open_file,
            panel::panel_transfer,
            panel::panel_mkdir,
            panel::panel_rename,
            panel::panel_delete,
            panel::panel_download,
            panel::panel_close,
            secrets::secret_set,
            secrets::secret_get,
            secrets::secret_delete,
        ])
        .run(tauri::generate_context!())
        .expect("gagal menjalankan aplikasi Tambat");
}
